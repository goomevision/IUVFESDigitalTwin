# BUKU BESAR IUVFES DIGITAL TWIN

## 1. STATUS BASELINE

Dokumen ini adalah living baseline untuk pengembangan IUVFES Digital Twin. Perubahan harus tetap traceable ke source code, commit, evidence, dan status ilmiah.

## 2. PRINSIP UTAMA

- Simulation-derived data, laboratory observations, dan derived/calculated values harus dipisahkan.
- UI tidak boleh menjadi sumber kebenaran physics; engine menjadi sumber state proses.
- Intended command, effective command, dan physical/observed response harus dapat dibedakan.
- Data yang belum diketahui tetap UNKNOWN/N/A, bukan diisi angka rekaan.
- Reduced-order models tidak boleh disebut sebagai validasi eksperimen.
- Parameter yang berasal dari hipotesis harus diberi label hypothesis dan menunggu calibration/validation.

## 3. CLOSED-LOOP PATH

`operator input → closedLoop.run → ClosedLoopSimulationEngine → sensors/state/controller → machine dynamics → causal frame → Process Control Room → replay/evidence → report`

`ProcessSimulator` telah diarahkan ke jalur `closedLoop.run` pada fase systems hardening agar UI proses menggunakan causal closed-loop engine sebagai sumber state.

## 4. HARDWARE STATIC VS OPERATING CONTROL

### Hardware static

Parameter yang harus ditetapkan sebelum run dan tidak berubah selama operasi kecuali eksperimen memang mendefinisikan perubahan hardware:

- connected volume
- thermal mass
- vacuum pump capacity
- outlet pressure
- leak rate
- pipe diameter
- pipe length
- effective length factor
- heating/cooling capacity
- cold-trap geometry/capacity
- ultrasonic installed frequency limits
- ultrasonic maximum power

### Operating control

Parameter yang dapat berubah selama run:

- temperature target/control
- pressure/vacuum target
- heater command
- vacuum pump command
- condenser/cooling command
- ultrasonic operating frequency
- ultrasonic requested power
- duty cycle jika didukung model

## 5. ULTRASONIC — MODEL RESONANSI SELEKTIF (RESEARCH HYPOTHESIS)

Pada systems-hardening branch ditambahkan `server/resonanceSelector.ts` sebagai modul eksperimental yang sengaja **belum dihubungkan ke production closed-loop path**.

Tujuannya adalah menyediakan tempat yang terisolasi untuk menguji hipotesis bahwa respons ekstraksi dapat bergantung pada frekuensi, bandwidth, kondisi vakum, daya, dan karakteristik material.

### 5.1 Frequency selectivity

Model Lorentzian:

`S_i = 1 / (1 + ((f_set - f_0i) / Δf_i)^2)`

`S_i` adalah faktor selektivitas model, bukan bukti bahwa molekul tertentu mempunyai frekuensi resonansi tersebut.

### 5.2 Vacuum envelope

Model eksperimental menerima vapor pressure material/solvent sebagai input:

`E_raw = (P_vapor / P) × exp(-((P - P_opt)/P_opt)^2)`

Untuk coupling numerik digunakan nilai yang dibatasi ke `[0,1]`. Nilai raw tetap disimpan untuk audit.

**Catatan:** formula ini adalah hipotesis reduced-order dan belum merupakan model kavitasi tervalidasi. Jangan menggunakan angka optimal 150 mbar sebagai fakta universal.

### 5.3 Energy-to-release hypothesis

`E_effective,i = E_input × S_i`

`m_released,i = m_available,i × (1 - exp(-E_effective,i / E_bond,i))`

Parameter `E_bond` adalah parameter kalibrasi model, bukan energi ikat molekuler yang boleh langsung dianggap sebagai konstanta material.

### 5.4 Default research targets

Modul menyediakan empat target eksplorasi:

| Target | f0 awal | Bandwidth awal | Status |
|---|---:|---:|---|
| Serat / struktur kasar | 22 kHz | 3 kHz | HYPOTHESIS |
| Lipid / minyak | 45 kHz | 5 kHz | HYPOTHESIS |
| Protein / agregat | 75 kHz | 4 kHz | HYPOTHESIS |
| Air terikat / fraksi volatil | 110 kHz | 8 kHz | HYPOTHESIS |

Angka tersebut berasal dari rancangan eksplorasi, bukan hasil laboratorium IUVFES. Harus diganti atau dikalibrasi dengan data material-specific.

## 6. FOUR FRACTION OUTPUT

Target arsitektur eksperimen adalah empat inventory fraksi terpisah. Namun pemisahan tersebut **belum boleh dianggap selektif secara fisik** sebelum data laboratorium membuktikan cross-selectivity dan recovery.

Setiap fraksi harus dapat menyimpan:

- mass available
- mass released
- mass recovered
- frequency exposure
- power/intensity
- pressure
- temperature
- exposure time
- dataset/provenance
- uncertainty/quality flag

## 7. DATA ULTRASONIC YANG WAJIB DITANGKAP

Untuk setiap eksperimen:

- instrument/vendor/model
- transducer type
- nominal frequency
- measured frequency bila tersedia
- electrical power
- estimated/measured acoustic power bila tersedia
- active area
- intensity W/cm² bila area dan power valid
- amplitude
- duty cycle
- exposure time
- liquid/solvent identity
- vapor pressure bila diketahui
- temperature
- pressure/vacuum
- material identity
- initial mass
- target fraction
- measured output
- analytical method
- operator
- laboratory/run identifier
- provenance

## 8. SCIENTIFIC BOUNDARY

Literature mendukung bahwa frekuensi, power/intensity, temperatur, tekanan, medium, reactor geometry, dan karakteristik matriks dapat memengaruhi cavitation dan ultrasound-assisted extraction. Low-frequency ultrasound sering menghasilkan efek cavitation/sonophysical yang kuat, tetapi frekuensi optimal tetap bergantung pada material dan sistem. Literature tidak mendukung penggunaan universal bahwa 22/45/75/110 kHz masing-masing secara otomatis memilih serat/lipid/protein/air terikat.

Karena itu UI harus menyebut modul resonansi sebagai **Experimental / Hypothesis Model** sampai parameter diperoleh dari eksperimen.

## 9. LITERATURE BASIS ADDED IN SESSION

- Review cavitation/extraction: frekuensi, power density, temperatur, tekanan, solvent dan matrix merupakan faktor penting; frequency optimum bersifat substrate-dependent.
- Review ultrasound extraction: low-frequency/high-intensity dapat menghasilkan shear/mechanical effects yang kuat; intensity dapat dinyatakan `I = P/S`.
- Review cavitation-based treatments: reactor geometry, solvent, temperature, pressure, dissolved gas dan material ikut menentukan hasil.

## 10. NEXT IMPLEMENTATION GATES

1. Tambahkan UI Research Resonance Panel tanpa mengubah physics production.
2. Tampilkan `f0`, bandwidth, selectivity curve, vacuum envelope, effective energy, dan predicted release sebagai **model output**.
3. Sambungkan modul ke closed-loop hanya setelah schema material inventory empat fraksi disepakati.
4. Tambahkan causal-frame fields untuk ultrasonic exposure.
5. Tambahkan empat cold-trap/fraksi output sebagai inventory yang dapat diaudit.
6. Masukkan laboratory dataset dengan provenance.
7. Fit `f0`, bandwidth, dan kinetic parameters terhadap data eksperimen.
8. Pisahkan calibration dataset dari validation dataset.
9. Hanya setelah validation, model boleh dipromosikan dari HYPOTHESIS ke CALIBRATED/VALIDATED sesuai evidence.

## 11. RULE UNTUK AI/DEVELOPER BERIKUTNYA

Sebelum mengubah engine:

1. Baca Buku Besar ini.
2. Baca source module yang akan diubah.
3. Bedakan implemented / hypothesis / calibrated / validated.
4. Jangan menimpa data laboratory dengan simulation.
5. Jangan mengubah formula hanya karena UI membutuhkan angka.
6. Jika parameter belum diketahui, gunakan UNKNOWN/N/A atau parameter eksperimen yang eksplisit.
7. Setiap perubahan engine harus menghasilkan commit kecil dan dapat ditelusuri.
8. Setelah perubahan, update Buku Besar dengan commit dan status baru.

## 12. CHECKPOINT

- Baseline control-room refactor: `feature/control-room-ui-final9`
- Systems hardening branch: `feature/control-room-ui-systems-hardening`
- Closed-loop UI integration commit: `88d9c062bb2ee7bdee5276135a21787b9cc0d80a`
- Resonance selector hypothesis module: `32dc4c7edd3a6d3ce2f1417c4fdb1f5cdd27409a`

## 13. STATUS SAAT INI

🟢 Closed-loop engine tersedia.

🟢 Process Control Room diarahkan ke closed-loop route.

🟢 Causal frame dasar tersedia.

🟢 Dynamic actuator response tersedia sebagai reduced-order simulation.

🟡 Ultrasonic resonance selector tersedia sebagai modul riset terisolasi.

🟡 Hardware → ultrasonic → material inventory belum menjadi closed-loop validated path.

🔴 Frequency-to-molecular-fraction mapping belum tervalidasi.

🔴 Laboratory calibration belum selesai.

🔴 Experimental validation belum selesai.

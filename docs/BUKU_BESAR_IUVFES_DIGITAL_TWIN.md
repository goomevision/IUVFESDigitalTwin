# BUKU BESAR IUVFES DIGITAL TWIN

## 1. STATUS BASELINE

Dokumen ini adalah living baseline untuk pengembangan IUVFES Digital Twin. Perubahan harus tetap traceable ke source code, commit, evidence, dan status ilmiah.

Tujuan sistem tetap: membangun **laboratorium virtual/digital twin yang dapat belajar dari data**, bukan simulator yang mengarang jawaban. Sistem harus mampu menunjukkan apa yang diketahui, apa yang dihitung, apa yang masih berupa hipotesis, dan apa yang belum diketahui.

## 2. PRINSIP UTAMA

- Simulation-derived data, laboratory observations, literature observations, dan derived/calculated values harus dipisahkan.
- UI tidak boleh menjadi sumber kebenaran physics; engine menjadi sumber state proses.
- Intended command, effective command, dan physical/observed response harus dapat dibedakan.
- Data yang belum diketahui tetap UNKNOWN/N/A, bukan diisi angka rekaan.
- Reduced-order models tidak boleh disebut sebagai validasi eksperimen.
- Parameter yang berasal dari hipotesis harus diberi label hypothesis dan menunggu calibration/validation.
- Reported operating frequency dari literatur tidak otomatis menjadi `f0`/resonance fingerprint.
- Material Profile harus versioned dan tidak boleh menimpa sejarah profil sebelumnya.
- Confidence harus menyimpan metode/asalnya; confidence literatur tidak sama dengan confidence model resonansi.
- Data seed literatur menjadi baseline evidence, bukan pengganti frequency sweep laboratorium.

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

## 8. SCIENTIFIC DATA FOUNDATION — NEW BASELINE

Fondasi data telah ditambahkan pada branch systems-hardening:

- `types/scientificData.ts` — kontrak TypeScript untuk Material, Provenance, ExtractionProtocol, ExperimentRecord, MaterialGap, FrequencySweep, SweepPoint, DetectedPeak, MaterialProfile, FractionProfile, dan ExperimentRecommendation.
- `db/migrations/001_scientific_foundation.sql` — kontrak PostgreSQL untuk entitas dan relasi tersebut.
- `docs/MATERIAL_KNOWLEDGE_BASE_SEED.md` — seed literature untuk 20 material/tanaman yang dibahas.

### 8.1 Relasi inti

`MATERIAL 1:N EXPERIMENT_RECORD`

`EXPERIMENT_RECORD N:1 PROVENANCE`

`EXPERIMENT_RECORD N:1 EXTRACTION_PROTOCOL`

`FREQUENCY_SWEEP 1:N SWEEP_POINT`

`FREQUENCY_SWEEP 1:N DETECTED_PEAK`

`MATERIAL 1:N MATERIAL_GAP`

`MATERIAL 1:N MATERIAL_PROFILE`

`MATERIAL_PROFILE 1:N FRACTION_PROFILE`

`MATERIAL 1:N EXPERIMENT_RECOMMENDATION`

Peak adalah properti dari keseluruhan sweep, sehingga tidak ada relasi langsung `SWEEP_POINT → DETECTED_PEAK`.

### 8.2 Status pengetahuan

Setiap data dapat diklasifikasikan:

- `OBSERVED`
- `DERIVED`
- `HYPOTHESIS`
- `MODEL_FIT`
- `VALIDATED`

Dengan evidence level:

- `LITERATURE`
- `LABORATORY`
- `SIMULATION`
- `MULTI_SOURCE`

Dan validation status:

- `UNKNOWN`
- `UNTESTED`
- `SUPPORTED`
- `CONTRADICTED`

### 8.3 UNKNOWN adalah status valid

Parameter seperti `f0`, bandwidth, Q-factor, acoustic intensity, cavitation response, dan fraction identity boleh bernilai `NULL/UNKNOWN`. Sistem dilarang memakai angka sentinel seperti `0` atau `-1` untuk menyamarkan ketidaktahuan.

## 9. MATERIAL KNOWLEDGE BASE — LITERATURE SEED

Seed awal terdiri dari 20 material/tanaman yang dibahas dalam sesi ini: Rosella, Bunga Telang, Kamboja, Bunga Lawang, Cengkeh, Nilam, Sirsak, Kunyit, Kemangi, Pandan, Salam, Jeruk Purut, Bandotan, Jahe, Temulawak, Ki Lemo, Kayu Manis, Sereh Dapur, Jotang, dan Manggis.

Seed tersebut disimpan sebagai **literature/reference evidence**, bukan resonance fingerprint. Detail field dan batasannya ada di `docs/MATERIAL_KNOWLEDGE_BASE_SEED.md`.

### 9.1 Prioritas awal

1. Nilam — parameter UAE relatif lengkap dan output kuantitatif.
2. Bunga Telang — output flavonoid/polifenol kuantitatif.
3. Rosella — yield dan antioxidant output kuantitatif.
4. Salam — reported 40 kHz UAE dan output biologis.
5. Temulawak — UAE + RSM dengan rentang power/time.

Prioritas ini adalah prioritas **data-entry/experimental-readiness**, bukan klaim nilai ilmiah absolut.

### 9.2 Aturan frequency field

Field `reported experimental frequency` tidak boleh dipetakan otomatis menjadi `f0`. Jika sumber tidak melaporkan frekuensi, field tetap `UNKNOWN`. Jika metode bukan UAE, frequency response tidak boleh dianggap tersedia.

## 10. MATERIAL KNOWLEDGE LAYERS

Untuk setiap material, sistem membedakan:

1. **Composition knowledge** — senyawa/komposisi yang dilaporkan.
2. **Extraction/process knowledge** — protokol dan kondisi operasi yang dilaporkan.
3. **Response knowledge** — respons terhadap sweep/variasi parameter yang benar-benar diukur.
4. **Resonance/fingerprint knowledge** — parameter hasil analisis sweep yang memiliki evidence dan status model/validasi.

Dengan demikian sebuah material dapat memiliki komposisi yang diketahui tetapi `f0 = UNKNOWN`.

## 11. MATERIAL PROFILE VERSIONING

`MATERIAL_PROFILE` harus versioned:

`v001 → v002 → v003 ...`

Profil lama tidak ditimpa. Status dapat `DRAFT`, `ACTIVE`, atau `DEPRECATED`, dengan hubungan `superseded_by` untuk penelusuran sejarah.

AI menggunakan profil `ACTIVE` untuk inference hanya sesuai evidence/statusnya. Pergantian profile harus dapat ditelusuri ke eksperimen/provenance yang menjadi basisnya.

## 12. FREQUENCY SWEEP & PEAK ANALYSIS

Alur yang dituju:

`Frequency Sweep → raw SweepPoint → quality check → smoothing/normalization → peak detection → prominence/SNR → FWHM/curve fitting → DetectedPeak → MaterialProfile`

Sistem **tidak memaksa empat peak**. Jumlah peak dapat 0, 1, 2, 3, 4, atau lebih sesuai data dan threshold yang ditentukan.

`DetectedPeak` adalah hasil analisis curve sweep dan harus menyimpan confidence, metode fitting, dan knowledge status.

## 13. EXPERIMENTAL PLANNER

Experimental Planner bertujuan memilih eksperimen yang paling informatif untuk mengurangi ketidakpastian, bukan menghasilkan jawaban fisika tanpa data.

Tahapan:

`existing evidence → uncertainty map → candidate experiment → information gain/priority → operator decision → laboratory run → import → model update`

Gaussian Process atau metode surrogate lain dapat digunakan sebagai model planner setelah data mencukupi. Planner tidak boleh menganggap hasil simulation sebagai laboratory validation.

## 14. SCIENTIFIC BOUNDARY

Literature dapat mendukung bahwa frekuensi, power/intensity, temperatur, tekanan, medium, reactor geometry, dan karakteristik matriks dapat memengaruhi cavitation dan ultrasound-assisted extraction. Namun tidak boleh disimpulkan secara universal bahwa 22/45/75/110 kHz masing-masing memilih serat/lipid/protein/air terikat.

Karena itu:

`reported frequency ≠ resonance frequency`

`peak response ≠ automatically molecular resonance`

`model fit ≠ validation`

`simulation ≠ laboratory observation`

`literature confidence ≠ resonance confidence`

## 15. NEXT IMPLEMENTATION GATES

1. Hubungkan schema scientific foundation ke persistence layer aplikasi setelah adapter database yang sesuai dengan stack repository dikonfirmasi.
2. Tambahkan import pipeline untuk literature seed dengan provenance.
3. Tambahkan Material Knowledge UI tanpa mengubah production physics.
4. Tambahkan Research Resonance Panel untuk menampilkan model output secara eksplisit sebagai hypothesis/model.
5. Tambahkan Frequency Sweep storage dan analyzer.
6. Tambahkan causal-frame fields untuk ultrasonic exposure.
7. Tambahkan empat fraction inventories dan cold-trap evidence secara audit-able.
8. Import laboratory datasets dengan provenance dan uncertainty.
9. Pisahkan calibration dataset dari validation dataset.
10. Fit material-specific parameters terhadap data eksperimen.
11. Hanya setelah validation, model dapat dipromosikan sesuai evidence.

## 16. RULE UNTUK AI/DEVELOPER BERIKUTNYA

Sebelum mengubah engine:

1. Baca Buku Besar ini.
2. Baca source module yang akan diubah.
3. Bedakan implemented / hypothesis / calibrated / validated.
4. Jangan menimpa data laboratory dengan simulation.
5. Jangan mengubah formula hanya karena UI membutuhkan angka.
6. Jika parameter belum diketahui, gunakan UNKNOWN/N/A atau parameter eksperimen yang eksplisit.
7. Jangan mengubah reported frequency menjadi f0 tanpa sweep evidence.
8. Jangan memaksa empat peak/fraction jika data tidak mendukungnya.
9. Setiap perubahan engine harus menghasilkan commit kecil dan dapat ditelusuri.
10. Setelah perubahan, update Buku Besar dengan commit dan status baru.

## 17. CHECKPOINT

- Baseline control-room refactor: `feature/control-room-ui-final9`
- Systems hardening branch: `feature/control-room-ui-systems-hardening`
- Closed-loop UI integration commit: `88d9c062bb2ee7bdee5276135a21787b9cc0d80a`
- Resonance selector hypothesis module: `32dc4c7edd3a6d3ce2f1417c4fdb1f5cdd27409a`
- Scientific data contracts: `8f27d9d56c3e47d2092ec178907dab3a32aa9974`
- Literature seed: `d23a6d0d57049447559ccde53e8aad3c5dc3308b`
- PostgreSQL foundation migration: `9f03fe4db2eba57bb300a52ab5639552675bc1f6`

## 18. STATUS SAAT INI

🟢 Closed-loop engine tersedia.

🟢 Process Control Room diarahkan ke closed-loop route.

🟢 Causal frame dasar tersedia.

🟢 Dynamic actuator response tersedia sebagai reduced-order simulation.

🟢 Scientific data contracts dan PostgreSQL foundation schema sudah dibuat sebagai kontrak terpisah.

🟢 Literature seed 20 material sudah didokumentasikan dengan batas evidence.

🟡 Persistence adapter aplikasi belum dihubungkan karena stack database runtime harus dikonfirmasi dari source sebelum mengubah runtime.

🟡 Ultrasonic resonance selector tersedia sebagai modul riset terisolasi.

🟡 Frequency sweep analyzer dan Material Trainer UI belum menjadi production path.

🟡 Hardware → ultrasonic → material inventory belum menjadi closed-loop validated path.

🔴 Frequency-to-molecular-fraction mapping belum tervalidasi.

🔴 Laboratory calibration belum selesai.

🔴 Experimental validation belum selesai.

## 19. DEFINISI SELESAI

IUVFES tidak dianggap selesai hanya karena UI dapat menampilkan angka. Sistem dianggap mencapai scientific-ready milestone ketika:

- setiap angka memiliki provenance;
- simulation, laboratory, derived, literature, dan hypothesis terpisah;
- hardware static dan operating control terpisah;
- causal frame merekam sebab-akibat proses;
- frequency sweep dapat direkam tanpa kehilangan raw data;
- peak analysis dapat direproduksi;
- material profile memiliki version history;
- unknown/gap dapat ditampilkan dan diprioritaskan;
- calibration dan validation dataset terpisah;
- model dapat dibandingkan terhadap observasi laboratorium;
- dan setiap klaim ilmiah dapat ditelusuri kembali ke evidence yang mendasarinya.

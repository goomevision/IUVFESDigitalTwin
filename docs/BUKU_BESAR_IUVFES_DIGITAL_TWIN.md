# BUKU BESAR — IUVFES DIGITAL TWIN

**Dokumen kendali / handover / baseline arsitektur**  
**Repository:** `goomevision/IUVFESDigitalTwin`  
**Branch kerja yang menjadi konteks pengembangan:** `feature/control-room-ui`  
**Latest checkpoint yang dilaporkan:** `3d9ae892` — Component Refactoring & rAF Cleanup  
**Status dokumen:** Living document — wajib diperbarui ketika code, model, UI, data, atau hasil audit berubah.

---

## 0. TUJUAN BUKU BESAR

Buku Besar ini adalah **sumber patokan lintas sesi dan lintas AI** untuk memahami apa yang sedang dibangun, apa yang sudah benar-benar ada di code, apa yang belum selesai, batas ilmiah sistem, hubungan antar-komponen, serta pekerjaan berikutnya.

Prinsip utama:

1. Jangan menganggap fitur sudah ada hanya karena desain/mockup menginginkannya.
2. Jangan mengarang nilai, rumus, data laboratorium, validasi, atau kemampuan hardware yang belum didukung source code.
3. Bedakan dengan tegas **data simulasi**, **data observasi/laboratorium nyata**, dan **hasil turunan/derived**.
4. `UNKNOWN` / `N/A` tetap sah dan lebih baik daripada mengisi angka fiktif.
5. UI adalah wajah sistem, tetapi **engine/model adalah sumber state dan perhitungan**.
6. `Intended command`, `effective command`, dan `physical response` harus tetap dapat dibedakan.
7. Setiap perubahan penting harus dapat ditelusuri ke source, commit, frame, dataset, atau evidence.
8. Dokumen ini adalah baseline yang berkembang; AI sesi berikutnya wajib membaca dokumen ini sebelum melanjutkan pekerjaan yang terkait IUVFES.

---

# 1. APA YANG SEDANG DIBANGUN

IUVFES sedang dibangun sebagai **Digital Twin / Closed-Loop Scientific Process Simulator** yang bukan sekadar animasi UI.

Sistem ditujukan untuk:

- menerima parameter eksperimen dan konfigurasi hardware;
- menjalankan model proses closed-loop;
- menghubungkan sensor → state → controller → actuator/control output → machine dynamics → physical/observed sensor;
- menyimpan causal frame sebagai bukti langkah proses;
- menampilkan kondisi proses secara live pada Control Room;
- menyediakan replay dan evidence;
- menghasilkan laporan/jurnal dengan provenance;
- menerima data laboratorium nyata secara terpisah;
- menggunakan data laboratorium untuk kalibrasi dan kemudian validasi model;
- memperkaya database sehingga model dan AI dapat berkembang berdasarkan evidence yang makin kaya.

Target akhirnya bukan sekadar simulator visual, tetapi **infrastruktur digital twin yang dapat ditelusuri, dijelaskan, direplay, dikalibrasi, dan divalidasi**.

---

# 2. PRINSIP ILMIAH / DATA BOUNDARY

## 2.1 Tiga kelas data yang wajib dipisahkan

### A. DATA LABORATORIUM NYATA
Data yang berasal dari percobaan fisik/laboratorium.

Contoh:
- suhu sensor nyata;
- tekanan/vakum nyata;
- frekuensi dan daya ultrasonic nyata;
- massa bahan awal;
- kadar air/kadar minyak hasil pengujian;
- massa hasil ekstraksi;
- waktu proses;
- konsumsi energi nyata;
- konfigurasi hardware nyata;
- operator, tanggal, alat, sensor, metode, dan identitas eksperimen.

Data ini **tidak boleh ditimpa oleh simulasi**.

### B. DATA SIMULASI
Data yang dihasilkan oleh ClosedLoopSimulationEngine.

Contoh:
- simulated temperature;
- simulated pressure;
- simulated yield;
- simulated oil/water recovery;
- simulated energy;
- simulated controller response;
- simulated causal frames.

Data ini harus diberi provenance `SIMULATION` atau label setara.

### C. DATA DERIVED / ANALYTICS
Nilai yang dihitung dari data sumber, misalnya:
- recovery %;
- conductance;
- effective pump capacity;
- power density;
- cold-trap thermal capacity;
- SHAP/contribution;
- residual/error;
- mass balance;
- energy balance.

Derived value tidak boleh diperlakukan sebagai pengukuran langsung.

---

# 3. ARSITEKTUR CLOSED-LOOP

Alur utama:

```text
EXPERIMENT / INPUT
        ↓
CLOSED-LOOP SIMULATION ENGINE
        ↓
SENSOR STATE
        ↓
PROCESS STATE + INTERLOCK
        ↓
CONTROLLER / CONTROL OUTPUT
        ↓
INTENDED COMMAND → EFFECTIVE COMMAND
        ↓
THERMAL + VACUUM + ULTRASONIC + MACHINE DYNAMICS
        ↓
PHYSICAL / OBSERVED SENSOR
        ↓
CAUSAL FRAME
        ↓
3D • LIVE TREND • TIMELINE • CAUSAL INSPECTOR • REPLAY
        ↓
EVIDENCE / SCIENTIFIC REPORT
        ↓
LABORATORY DATA
        ↓
CALIBRATION
        ↓
VALIDATION
```

Closed-loop berarti hasil suatu langkah menjadi kondisi yang memengaruhi langkah berikutnya, bukan sekadar menghitung satu hasil akhir.

---

# 4. KOMPONEN CORE YANG SUDAH TERIDENTIFIKASI

## 4.1 ClosedLoopSimulationEngine

Fungsi utama yang telah diidentifikasi:

- membuat dan menjalankan closed-loop;
- menyimpan state;
- melakukan step berdasarkan `dt`;
- memproses sensor/controller/dynamics;
- menghasilkan `CausalFrame`;
- menyimpan frame untuk replay;
- mendukung snapshot/restore;
- membawa material inventory;
- membawa safety frame;
- membawa ultrasonic data;
- membawa hardware diagnostics.

## 4.2 Machine Dynamics

Mencakup hubungan model proses untuk:

- thermal dynamics;
- vacuum dynamics;
- material/extraction dynamics;
- ultrasonic coupling;
- cold-trap dynamics;
- hardware diagnostics.

## 4.3 Causal Frame

Frame causal harus menjadi unit evidence penting.

Frame dapat memuat konsep:

- sensor before;
- controller action;
- control output;
- intended commands;
- effective commands;
- physicalSensorAfter;
- sensorAfter;
- material inventory;
- safety;
- ultrasonic;
- hardware diagnostics.

---

# 5. UI PROCESS SIMULATOR

`ProcessSimulator.tsx` telah diidentifikasi sebagai pusat Control Room.

Komponen/fitur yang telah diidentifikasi dari pekerjaan sebelumnya:

- operating control;
- start;
- pause/resume;
- stop;
- reset;
- results/print;
- live metrics;
- ProcessMachine3D;
- replay/time-machine;
- LiveProcessTrend;
- CausalFrameInspector;
- ProcessEventTimeline;
- ScientificRunRecorder.

## 5.1 Masalah awal yang ditemukan

- Ada komponen yang di-import tetapi sebelumnya belum tersedia/teridentifikasi lengkap:
  - `ProcessMachine3D`
  - `ProcessEventTimeline`
  - `ScientificRunRecorder`
- Sebelumnya ada data hardcoded dalam interface/frame UI.
- Koneksi langsung ke `ClosedLoopSimulationEngine` belum lengkap pada tahap audit awal.
- Animasi/interaktivitas awal masih minimal.

Pekerjaan refactoring dan rAF cleanup telah dilakukan sampai checkpoint yang dilaporkan `3d9ae892`.

---

# 6. VISUAL CONTROL ROOM YANG DITUJU

Layar proses adalah **wajah utama simulator** dan harus terasa seperti melihat mesin bekerja.

Struktur visual target:

```text
┌───────────────────────────────────────────────────────────────┐
│ IUVFES • RUNNING • SESSION • EXPERIMENT • TIME                │
├───────────────┬───────────────────────────────┬───────────────┤
│ INPUT /        │        PROCESS MACHINE       │ LIVE STATUS   │
│ OPERATING      │                               │              │
│ CONTROL        │ REACTOR                      │ TEMP         │
│                │ ↓ FLOW                       │ PRESSURE     │
│ Temperature    │ COLD TRAP 1                  │ YIELD        │
│ Vacuum         │ COLD TRAP 2                  │ OIL          │
│ Cooling        │ COLD TRAP 3                  │ WATER        │
│ Ultrasonic     │ COLD TRAP 4                  │ ENERGY       │
│                │ ↓                             │              │
│ START/PAUSE    │ VACUUM PUMP                 │ SAFETY       │
│ STOP/RESET     │                               │ HARDWARE     │
├───────────────┴───────────────────────────────┴───────────────┤
│ LIVE TREND • CAUSAL TRACE • EVENT TIMELINE • REPLAY           │
└───────────────────────────────────────────────────────────────┘
```

Prinsip visual:

- kabel/piping harus terlihat tersambung secara logis;
- aliran proses harus dianimasikan;
- nilai harus berubah mengikuti state engine;
- control operator harus mengubah input/command engine;
- perubahan hardware static harus memengaruhi derived engineering values sebelum run;
- alarm/safety harus berasal dari engine/safety kernel, bukan dekorasi;
- grafik harus menggunakan data frame nyata dari run;
- replay harus merekonstruksi frame yang tersimpan.

---

# 7. PEMISAHAN HARDWARE STATIC VS OPERATING CONTROL

Ini adalah keputusan arsitektur penting.

## 7.1 Hardware Static — diisi sebelum operasi

Tidak boleh diubah selama proses berjalan.

Contoh:

- diameter vessel;
- panjang vessel;
- ketebalan dinding;
- material;
- working/connected volume;
- diameter pipa;
- panjang pipa;
- effective length factor;
- pump capacity;
- cold-trap area/volume/capacity;
- ultrasonic min/max frequency;
- ultrasonic max power;
- thermal mass;
- hardware limits lainnya.

## 7.2 Operating Control — dapat dinaik-turunkan saat proses berjalan

Contoh:

- target temperature;
- heater command/limit;
- vacuum command;
- pump command/limit;
- cooling target;
- ultrasonic requested frequency;
- ultrasonic requested power;
- duty cycle;
- waktu operasi;
- pause/resume/stop.

Pemisahan ini mencegah operator mengubah karakteristik fisik mesin secara tidak realistis ketika simulasi sudah berjalan.

---

# 8. HARDWARE → DERIVED PHYSICS → PROCESS

Hubungan yang harus dipertahankan:

```text
DIAMETER + LENGTH
      ↓
PIPE VOLUME + VACUUM CONDUCTANCE
      ↓
EFFECTIVE PUMP CAPACITY
      ↓
VACUUM / PRESSURE BEHAVIOR
      ↓
VACUUM FACTOR
      ↓
EXTRACTION DRIVE
      ↓
YIELD
```

Ultrasonic:

```text
INSTALLED LIMITS
      ↓
EFFECTIVE FREQUENCY + EFFECTIVE POWER
      ↓
POWER DENSITY
      ↓
ACOUSTIC MULTIPLIER
      ↓
EXTRACTION COUPLING
```

Cold trap:

```text
TEMPERATURE + AREA + U
      ↓
Q = U × A × ΔT
      ↓
THERMAL CONDENSATION CAPACITY
      ↓
CONDENSED MASS
```

---

# 9. RUMUS YANG TERIDENTIFIKASI DALAM IMPLEMENTASI

## 9.1 Material Inventory

```text
m_water,initial = m_material × waterContent / 100
m_oil,potential = m_material × oilContent / 100
m_remaining = m_initial − m_water,removed − m_oil,recovered
Recovery (%) = m_oil,recovered / m_oil,potential × 100
```

## 9.2 Thermal Engineering

```text
E_heater = P_heater × η_heater × Δt / 3600
E_cooling = P_cooling × η_cooling × Δt / 3600
P_loss = k_loss × max(0, T − T_ambient)
P_net = P_heater×η_heater − P_cooling×η_cooling − P_loss
T_new = T_old + (P_net × Δt) / C_thermal
```

Batas: reduced-order lumped thermal model.

## 9.3 Vacuum Conductance

```text
r = d / 2
A = πr²
V_pipe = A × L
P_mean = (P₁ + P₂) / 2
L_effective = L × effectiveLengthFactor
C = (π d⁴ P_mean) / (128 μ L_effective)
C_m³/h = C_m³/s × 3600
```

Batas: reduced-order laminar screening; bukan final engineering qualification.

## 9.4 Pump + Conductance

```text
1 / C_effective = 1 / C_pump + 1 / C_line
C_effective = 1 / (1/C_pump + 1/C_line)
```

## 9.5 Vacuum Dynamic

```text
Volume factor = 250 / (connectedVolume + pipeVolume)
Pump factor = C_effective / 200
Vacuum rate = baseVacuumRate × VolumeFactor × PumpFactor
```

## 9.6 Ultrasonic

```text
f_effective = clamp(f_requested, f_min, f_max)
P_effective = min(P_requested, P_max)
Power density (W/L) = P_effective(kW) × 1000 / WorkingVolume(L)
```

Batas: belum merupakan validated cavitation/process correlation.

## 9.7 Extraction Coupling

```text
Thermal factor = clamp((T − 25) / 100, 0, 1)
Vacuum factor = clamp(1 − P / P_ambient, 0, 1)
Extraction drive = Vacuum factor × (0.35 + 0.65 × Thermal factor) × Acoustic multiplier
```

## 9.8 Cold Trap

```text
Q = U × A × ΔT
Thermal capacity = Q / LatentHeat
m_condensed = min(m_incoming, condensateCapacity, thermalCapacity × Δt)
Effectiveness = m_condensed / m_incoming
```

## 9.9 Energy Tracking

```text
E_total ≈ E_heater + E_pump + E_cooling + E_ultrasonic
```

Catatan: energy tracking model belum boleh disebut energy audit hardware nyata.

---

# 10. ULTRASONIC — DATA MINIM SEBAGAI JEMBATAN DATA MASA DEPAN

Ultrasonic sengaja dipertahankan sebagai parameter penting karena data proses ultrasonic masih minim.

Sistem harus memungkinkan operator memasukkan:

- frekuensi;
- daya;
- duty cycle;
- tipe transducer;
- jumlah transducer;
- posisi pemasangan;
- working volume;
- metode coupling;
- kondisi cairan;
- temperatur;
- waktu paparan;
- hasil laboratorium terkait;
- observasi operator;
- dataset/laporan sumber.

Jika operator belum mengetahui nilai tertentu, nilai tetap `UNKNOWN/N/A` dan tidak boleh direkayasa.

Tujuan jangka panjang: data ultrasonic nyata menjadi dataset yang dapat digunakan untuk kalibrasi dan pengembangan model, bukan langsung dianggap sebagai hukum fisika yang sudah tervalidasi.

---

# 11. INPUT OPERATOR AWAL UNTUK EKSPERIMEN

Sebelum run, operator idealnya dapat mengisi satu sesi input yang tidak berulang dengan layar hardware static, operating control, dan laboratory provenance yang terpisah secara logis.

## Identitas eksperimen

- Experiment ID;
- Project/Study ID;
- tanggal/waktu;
- operator;
- reviewer;
- lokasi;
- tujuan eksperimen;
- versi simulator/model;
- commit/version source.

## Bahan

- nama bahan;
- spesies/varietas bila relevan;
- bagian bahan;
- batch/lot;
- massa awal;
- kadar air;
- kadar minyak;
- metode pengukuran;
- kondisi awal;
- data analisis laboratorium.

## Hardware

- identitas alat;
- material;
- dimensi;
- volume;
- pipa;
- pompa;
- heating/cooling;
- cold trap;
- ultrasonic;
- sensor;
- batas hardware;
- sertifikat/dokumen pendukung.

## Data laboratorium

- dataset ID;
- sumber;
- metode;
- instrumen;
- operator lab;
- timestamp;
- raw measurement;
- uncertainty bila tersedia;
- file bukti;
- catatan.

Semakin lengkap input, semakin kuat provenance; tetapi data yang belum diketahui tidak boleh dipalsukan.

---

# 12. SCIENTIFIC OUTPUT / JURNAL

Dari satu run, target output ilmiah lengkap meliputi:

1. Identitas eksperimen.
2. Identitas operator.
3. Tujuan.
4. Bahan dan karakterisasi.
5. Hardware configuration.
6. Operating parameters.
7. Data laboratory input.
8. Data simulation.
9. Sensor time-series.
10. Controller actions.
11. Intended vs effective command.
12. Physical/observed response.
13. Causal frames.
14. Event timeline.
15. Mass balance.
16. Energy balance.
17. Extraction yield/recovery.
18. Cold-trap fractions.
19. Ultrasonic record.
20. Vacuum/thermal history.
21. Safety/alarm history.
22. Derived engineering values.
23. Uncertainty/quality notes bila tersedia.
24. Simulation-vs-laboratory comparison bila tersedia.
25. Calibration status bila dilakukan.
26. Validation status bila dilakukan.
27. Limitations.
28. Reproducibility/evidence metadata.
29. Grafik.
30. Lampiran data mentah.

Jurnal tidak boleh menyatakan validasi jika validasi belum dilakukan.

---

# 13. STATUS KOMPONEN

| Komponen | Status | Keterangan |
|---|---|---|
| Closed-loop engine | 🟢 | Core loop sudah teridentifikasi |
| Causal Frame | 🟢 | Before/after, commands, safety, inventory tersedia |
| Thermal model | 🟢 | Reduced-order thermal equations |
| Vacuum model | 🟢 | Conductance + pump coupling |
| Ultrasonic | 🟢 | Hardware limits + power density + coupling |
| Cold trap | 🟢 | Thermal capacity model |
| Material tracking | 🟢 | Water/oil inventory + recovery |
| Energy tracking | 🟡 | Ada, perlu balance/evidence lebih lengkap |
| Operating Control UI | 🟢 | Target/actuator control telah dipetakan |
| ProcessMachine3D | 🟡 | Menjadi hero visual yang harus terhubung penuh ke frame |
| ProcessEventTimeline | 🟡 | Harus merefleksikan event/frame nyata |
| ScientificRunRecorder | 🟡 | Harus dipastikan evidence lengkap dan reproducible |
| Hardware Configuration UI | 🟡 | Engine field sudah menjadi dasar; UI lengkap masih perlu disempurnakan |
| Derived Hardware Inspector | 🟡 | Perlu ditampilkan jelas sebelum run |
| Laboratory Dataset Workflow | 🔴 | Belum boleh dianggap selesai |
| Calibration workflow | 🔴 | Belum boleh dianggap tersedia |
| Formal validation workflow | 🔴 | Belum boleh dianggap tersedia |
| Real-time hardware integration | 🔴 | Belum boleh dianggap tersedia tanpa connector/sensor nyata |

---

# 14. VISUAL REFERENCE YANG TELAH DIBUAT

Telah dibuat ilustrasi visual/infografik yang merangkum:

- arsitektur IUVFES;
- closed-loop workflow;
- core physics;
- controller;
- causal inference;
- replay/evidence;
- UI yang sudah ada;
- hardware configuration yang perlu dibangun;
- rumus utama;
- status komponen;
- hardware target;
- roadmap.

**Penting:** visual tersebut adalah **visualisasi arsitektur dan target UI**, bukan pengganti source code. Jika visual berbeda dengan code, source code menjadi sumber kebenaran sampai dilakukan perubahan yang terdokumentasi.

---

# 15. ROADMAP PENYEMPURNAAN

```text
01  Hardware Configuration lengkap
        ↓
02  Hardware Validation Preview / Derived Values
        ↓
03  Operating Control refinement
        ↓
04  Mass Balance
        ↓
05  Energy Balance
        ↓
06  Scientific Evidence hardening
        ↓
07  Laboratory Dataset + provenance
        ↓
08  Simulation vs Laboratory comparison
        ↓
09  Calibration
        ↓
10  Independent Validation
        ↓
11  Real-time hardware integration
        ↓
12  Mature Digital Twin
```

---

# 16. ATURAN UNTUK AI / MANUS / SESI BERIKUTNYA

Sebelum melakukan perubahan:

1. Baca Buku Besar ini.
2. Audit source code aktual.
3. Cari komponen yang sudah ada sebelum membuat komponen baru.
4. Jangan mengulang UI yang sudah ada tanpa alasan arsitektural.
5. Jangan mengganti formula dasar tanpa evidence dan catatan perubahan.
6. Jangan mencampurkan data laboratory dan simulation.
7. Jangan mengisi unknown dengan angka asumsi diam-diam.
8. Setiap nilai baru harus memiliki unit dan provenance.
9. Setiap output scientific harus dapat ditelusuri ke frame/dataset sumber.
10. Setelah perubahan, perbarui Buku Besar ini.
11. Catat commit/checkpoint baru.
12. Jelaskan dengan jelas: **SUDAH ADA / DIPERBAIKI / BARU DIBANGUN / BELUM ADA / PERLU VALIDASI**.

---

# 17. NEXT SESSION — PEKERJAAN PRIORITAS

Prioritas berdasarkan checkpoint terakhir:

1. Map data flow simulator → UI secara penuh.
2. Implement/sempurnakan `ProcessMachine3D` sebagai hero reactor object.
3. Sambungkan piping dan animated flow ke state/frame engine.
4. Bangun/sempurnakan cold-trap panel.
5. Sambungkan live instrumentation.
6. Tambahkan trend/graphs berbasis frame nyata.
7. Tambahkan causal visualization.
8. Pastikan interaktivitas operator benar-benar mengubah engine state/command.
9. Pastikan Results/Print mengambil data dari scientific recorder/evidence.
10. Lengkapi Hardware Configuration dan derived engineering preview.
11. Periksa ulang pemisahan Simulation vs Laboratory.
12. Update Buku Besar setelah setiap milestone penting.

---

# 18. CHECKPOINT TERAKHIR YANG DILAPORKAN

**Commit/checkpoint:** `3d9ae892`  
**Keterangan:** Component Refactoring & rAF Cleanup  
**Branch konteks:** `feature/control-room-ui`

Catatan: status branch/commit harus diverifikasi kembali oleh AI yang melakukan pekerjaan berikutnya sebelum menganggapnya sebagai HEAD aktif.

---

# 19. DEFINISI SELESAI UNTUK CONTROL ROOM

Control Room belum dianggap sempurna hanya karena tampilannya menarik.

Definisi selesai minimal:

- semua nilai live berasal dari engine/frame;
- semua kontrol memiliki jalur command yang nyata;
- piping visual merepresentasikan hubungan proses;
- animasi flow mengikuti state proses;
- cold trap menampilkan state/kapasitas aktual model;
- ultrasonic menampilkan requested vs effective value;
- vacuum menampilkan pressure + derived conductance context;
- hardware static tidak berubah ketika run aktif;
- replay menghasilkan kondisi yang konsisten dengan frame;
- event timeline dapat ditelusuri;
- causal inspector menunjukkan sebab-akibat;
- safety berasal dari safety state;
- scientific recorder menyimpan provenance;
- print/report mengambil data evidence yang sama;
- simulation dan laboratory dataset tetap terpisah;
- unknown tetap unknown;
- model limitations terlihat di tempat yang relevan.

---

# 20. PERNYATAAN BASELINE

> **IUVFES adalah sistem closed-loop digital twin yang sedang dikembangkan dari simulator engineering menuju sistem ilmiah yang dapat ditelusuri, dikalibrasi, dan divalidasi.**
>
> **Tidak boleh ada lompatan klaim dari simulasi menjadi fakta laboratorium.**
>
> **Kekayaan data harus bertambah melalui provenance yang benar, bukan melalui pengisian data yang tidak diketahui.**
>
> **Visual UI harus menjadi representasi hidup dari engine, bukan animasi yang berjalan terpisah dari physics/model.**

---

## RIWAYAT PERUBAHAN DOKUMEN

| Versi | Status | Catatan |
|---|---|---|
| 1.0 | Baseline | Penyatuan arsitektur, alur, rumus, UI, data boundary, roadmap, dan checkpoint dari sesi sebelumnya |
| 1.1 | Living | Ditambahkan visual reference, prinsip Control Room, hardware/static vs operating separation, scientific output, ultrasonic data strategy, dan aturan handover AI |

**Instruksi:** setiap sesi pengembangan signifikan wajib menambahkan entry pada riwayat perubahan dan memperbarui bagian yang terdampak.

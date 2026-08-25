# BUKU BESAR IUVFES DIGITAL TWIN

> **MASTER HANDOVER • LIVING ARCHITECTURE • SCIENTIFIC BASELINE • AI CONTEXT**
>
> Dokumen ini adalah patokan utama untuk AI, developer, researcher, dan operator yang melanjutkan pengembangan IUVFES. Dokumen harus diperbarui ketika arsitektur, data flow, scientific boundary, komponen, hasil audit, atau status pekerjaan berubah.

**Repository:** `goomevision/IUVFESDigitalTwin`  
**Baseline branch kerja saat dokumen ini dibuat:** `feature/control-room-ui`  
**PR penting saat ini:** PR #31 — Replay Evidence / Scientific Evidence integration  
**Status dokumen:** LIVING DOCUMENT  
**Tujuan dokumen:** mencegah kehilangan konteks antar-sesi dan mencegah AI berikutnya mengulang, merusak, atau salah memahami pekerjaan yang telah dibangun.

---

## 0. ATURAN EMAS

1. **Jangan mulai dari nol.** Baca Buku Besar ini sebelum mengubah kode.
2. **Audit sebelum patch.** Pahami data flow dan causal chain sebelum mengedit.
3. **UI bukan sumber kebenaran physics.** Engine/model adalah sumber state dan hasil proses.
4. **Jangan membuat angka hanya agar UI terlihat hidup.** Jika data belum tersedia, tampilkan `UNKNOWN`, `N/A`, atau status belum diketahui.
5. **Intended command ≠ effective command.** Simpan keduanya.
6. **Physical/observed response harus dibedakan dari command.**
7. **Simulation ≠ laboratory observation ≠ validation.** Jangan membuat klaim validasi tanpa data pendukung.
8. **Jangan mengubah physics/formula/controller hanya demi tampilan.** Perubahan model harus diaudit dan diuji.
9. **Pertahankan provenance, reproducibility, traceability, dan evidence integrity.**
10. **Perubahan besar harus kecil, dapat dilacak, dapat diuji, dan dapat dibalik.**
11. Setelah perubahan penting: **TypeScript → unit/regression → production build → review data flow** sesuai Quality Gate yang berlaku.
12. Buku Besar harus diperbarui bila ditemukan fakta baru, komponen baru, perubahan arsitektur, bug penting, keputusan ilmiah, atau perubahan status.

---

# 1. APA YANG SEDANG DIBANGUN?

IUVFES Digital Twin bukan sekadar aplikasi React dengan simulator visual.

IUVFES sedang dibangun sebagai **Scientific Digital Twin Infrastructure**: lingkungan digital yang merepresentasikan proses fisik secara closed-loop, menyimpan hubungan sebab-akibat setiap langkah proses sebagai data terstruktur, memungkinkan proses diputar ulang, menghasilkan evidence yang dapat diaudit dan diberi checksum, lalu menyusun scientific report yang tetap membedakan data simulasi dari data laboratorium nyata.

Kalimat inti:

> **IUVFES adalah Digital Twin berbasis closed-loop causal simulation yang dirancang bukan hanya untuk mensimulasikan proses fisik, tetapi untuk merekam setiap hubungan sebab-akibatnya sebagai data terstruktur yang dapat diputar ulang, diaudit, diberi provenance dan integrity checksum, kemudian diubah menjadi scientific evidence dan scientific report, sebelum akhirnya dapat dikalibrasi serta divalidasi terhadap eksperimen laboratorium nyata.**

---

# 2. TUJUAN BESAR

## 2.1 Digital Twin

Membangun representasi digital proses fisik yang memiliki:

- kondisi awal;
- material;
- hardware;
- sensor;
- actuator;
- controller;
- interlock/safety;
- physical dynamics;
- perubahan state terhadap waktu;
- hasil proses;
- historical frames.

## 2.2 Closed-loop causal simulation

Sistem harus menjelaskan bukan hanya **apa hasilnya**, tetapi **bagaimana hasil tersebut terjadi**.

Target causal chain:

```text
Sensor
  ↓
State / Interlock
  ↓
Controller / PID
  ↓
Control Output
  ↓
Intended Command
  ↓
Safety / Actuator Limits
  ↓
Effective Command
  ↓
Physical Dynamics
  ↓
Physical / Observed Sensor
  ↓
Causal Frame berikutnya
```

## 2.3 Scientific data infrastructure

Setiap run harus semakin dekat dengan data yang:

- dapat direkam;
- dapat ditelusuri;
- dapat dibandingkan;
- dapat direplay;
- dapat diekspor;
- memiliki provenance;
- memiliki integrity checksum;
- dapat menjadi bahan laporan ilmiah;
- dapat dibandingkan dengan data laboratorium nyata.

---

# 3. FILOSOFI ILMIAH

## 3.1 Simulation-derived tidak sama dengan laboratory-validated

Sistem secara sengaja mempertahankan batas:

```text
SIMULATION-DERIVED
        ≠
LABORATORY OBSERVATION
        ≠
EXPERIMENTALLY VALIDATED
```

Evidence dari replay simulasi harus diberi batas ilmiah yang menyatakan bahwa data tersebut berasal dari digital twin dan belum otomatis tervalidasi laboratorium.

## 3.2 Data laboratorium adalah sumber validasi, bukan data yang boleh ditimpa simulasi

Arah jangka panjang:

```text
Laboratory Observation
       ↓
Comparison / Calibration
       ↓
Digital Twin Improvement
       ↓
Simulation
       ↓
Prediction / Hypothesis
       ↓
New Laboratory Test
       ↓
Calibration Again
```

Data nyata dan data simulasi harus tetap dapat dibedakan pada provenance dan dataset identity.

## 3.3 Jangan mengarang data

Jika data tidak tersedia:

- jangan mengisi angka fiktif;
- jangan menganggap default sebagai hasil eksperimen;
- jangan membuat klaim PASS/FAIL tanpa basis;
- jangan mengubah `UNKNOWN` menjadi nilai seolah-olah terukur.

---

# 4. ARSITEKTUR KONSEPTUAL UTAMA

```text
EXPERIMENT
    │
    ▼
INPUT PARAMETERS
    │
    ▼
CLOSED-LOOP SESSION
    │
    ▼
INITIAL STATE
    │
    ▼
SENSOR
    │
    ▼
STATE / INTERLOCK
    │
    ▼
CONTROLLER / PID
    │
    ▼
CONTROL OUTPUT
    │
    ▼
INTENDED COMMAND
    │
    ▼
SAFETY / ACTUATOR LIMIT
    │
    ▼
EFFECTIVE COMMAND
    │
    ▼
MACHINE DYNAMICS / PHYSICS
    │
    ▼
PHYSICAL / OBSERVED SENSOR
    │
    ▼
CAUSAL FRAME
    │
    ├──────────────► CONTROL ROOM
    ├──────────────► 3D MACHINE
    ├──────────────► LIVE TREND
    ├──────────────► EVENT TIMELINE
    ├──────────────► CAUSAL INSPECTOR
    └──────────────► REPLAY
                         │
                         ▼
                    EVIDENCE
                         │
                         ▼
                      SHA-256
                         │
                         ▼
                 SCIENTIFIC REPORT
                         │
                         ▼
                LAB CALIBRATION
                         │
                         ▼
              EXPERIMENTAL VALIDATION
```

**AI berikutnya wajib memahami diagram ini sebelum melakukan perubahan besar.**

---

# 5. CAUSAL FRAME — UNIT DATA TERPENTING

Setiap langkah proses menghasilkan frame.

Secara konseptual:

```text
FRAME N

sensorBefore
    ↓
controller / state
    ↓
controlOutput
    ↓
intendedCommands
    ↓
effectiveCommands
    ↓
physical dynamics
    ↓
physicalSensorAfter
    ↓
sensorAfter / observed state
    ↓
safety / transition
    ↓
FRAME N+1
```

Frame bukan hanya snapshot. Frame adalah **unit observasi kausal**.

## Data yang telah diakomodasi dalam frame

### Sensor

- temperature;
- pressure;
- yield;
- water removed;
- oil recovered;
- energy.

### Controller

- stage;
- progress;
- elapsed time;
- sensors;
- commands;
- interlocks;
- alarm;
- transition reason.

### Control output

- heater power;
- vacuum pump power;
- vacuum isolation valve;
- vapor-to-condenser valve;
- cooling-water valve.

### Commands

- intendedCommands;
- effectiveCommands.

### Physical / observed state

- physicalSensorAfter;
- sensorAfter.

### Material

- materialInventory.

### Safety

- stage;
- allSystemsSafe;
- chamberSealed;
- pressureSafeForHeating;
- temperatureSafeForCooling;
- vacuumAchieved;
- overTemperature;
- alarm;
- transitionReason.

### Optional instrumentation / hardware diagnostics

Jika tersedia:

- ultrasonic effective frequency;
- ultrasonic effective power;
- ultrasonic power density;
- ultrasonic status;
- connected volume;
- pipe volume;
- vacuum conductance;
- effective pump capacity;
- hardware warnings;
- cold trap temperatures;
- cold trap heat load;
- condensation capacity;
- stage condensed water.

---

# 6. INTENDED VS EFFECTIVE VS OBSERVED

Ini adalah konsep yang tidak boleh dihapus atau disederhanakan.

Contoh:

```text
Controller meminta:
heater = 100%

Safety / hardware limit:
maximum = 60%

Effective command:
heater = 60%

Physical response:
temperature berubah sesuai model fisik
```

Jadi:

```text
INTENDED
  ≠
EFFECTIVE
  ≠
PHYSICAL RESPONSE
```

Perbedaan tersebut diperlukan untuk causal analysis, safety audit, dan scientific evidence.

---

# 7. PROCESS STATE MACHINE

Stage yang direpresentasikan:

```text
PRE_FLIGHT
CHARGE
VACUUM
HEAT_UP
EXTRACTION
CONDENSATION
COOL_DOWN
COMPLETE
FAULT
```

Setiap stage dapat membawa:

- state;
- progress;
- commands;
- interlocks;
- transition reason;
- sensor values;
- alarm/safety state.

---

# 8. CLOSED-LOOP SESSION LIFECYCLE

```text
CREATE SESSION
      ↓
START
      ↓
STEP
      ↓
FRAME
      ↓
NEXT STEP
      ↓
...
      ↓
COMPLETE / FAULT
```

Control Room juga mempunyai lifecycle operator:

```text
START
PAUSE
RESUME
STOP
RESET
```

FAUT/COMPLETE harus menghentikan loop dengan benar dan mempertahankan evidence yang sudah terbentuk.

---

# 9. CONTROL ROOM — KOMPONEN YANG SUDAH DIBANGUN

## 9.1 ProcessSimulator

Pusat orkestrasi Control Room.

Tanggung jawab:

- membuat session;
- start engine;
- step engine;
- menyimpan frames;
- mengirim data ke visualisasi;
- operator controls;
- pause/resume/stop/reset;
- replay;
- trend;
- causal inspector;
- evidence;
- scientific recorder/report.

## 9.2 ProcessMachine3D

Visualisasi inti mesin/proses.

Prinsip:

> state visual harus mengikuti frame/state engine, bukan membuat hasil physics sendiri.

## 9.3 LiveProcessTrend

Multi-channel trend dari causal frames.

Channel yang telah dihubungkan antara lain:

- temperature;
- pressure;
- vacuum output;
- ultrasonic power;
- condensation load.

Nilai tetap dalam satuan fisik masing-masing. Normalisasi hanya untuk keperluan visual per-channel.

Tidak boleh membuat synthetic telemetry untuk menutupi data yang tidak tersedia.

## 9.4 ProcessEventTimeline

Menampilkan:

- stage;
- elapsed time;
- alarm;
- transition reason;
- interlock state.

## 9.5 CausalFrameInspector

Memungkinkan operator melihat hubungan:

```text
sensor before
→ controller/interlock
→ intended commands
→ effective commands
→ control output
→ physical/observed sensor after
→ safety/result
```

## 9.6 ProcessRunReplay / Process Time Machine

Memungkinkan:

- play;
- pause;
- previous frame;
- next frame;
- start dari frame awal;
- reset;
- memilih frame;
- mengatur playback speed;
- melihat proses historis.

Replay harus menggunakan frame yang benar-benar tersimpan, bukan simulasi baru yang dibuat khusus untuk UI.

## 9.7 ScientificRunRecorder

Menerima frames untuk kebutuhan scientific recording dan downstream report/evidence.

## 9.8 ReplayEvidence

Mengambil:

- satu frame;
- atau range frame;

kemudian membentuk evidence package terstruktur.

## 9.9 ScientificReport

Mengubah evidence/process data menjadi draft scientific report.

---

# 10. REPLAY → EVIDENCE

Schema evidence:

```text
IUVFES-REPLAY-EVIDENCE-1
```

Jenis evidence:

```text
SIMULATION_REPLAY
```

Evidence mempertahankan:

- experiment ID;
- session ID;
- frame start/end;
- frame count;
- timestamps;
- source/provenance;
- causal frames;
- controller;
- control output;
- intended/effective commands;
- sensor before/after;
- safety;
- material inventory;
- ultrasonic/hardware diagnostics bila ada;
- scientific boundary.

---

# 11. EVIDENCE INTEGRITY

Evidence menggunakan canonical representation dan SHA-256.

Konsep:

```text
Evidence Object
      ↓
Stable / Canonical JSON
      ↓
SHA-256
      ↓
canonicalPayloadSha256
```

Tujuannya menjaga integritas dan reproducibility paket evidence.

Export JSON diperbolehkan. Integrity metadata harus dipertahankan.

---

# 12. SCIENTIFIC REPORT PIPELINE

Target alur:

```text
EXPERIMENT
    ↓
FRAMES
    ↓
REPLAY EVIDENCE
    ↓
SCIENTIFIC REPORT
```

Report dapat mencakup:

1. experiment metadata;
2. objective;
3. hypothesis;
4. procedure;
5. process evidence;
6. mass balance bila tersedia;
7. energy balance bila tersedia;
8. anomalies;
9. safety;
10. results;
11. provenance;
12. integrity/checksum;
13. scientific boundary.

Jika objective/hypothesis/procedure/data belum tersedia, report tidak boleh mengarangnya.

---

# 13. INPUT EKSPERIMEN DAN OPERATOR

Parameter yang sudah digunakan dalam simulator meliputi antara lain:

- duration;
- material weight;
- water content;
- oil content;
- target pressure;
- target temperature;
- cooling temperature;
- heater maximum;
- vacuum pump maximum;
- condenser maximum;
- cooling maximum.

Arah desain keseluruhan tetap mempertahankan pemisahan antara:

### Hardware static / immutable

Contoh:

- diameter;
- panjang;
- material konstruksi;
- ketebalan;
- volume geometris;
- konfigurasi pipa;
- hardware identity.

Data tersebut idealnya diisi pada sesi awal dan tidak berubah selama operasi kecuali memang sistem hardware mendukung perubahan.

### Operating controls / dynamic

Contoh:

- suhu target;
- vacuum target;
- heater output/limit;
- pump output/limit;
- condenser/cooling setting;
- ultrasonic power/frequency bila hardware mendukung.

Data dynamic boleh berubah selama operasi sesuai aturan controller dan safety.

**Catatan:** pemisahan UI hardware-static vs operating-control harus dipertahankan sebagai prinsip desain, walaupun implementasi detailnya masih dapat dikembangkan.

---

# 14. HARDWARE-AWARE SIMULATION

Sistem diarahkan agar parameter hardware benar-benar memengaruhi perilaku mesin.

Hubungan yang ingin dipertahankan/dikembangkan:

```text
Diameter
+
Length
+
Pipe Diameter
+
Volume / Geometry
        ↓
Vacuum Conductance
        ↓
Effective Pumping
        ↓
Pressure Dynamics
```

Dan:

```text
Cold Trap
   ↓
Temperature
   ↓
Condensation Capacity
   ↓
Condensation Load
   ↓
Recovered / Removed Mass
```

Serta:

```text
Ultrasonic Hardware
   ↓
Frequency / Power / Density
   ↓
Acoustic / Hardware Limits
   ↓
Effective Ultrasonic Command
   ↓
Process Response
```

**Jangan menganggap hubungan di atas sudah tervalidasi secara fisik hanya karena field/visual sudah ada.** Formula dan parameter harus diverifikasi terhadap sumber teknis dan data laboratorium nyata sebelum dianggap valid.

---

# 15. ULTRASONIC — AREA PENGEMBANGAN STRATEGIS

Ultrasonic sengaja dipertahankan sebagai input/diagnostic yang dapat berkembang karena data empiris mungkin masih terbatas.

Field yang telah diakomodasi:

- effective frequency;
- effective power;
- power density;
- status;
- hardware ultrasonic effective power;
- ultrasonic power density.

Prinsip:

> Jika data ultrasonic belum diketahui, jangan mengarangnya.

Jika operator memiliki data laboratorium ultrasonic:

```text
LAB ULTRASONIC DATA
        ↓
PROVENANCE = LABORATORY
        ↓
CALIBRATION / COMPARISON
        ↓
DIGITAL TWIN MODEL IMPROVEMENT
```

Data tersebut harus tetap dibedakan dari output simulasi.

---

# 16. MASS BALANCE

Target validasi:

```text
Initial Material
=
Remaining Material
+
Water Removed
+
Oil Recovered
+
Other Accounted Fractions
```

Model aktual harus mengikuti definisi material dan komponen yang benar-benar digunakan.

Tidak boleh menyimpulkan conservation hanya dari angka yield.

---

# 17. ENERGY BALANCE

Target:

```text
Energy Input
→ Heating
→ Extraction
→ Condensation
→ Cooling
→ Other Loads / Losses
```

Energy balance harus memiliki definisi dan basis model yang jelas sebelum dipakai sebagai klaim ilmiah.

---

# 18. SCIENTIFIC DATA PROVENANCE

Setiap data penting idealnya dapat menjawab:

```text
DATA INI BERASAL DARI MANA?
```

Minimal klasifikasi konseptual:

```text
SIMULATION
LABORATORY
CALIBRATED
VALIDATED
UNKNOWN
```

Jangan menggabungkan kategori tanpa metadata.

---

# 19. REPRODUCIBILITY

Eksperimen digital harus dapat direproduksi sejauh model dan input memungkinkan.

Karena itu pertahankan:

- experiment ID;
- session ID;
- input parameters;
- frame IDs;
- timestamps;
- commands;
- sensor data;
- model/software context;
- provenance;
- evidence checksum.

---

# 20. TRACEABILITY

Setiap kesimpulan idealnya dapat ditelusuri:

```text
CONCLUSION
   ↓
REPORT
   ↓
EVIDENCE
   ↓
FRAME RANGE
   ↓
SESSION
   ↓
EXPERIMENT
   ↓
INPUT PARAMETERS
```

Jika sebuah kesimpulan tidak dapat ditelusuri ke data, jangan menyebutnya evidence-backed conclusion.

---

# 21. AI ANALYSIS DI MASA DEPAN

Dengan data yang semakin kaya, AI diharapkan dapat membantu:

- anomaly detection;
- causal analysis;
- pattern recognition;
- parameter optimization;
- hypothesis generation;
- experiment design;
- simulation/laboratory comparison;
- calibration analysis;
- scientific reporting.

Tetapi AI harus selalu dapat menunjuk evidence yang mendasari kesimpulannya.

Prinsip:

> **Evidence first, conclusion second.**

---

# 22. HIRARKI VALIDASI

Gunakan urutan:

1. Software correctness
2. Causal correctness
3. Physics/model consistency
4. Mass conservation
5. Energy consistency
6. Hardware consistency
7. Laboratory calibration
8. Experimental validation
9. Scientific publication

Jangan melompati level.

---

# 23. APA YANG SUDAH DIBANGUN

## Baseline / core

- Closed-loop simulation engine integration
- Process state machine
- Controller / PID architecture
- Interlock/safety state
- Intended/effective command path
- Physical/observed sensor path
- Causal frame recording

## Control Room

- ProcessSimulator
- ProcessMachine3D
- LiveProcessTrend
- ProcessEventTimeline
- CausalFrameInspector
- ProcessRunReplay / Time Machine
- ScientificRunRecorder
- ReplayEvidence
- ScientificReport integration

## Evidence

- single-frame capture
- frame-range capture
- canonical JSON concept
- SHA-256 integrity
- simulation scientific boundary
- JSON export/copy

## Validation

- TypeScript checks
- unit/regression checks pada workflow yang tersedia
- production build checks pada Quality Gate yang telah dijalankan
- integration validation untuk Control Room baseline

---

# 24. STATUS SAAT INI

| Area | Status | Catatan |
|---|---|---|
| Closed-loop engine | 🟢 | Terhubung ke ProcessSimulator |
| Process state machine | 🟢 | Stage utama tersedia |
| Causal frame | 🟢 | Fondasi data utama |
| Intended/effective commands | 🟢 | Dipisahkan |
| Safety/interlock | 🟢 | Masuk frame |
| ProcessMachine3D | 🟢 | Mengikuti machine state |
| LiveProcessTrend | 🟢 | Multi-channel causal telemetry |
| Event Timeline | 🟢 | Stage/alarm/transition/interlock |
| Causal Inspector | 🟢 | Frame-level causal inspection |
| Run Replay | 🟢 | Time Machine tersedia |
| Replay Evidence | 🟢 | Single/range evidence |
| SHA-256 integrity | 🟢 | Evidence checksum |
| Scientific Report | 🟢/🟡 | Pipeline sudah terhubung; refinement berlanjut |
| Pause/Resume/Stop/Reset full regression | 🟡 | Perlu pengujian sistematis |
| Extractor validation | 🟡 | Pengembangan/validasi lanjutan |
| Condenser validation | 🟡 | Pengembangan/validasi lanjutan |
| Cooling validation | 🟡 | Pengembangan/validasi lanjutan |
| Mass balance validation | 🟡 | Harus diperkuat |
| Energy balance validation | 🟡 | Harus diperkuat |
| Hardware correlation | 🟡 | Belum sama dengan validasi fisik |
| Laboratory ingestion | 🟡 | Tahap pengembangan |
| Calibration | 🔴 | Belum dianggap selesai |
| Experimental validation | 🔴 | Belum dianggap selesai |

**Catatan:** status hijau berarti telah dibangun/terhubung secara software sesuai baseline yang diverifikasi; bukan berarti tervalidasi laboratorium.

---

# 25. PR DAN BASELINE TERAKHIR YANG PERLU DIPERHATIKAN

PR penting yang dibahas pada handover:

- **PR #31** — `feat: connect replay frames to scientific evidence`
- Status pada saat Buku Besar dibuat: **OPEN / DRAFT / NOT MERGED**.

Commit integrasi report yang dibahas pada handover:

`2876a9be71b2a4f8a3f5231de924aa33760b3bbe`

**PENTING:** sebelum melakukan merge atau melanjutkan dari commit/branch tertentu, AI harus memeriksa keadaan GitHub saat ini. Jangan menganggap status PR atau commit di atas masih sama jika repository sudah berubah.

---

# 26. PROSEDUR KERJA AI BERIKUTNYA

## Step A — Orientasi

Baca:

1. Buku Besar ini;
2. status branch;
3. PR aktif;
4. commit terbaru;
5. Quality Gate terbaru.

## Step B — Audit

Cari:

- sumber state;
- sumber frame;
- mapping UI;
- controller path;
- safety path;
- evidence path.

## Step C — Definisikan masalah

Tulis:

- apa yang salah;
- di layer mana;
- evidence yang mendukung;
- risiko jika diubah.

## Step D — Patch kecil

Ubah hanya layer yang diperlukan.

## Step E — Test

Minimal sesuai konteks:

- typecheck;
- unit test;
- regression;
- build.

## Step F — Update Buku Besar

Tambahkan:

- apa yang ditemukan;
- apa yang diubah;
- commit;
- status validation;
- keputusan baru;
- pekerjaan berikutnya.

---

# 27. PROTOKOL PEMBARUAN BUKU BESAR

Buku Besar ini adalah **living document**.

Jangan membuat salinan baru setiap kali ada perubahan kecil kecuali diperlukan untuk historical snapshot.

Utamakan memperbarui bagian yang relevan dan menambahkan entry ke CHANGELOG.

Setiap update minimal harus mencatat:

```text
Tanggal
AI / Worker
Branch
Commit
Area yang berubah
Temuan
Keputusan
Test / Quality Gate
Status
Next Action
```

---

# 28. CHANGELOG / EVOLUTION LOG

## Initial Master Baseline

Dokumen ini dibuat untuk mengonsolidasikan pemahaman sistem dari rangkaian pekerjaan Control Room, Causal Frame, Replay, Evidence, dan Scientific Report.

### Baseline yang dicatat

- Control Room architecture sudah terbentuk.
- ProcessMachine3D sudah terhubung ke frame/diagnostics.
- LiveProcessTrend mengambil data causal frames.
- CausalFrameInspector menyediakan trace frame-level.
- ProcessRunReplay menyediakan replay historis.
- ReplayEvidence menyediakan evidence capture.
- ScientificReport terhubung ke evidence/process data.
- Simulation vs laboratory boundary dipertahankan.

## 2026-08-12 — Control Room causal-data contract correction

**AI/Worker:** Manus AI  
**Branch:** `feature/control-room-ui`  
**Commit:** `15edc12b1cd46497ba2b3effe1cec17d8ce73d88`  
**PR:** #8 (open, target `develop`)

### Temuan

Process Simulator dan beberapa consumer visual sebelumnya mendeklarasikan bentuk frame lokal yang berpotensi menyimpang dari `ClosedLoopSimulationEngine.CausalFrame`. Router reset juga melakukan pengecekan akses dengan session ID, bukan parent experiment ID. Kedua kondisi tersebut dapat melemahkan traceability dan otorisasi lifecycle.

### Perubahan

Consumer Control Room sekarang menggunakan output tRPC yang diinfer dari `AppRouter` atau langsung menggunakan tipe `CausalFrame` engine. Session dan frame aktif direkonsiliasi melalui query lifecycle yang sudah ada; tidak ada telemetry sintetis yang ditambahkan. Reset sekarang mengotorisasi berdasarkan `session.experimentId`. Cleanup kanvas ProcessMachine3D juga dijaga agar tidak menghapus node renderer yang sudah terlepas.

### Data flow affected

`ClosedLoopSimulationEngine → CausalFrame → closedLoop.frames/get → ProcessSimulator → trend / replay / causal inspector / recorder`. Nilai ultrasonic yang tidak disediakan engine tetap tampil sebagai `UNKNOWN` atau tidak diproyeksikan sebagai nilai fisik baru.

### Scientific impact

Tidak ada perubahan pada persamaan fisika, PID, safety, intended command, maupun effective command. Perubahan ini memperkuat UI sebagai lapisan observasi atas causal frame yang sama.

### Simulation/Lab boundary impact

Tidak berubah. Semua nilai tetap berasal dari `SIMULATION`/`DERIVED` kecuali dataset laboratorium terpisah secara eksplisit tersedia.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS, 20 test files dan 53 tests. `pnpm build`: PASS. Tambahan test memverifikasi reset mengotorisasi parent experiment, bukan session ID.

### Status

🟢 Contract dan reset authorization verified pada local Quality Gate. 🟡 Recovery session setelah browser reload tetap pending karena API discovery session-by-experiment belum tersedia.

### Next action

Audit endpoint lifecycle untuk menemukan atau menambahkan lookup session persisted per experiment sebelum mengklaim rehydration lintas refresh; lalu lanjutkan layout Process Simulator berbasis visual contract yang sudah diverifikasi.

## 2026-08-12 — Engine-backed Process Simulator Control Room redesign

**AI/Worker:** Manus AI  
**Branch:** `feature/control-room-ui`  
**Commit:** `5dd11e6273b1eac7c37715a0fa11e5a037a3451d`  
**PR:** #8 (open, target `develop`)

### Temuan

Layout sebelumnya menyebarkan telemetry, operator control, process twin, and diagnostics ke panel generik. Datanya sudah engine-backed, tetapi hierarchy visual belum menegaskan hubungan operator input → closed-loop state → CausalFrame → visual machine state.

### Perubahan

`ProcessSimulator` direkomposisi sebagai satu Control Room dengan status top bar, rail operator, hero ProcessMachine3D, rail hardware dan safety, instrument strip, trend, replay, causal inspector, event timeline, dan scientific recorder. Stored ultrasonic operator inputs kini diteruskan ke konfigurasi session ketika tersedia.

### Data flow affected

Input operator di kiri diteruskan menjadi target atau operator limits. Semua telemetry di canvas, instrumentation, diagnostics, process progress, dan material inventory dibaca dari session state atau `CausalFrame`. Nilai yang engine tidak sediakan tetap `UNKNOWN` / `DATA GAP` dan tidak dibuatkan angka pengganti.

### Scientific impact

Tidak ada perubahan formula fisika ataupun control law. Visual pipe/flow/thermal effect hanya mengikuti command, diagnostics, sensors, dan state yang sudah diproduksi engine.

### Simulation/Lab boundary impact

Tidak berubah. Panel provenance menyatakan source `SIMULATION`, dan eksplisit menandai laboratory validation belum tersedia.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS, 20 test files dan 53 tests. `pnpm build`: PASS. Build mengeluarkan warning ukuran JavaScript bundle lebih dari 500 kB; warning ini tidak memblokir build dan belum dioptimasi pada patch ini.

### Status

🟢 Visual Control Room terikat pada data engine yang tersedia. 🟡 Discovery persisted session setelah full browser reload tetap pending pada lifecycle API.

### Next action

Tambahkan lookup session persisted berdasarkan experiment bila lifecycle persistence harus survive refresh, kemudian lakukan browser validation melalui experiment intake yang valid.

## 2026-08-12 — Causal-only replay and evidence export

**AI/Worker:** Manus AI  
**Branch:** `feature/control-room-ui`  
**Commit:** `109ee98ab87d9bfc324fdfb2e1d8088bcf713d77`  
**PR:** #8 (open, target `develop`)

### Temuan

Halaman replay sebelumnya memberi nilai numerik fallback untuk frame persisted yang tidak lengkap dan menerima legacy result format sebagai replay. Fallback tersebut berisiko terlihat sebagai telemetry sah, padahal tidak dapat dibuktikan berasal dari causal chain lengkap.

### Perubahan

Replay sekarang hanya menerima frame dengan struktur `sensorBefore → controller → effectiveCommands → materialInventory → safety`. Field yang tidak tersedia tetap ditampilkan sebagai `—`; legacy frame dikeluarkan dari replay ilmiah dan jumlahnya dinyatakan kepada pengguna. Operator dapat memilih rentang frame dan mengekspor paket JSON evidence dengan schema `IUVFES-REPLAY-EVIDENCE-1`, source/boundary metadata, CausalFrame asli, serta SHA-256 canonical payload.

### Data flow affected

Persisted `realTimeData` → validasi structural CausalFrame → replay window → evidence package. Tidak ada recalculation, imputasi, atau synthetic frame pada alur ini.

### Scientific impact

Evidence replay kini dapat menyatakan batas data dengan lebih ketat. Export meningkatkan traceability di dalam model, tetapi checksum browser-side bukan pengganti immutable object storage atau laboratory validation.

### Simulation/Lab boundary impact

Paket evidence diberi source `SIMULATION` dan scientific boundary eksplisit. Tidak ada laboratory measurement ataupun klaim validasi eksperimen yang dimasukkan.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS, 20 test files dan 53 tests. `pnpm build`: PASS. Warning ukuran JavaScript bundle lebih dari 500 kB tetap non-blocking dan belum dioptimasi pada patch ini.

### Status

🟢 Causal replay dan export evidence tersedia. 🟡 Persisted replay belum disertai object-storage immutable atau server-side evidence signing.

### Next action

Audit dan implementasikan data persistence/lookup session bila evidence harus dapat direkonstruksi setelah browser reload atau process restart.

### Next known priorities

1. Lifecycle regression lengkap.
2. Extractor/Condenser/Cooling validation.
3. Mass balance validation.
4. Energy balance validation.
5. Hardware correlation.
6. Laboratory data ingestion.
7. Calibration.
8. Experimental validation.

## 2026-08-24 — Interactive CausalFrame-driven 3D Digital Twin

**AI/Worker:** Manus AI  
**Branch:** `feature/control-room-ui`  
**Commit:** `b5b83c62b3deb2f6a2a9baf5532c9033398a907e`  
**PR:** #8 (open, target `develop`)

### Temuan

Audit 3D menemukan bahwa `CausalFrame.actuatorLevels` sudah tersedia untuk heater, vacuum pump, extractor, condenser, dan cooling, tetapi visual machine sebelumnya terutama membaca command boolean. Client-side ProcessMachine3D regression tests juga belum dijalankan oleh konfigurasi Vitest.

### Perubahan

`ProcessMachine3D` tetap mempertahankan topologi reactor, cold trap, pump, piping, particles, dan connector yang telah ada. Renderer kini memakai intensitas kontinu `actuatorLevels` untuk visual heater, pump, extractor, condenser, dan cooling. Ditambahkan OrbitControls, preset camera, reset view, realistic/X-ray/wireframe modes, visual-layer controls, flow/particle toggles, raycast selection, serta component inspector. Inspector hanya menampilkan command, actuator, sensor, simulation time, provenance, dan `UNKNOWN` dari CausalFrame; kontrol visual tidak menulis ke engine.

### Data flow affected

`ClosedLoopSimulationEngine → CausalFrame.actuatorLevels / effectiveCommands / sensorAfter / diagnostics → ProcessMachine3D visual state → Three.js`. `requestAnimationFrame` dipertahankan hanya sebagai scheduler render; phase animasi tetap mengikuti `timestampSeconds` frame.

### Scientific impact

Tidak ada perubahan pada physics, PID, safety kernel, intended command, effective command, atau material model. Particle flow tetap diberi label sebagai derived activity; flow rate tetap `UNKNOWN` bila engine tidak menyediakannya. Data visual tetap simulation-derived, bukan observasi laboratorium.

### Simulation/Lab boundary impact

Tidak berubah. Inspector menampilkan provenance `SIMULATION`; tidak ada data measured atau claim laboratory validation baru.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS, 26 test files dan 67 tests. `pnpm build`: PASS. `git diff --check`: PASS. Client-side ProcessMachine3D tests sekarang termasuk Quality Gate dan memverifikasi mapping continuous actuator levels tanpa telemetry sintetis. GitHub Actions Quality Gate untuk commit ini: PASS (run #587 / 32767029650). Warning ukuran JS bundle lebih dari 500 kB tetap non-blocking.

### Status

🟢 Interactive 3D Twin dan local/GitHub quality gates verified. 🟡 Browser interaction dan WebGL lifecycle belum dapat diverifikasi end-to-end menggunakan experiment sah karena preview OAuth session menghasilkan `invalid auth state` / `Auth Missing`; tidak ada experiment atau telemetry sintetis yang dibuat untuk menggantikan verifikasi tersebut.

### Next action

Gunakan authenticated session yang valid dan experiment persisted yang telah disetujui untuk memverifikasi Play, Pause, Resume, Stop, Reset, selection, camera controls, layer toggles, dan cleanup canvas di browser. Setelah itu audit bundle splitting dan lifecycle session recovery lintas browser refresh.

---

## 2026-08-25 — Master Quality session, replay, and identity hardening

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**PR:** open; no merge performed

### Temuan

Audit menemukan bahwa runtime store telah dapat menghidrasi persisted session melalui session id maupun experiment id, tetapi Control Room belum memiliki discovery API/UI untuk mengadopsi session tersebut setelah refresh. Replay ilmiah masih membaca legacy batch result stream, checksum evidence memasukkan waktu ekspor yang volatil, dan recorder memakai sample identity sintetis alih-alih mempertahankan identity eksperimen sumber.

### Perubahan

`closedLoop.getForExperiment` kini menyediakan lookup session persisted yang terautorisasi, dan `ProcessSimulator` mengadopsi canonical session id yang dikembalikan tanpa membuat session baru. `closedLoop.replayForExperiment` menjadi batas replay ilmiah; `ExperimentReplay` membaca CausalFrame persisted dari closed-loop dan secara eksplisit mengecualikan legacy batch result dari evidence.

Canonical replay body kini tidak menyertakan `exportedAt`; SHA-256 dihitung atas tubuh evidence yang stabil, sementara waktu ekspor disimpan sebagai metadata di luar payload canonical. Recorder mempertahankan original IUVFES experiment id sebagai research provenance key dan menampilkan `UNKNOWN` apabila sample id tidak tersedia.

### Data flow affected

`Experiment → persisted closed-loop session → authorized getForExperiment / replayForExperiment → ProcessSimulator / ExperimentReplay → CausalFrame evidence`. Legacy `simulation.run` tetap tersedia untuk kompatibilitas, tetapi bukan sumber authoritative untuk scientific causal replay.

### Scientific impact

Tidak ada formula physics, PID, safety kernel, material model, atau klaim laboratory validation yang diubah. Perubahan memperketat provenance, menghindari sample identifier buatan, dan membuat checksum replay reproducible untuk frame range yang sama.

### Tests / Quality Gate

Focused identity, replay-canonical-body, runtime-recovery, dan router-access tests lulus. Validasi lokal terakhir: `pnpm check` PASS; `pnpm test` PASS, 28 file / 71 tests; `pnpm build` PASS. Warning ukuran bundle tetap non-blocking. Browser/WebGL interaction masih belum verified karena preview OAuth tidak menyediakan session operator yang valid.

### Status

🟢 Server contract recovery, replay source boundary, evidence canonicalization, dan experiment identity telah diuji secara lokal. 🟡 Browser refresh/resume dan 3D interaction masih pending runtime verification dengan experiment persisted yang sah. 🔴 Tidak ada klaim bahwa replay atau visual telah laboratory-validated.

### Next action

Push branch setelah final Quality Gate, kemudian lakukan authenticated browser verification. Sesudah itu, optimasi bundle dan evaluasi coverage WebGL/browser lifecycle tanpa mengubah causal engine.

---

## 2026-08-25 — P13 Log-first Control Room observability and 3D presentation refinement

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Commits:** `0922232` — `feat(control-room): establish log-first operator observability`; `b80be43` — `feat(control-room): modernize scientific 3d twin visualization`
**PR:** open; no merge performed

### Temuan

Control Room sudah memiliki lifecycle server-side yang terotorisasi dan `controlLogs` untuk start/pause/resume/stop/perubahan parameter. Namun tidak ada lapisan terpadu untuk membedakan status auth operator, aktivitas UI 3D, error teknis browser, dan referensi frame tanpa mencampurkannya dengan journal ilmiah atau membuat telemetry baru. Browser P10 tetap tidak dapat membentuk OAuth operator pada GitHub Pages deployment, sehingga status P10 tetap `AUTH BLOCKED`.

### Perubahan

P13 menambahkan event stream observabilitas browser-local yang ter-redaksi untuk auth, operator action, Control Room lifecycle, runtime/React/DOM/WebGL, interaksi 3D, dan referensi CausalFrame. Event hanya menyimpan referensi existing (`experimentId`, `sessionId`, component, frame step, dan `timestampSeconds`) apabila tersedia; event tidak dipersist sebagai scientific result dan tidak dikirim ke endpoint baru. UI gate sekarang menunjukkan `NOT AUTHENTICATED` sebelum intake, session recovery, Control Room, atau 3D dapat dioperasikan.

ProcessMachine3D mempertahankan topologi authoritative reactor → vapor path → empat cold trap → vacuum serta cooling loop. Penyempurnaan P13 menambah pencahayaan industrial, deck/grid, reinforcing ribs dan support reactor, skid vacuum pump, serta rack condenser untuk memperjelas hierarchy tanpa mengubah geometry path, physics, or state engine.

### Data flow affected

`auth.me → ControlRoomAccessGate → experiment selection → canonical persisted session recovery → ProcessSimulator → ProcessMachine3D`. Observability mengamati lifecycle ini secara lokal. Jalur ilmiah tetap `ClosedLoopSimulationEngine → CausalFrame → replay/evidence/recorder`; `ScientificEventJournal`, closed-loop router, schema database, dan CausalFrame tidak diubah.

### Scientific impact

Tidak ada perubahan physics, PID, safety, intended command, effective command, material model, CausalFrame contract, frame timestamp, atau perhitungan sensor. `actuatorLevels` tetap sumber visual kontinu, `effectiveCommands` tetap command/interlock authority, dan `timestampSeconds` tetap satu-satunya simulation time. Tidak ada experiment, session, telemetry, frame, atau data scientific sintetis yang dibuat.

### Simulation/Lab boundary impact

Tidak berubah. P13 event operasional eksplisit **non-scientific** dan tidak boleh dianggap observasi laboratorium, evidence, atau telemetry proses. Visual 3D tetap simulation-derived ketika frame tersedia; absent data tetap `UNKNOWN`.

### Tests / Quality Gate

Validasi lokal: `pnpm check` PASS; `pnpm test` PASS — 29 file / 75 tests; `pnpm build` PASS; `git diff --check` PASS. Test baru memverifikasi redaksi nilai credential-shaped, bentuk event operasi, frame reference-only, dan subscription event local. Peringatan chunk JavaScript lebih dari 500 kB tetap non-blocking.

GitHub Actions untuk `b80be43`: Deploy IUVFES Control Room to GitHub Pages #48 PASS (run `32869142278`); Control Room Phase 1 Validation #239 PASS (run `32869141808`); IUVFES Quality Gate #612 PASS (run `32869141825`).

### Status

🟢 Log-first auth/operator/runtime observability tersedia sebagai layer browser-local ter-redaksi. 🟢 Visual hierarchy reactor, cold trap, piping, lighting, material, camera, selection, dan actuator presentation diperhalus tanpa mengubah contract ilmiah. 🟡 P13 visual browser runtime yang terautentikasi dan P10 lifecycle/WebGL verification tetap pending karena OAuth deployment blocker. 🔴 Tidak ada klaim laboratory validation.

### Next integration note

P10 tetap tidak berubah dan `AUTH BLOCKED`. Jangan menjalankan lifecycle/session/3D acceptance P10 sampai legitimate operator OAuth tersedia pada deployment P10 yang benar.

---

# 29. TEMPLATE UPDATE BERIKUTNYA

Salin template berikut saat membuat entry baru:

```markdown
## YYYY-MM-DD — [Judul Perubahan]

**AI/Worker:**
**Branch:**
**Commit:**
**PR:**

### Temuan
- 

### Perubahan
- 

### Data flow affected
- 

### Scientific impact
- 

### Simulation/Lab boundary impact
- 

### Tests / Quality Gate
- 

### Status
- 🟢 / 🟡 / 🔴

### Next action
- 
```

---

# 30. CHECKLIST SEBELUM MERGE

```text
[ ] Buku Besar dibaca
[ ] Data flow dipahami
[ ] Causal chain tidak rusak
[ ] Physics tidak diubah tanpa audit
[ ] Intended/effective tetap dibedakan
[ ] Sensor/observed tetap berasal dari engine/model
[ ] Simulation/Lab provenance tetap benar
[ ] Evidence reproducibility tidak rusak
[ ] Replay tetap konsisten
[ ] Scientific report tidak mengarang data
[ ] TypeScript check
[ ] Unit/regression test
[ ] Production build
[ ] Quality Gate diperiksa
[ ] Buku Besar diperbarui
```

---

# 31. PESAN KEPADA AI BERIKUTNYA

> **Jangan menganggap IUVFES sebagai proyek UI.**
>
> IUVFES adalah infrastruktur Digital Twin ilmiah. UI adalah jendela ke engine. Engine menghasilkan causal frames. Causal frames menjadi telemetry, machine state, timeline, inspector, dan replay. Replay menjadi evidence. Evidence menjadi scientific report. Data laboratorium nyata nantinya digunakan untuk calibration dan validation, bukan dicampur begitu saja dengan simulasi.
>
> Tiga pertanyaan utama yang harus selalu dapat dijawab sistem adalah:
>
> **1. Apa yang terjadi?**
>
> **2. Mengapa terjadi?**
>
> **3. Apa bukti datanya?**
>
> Dan ketika data laboratorium tersedia:
>
> **4. Seberapa dekat Digital Twin dengan kenyataan?**
>
> Setiap perubahan harus membuat empat pertanyaan tersebut semakin mudah dijawab, bukan semakin sulit.

---

# 32. STATUS DOKUMEN

**Purpose:** master reference / AI handover / architecture baseline  
**Lifecycle:** living / continuously updated  
**Authority:** baseline patokan pengembangan, bukan pengganti source code atau hasil validasi laboratorium  
**Last updated:** saat pembuatan dokumen ini  
**Next update trigger:** setiap perubahan arsitektur, data flow, scientific boundary, validation status, atau temuan penting.

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

## 2026-08-25 — P14 Scientific Knowledge & Method Center

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Commit:** `927b167672c06a6886af8f5f97ed96939abdec57` — `feat(control-room): add scientific knowledge and method center`
**PR:** open; no merge performed

### Temuan

Kontrak ilmiah IUVFES telah tersebar antara Buku Besar, Process Simulator data-flow, intake, recorder, replay/evidence, dan Control Room. Tanpa permukaan pendidikan yang terpusat, pengguna berisiko menyamakan output `SIMULATION`/`DERIVED`, field `UNKNOWN`, AI interpretation, dan laboratory proof. Audit P14 juga tidak menemukan user-facing AI-analysis contract yang dapat menjadi dasar untuk menampilkan hasil atau rekomendasi AI.

### Perubahan

P14 menambahkan route publik `/knowledge` untuk **Scientific Knowledge & Method Center** serta navigation dari P13 auth gate dan header Control Room. Halaman ini menyediakan overview Digital Twin/Virtual Laboratory, scientific status and boundary, method cards dengan WHAT/WHY/INPUT/PROCESS/OUTPUT/LIMITATION/EVIDENCE REQUIREMENT/SOURCE, Digital Twin, CausalFrame, evidence, provenance, AI analysis, material knowledge, experiment guide, glossary, FAQ, scientific-literacy modes, search, dan user guide.

Konten yang tidak dikonfirmasi oleh contract saat ini diberi `NOT AVAILABLE`, `PARTIAL`, atau `FUTURE CAPABILITY`. P14 tidak menampilkan hasil AI, skor confidence, angka uncertainty, material context, dataset laboratory, comparison, calibration, atau next-experiment recommendation yang tidak tersedia. Komponen `WhyThisValue` ditambahkan pada instrument temperature dan pressure existing untuk menerangkan field CausalFrame, classification, frame reference, visual meaning, dan apa yang tidak direpresentasikan oleh nilai tersebut.

### Data flow affected

`audited project documentation → scientificKnowledge content model → /knowledge public documentation route`. Pada Control Room, jalurnya hanya `active CausalFrame sensorAfter.temperatureC / sensorAfter.pressureMbar → WhyThisValue explanatory affordance`. Affordance tersebut tidak menulis ke engine, tidak membuat CausalFrame, tidak mengubah lifecycle, dan tidak mengganti nilai instrument.

### Scientific impact

Tidak ada perubahan pada `ClosedLoopSimulationEngine`, physics, PID, safety, material model, schema database, CausalFrame, intended/effective command, actuator mapping, `timestampSeconds`, replay/evidence, scientific journal, atau session contract. `ProcessMachine3D` tidak diubah untuk P14. P14 menjelaskan bahwa `actuatorLevels` adalah visual intensity, `effectiveCommands` adalah command/interlock authority, dan `timestampSeconds` adalah simulation time tanpa menghasilkan state scientific baru.

### Simulation/Lab boundary impact

Boundary dipertegas tanpa perubahan evidence. `SIMULATION`/`DERIVED` tetap bukan `MEASURED`; laboratory comparison, calibration, uncertainty quantification, model updating, dan runtime AI analysis tidak dinyatakan tersedia. `UNKNOWN` tidak diimputasi. Tidak ada experiment, session, frame, telemetry, material, laboratory result, atau scientific data sintetis yang dibuat.

### Tests / Quality Gate

Validasi lokal: `pnpm check` PASS; `pnpm test` PASS — 30 test files / 79 tests; `pnpm build` PASS; `git diff --check` PASS. Test P14 menegaskan overview chain, availability label untuk AI/uncertainty/laboratory comparison, simulation-versus-laboratory boundary, dan Why-this-value CausalFrame field references. Browser clone-local `/knowledge` menampilkan route, navigation, literacy-mode change, search/filter, explicit availability labels, tanpa error console dan tanpa overflow horizontal pada viewport 1280 px.

GitHub Actions untuk `927b167`: Deploy IUVFES Control Room to GitHub Pages #50 PASS; Control Room Phase 1 Validation #241 PASS; IUVFES Quality Gate #616 PASS. Peringatan ukuran JavaScript bundle lebih dari 500 kB tetap non-blocking.

### Status

🟢 P14 Knowledge Center tersedia sebagai layer pendidikan publik yang source-grounded dan searchable. 🟢 Runtime-safe Why-this-value explanation tersedia untuk instrument existing tanpa menambah state. 🟡 Material context, evidence assessment, hypothesis, dan knowledge-gap guidance menunjukkan availability aktual; laboratorium comparison, uncertainty quantification, model updating, dan AI analysis tetap tidak tersedia. 🟡 P10 tetap `AUTH BLOCKED`; P14 tidak mengubah OAuth atau acceptance P10.

### Next action

Pertahankan P14 sebagai documentation/presentation layer. Sebelum meneruskan P10, selesaikan OAuth callback/backend deployment dependency melalui workflow terpisah dan dapatkan legitimate operator session pada runtime P10 yang benar. Jangan mengubah engine, CausalFrame, ProcessMachine3D, atau physics untuk memperbaiki blocker autentikasi.

---

## 2026-08-25 — Canonical Drizzle Migration Governance

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Commit:** `ee7a13b6e927a17a3d8fd2b5b3e94ddcf5cc4460` — `fix(db): establish canonical migration chain`
**PR:** open; no merge performed

### Temuan

Source sebelumnya memiliki SQL migration ClosedLoop, scientific event journal, dan research/evidence yang belum terdaftar dalam Drizzle journal. Dua file memakai prefix `0002`, `scientificEventJournal` dipakai runtime tetapi belum dideklarasikan dalam `drizzle/schema.ts`, dan `scientific-data.sql` adalah scaffold alternatif dengan konvensi tipe/nama yang tidak sama dengan schema MySQL kanonik.

### Perubahan

Drizzle toolchain digunakan untuk menghasilkan chain kanonik `0000 → 0001_purple_ozymandias → 0002_known_wolfpack → 0003_open_peter_quill`, termasuk journal dan snapshot metadata. `0001` menambah persistent ClosedLoop session, `0002` menambah scientific event journal, dan `0003` menambah research/evidence/provenance dengan foreign-key dependency yang dideklarasikan dalam schema. File SQL manual yang tidak terdaftar digantikan oleh output generator. `scientific-data.sql` dipertahankan tetapi ditandai **NON-CANONICAL DEVELOPMENT SCAFFOLD** dan tidak boleh dijalankan bersama chain kanonik.

### Data flow affected

Perubahan membakukan persistence schema untuk `closedLoopSessionStore`, `scientificEventJournal`, dan `scientificDatasetPersistence`. Tidak ada router, lifecycle, engine, CausalFrame, replay, atau evidence payload yang diubah; tidak ada migration yang diterapkan ke database.

### Scientific impact

Tidak ada perubahan physics, PID, safety, intended/effective command, actuator mapping, `timestampSeconds`, atau hasil simulasi. Patch ini hanya membangun governance metadata agar deployment masa depan dapat membandingkan runtime persistence requirements dengan migration chain yang eksplisit.

### Simulation/Lab boundary impact

Tidak berubah. Tidak ada experiment, session, CausalFrame, telemetry, material, laboratory record, atau scientific data sintetis yang dibuat. `scientific-data.sql` tidak dinaikkan menjadi sumber data ilmiah atau migration produksi.

### Tests / Quality Gate

`pnpm drizzle-kit generate` terhadap schema final melaporkan **No schema changes, nothing to migrate**. `pnpm check` PASS; `pnpm test` PASS — 32 test files / 85 tests; `pnpm build` PASS; `git diff --check` PASS. Test governance baru mengunci urutan journal, presence runtime tables, generated migration outputs, dan status non-canonical scaffold. GitHub Actions: Deploy IUVFES Control Room to GitHub Pages #54 PASS (run `32886019425`); Control Room Phase 1 Validation #245 PASS (run `32886019391`); IUVFES Quality Gate #624 PASS (run `32886019388`).

### Status

🟢 Canonical source migration chain sekarang jelas dan generator-backed. 🟡 Production database masih hanya memiliki base migration; backup, rollback, migration execution, full GitHub backend deployment, dan release identity belum tersedia. 🔴 P10 tetap blocked dan tidak boleh memakai chain ini sebagai klaim bahwa database production telah dimigrasikan.

### Next action

Sebelum database mutation atau P10, siapkan approved migration execution plan, backup/restore/PITR evidence, dan full backend deployment yang terikat ke release identity. Kemudian lakukan migration dan post-deploy checks sebagai pekerjaan terpisah, tidak dalam patch governance ini.

---

## 2026-08-25 — Infrastructure Deployment Blocker

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Source SHA assessed:** `ee7a13b6e927a17a3d8fd2b5b3e94ddcf5cc4460`
**Status:** **EXTERNAL CONFIGURATION REQUIRED**

### Verified conclusion

| Area | Status |
|---|---|
| Source | READY |
| Canonical migration chain | READY |
| Production database | NOT READY |
| Backup | UNKNOWN |
| Restore | UNKNOWN |
| PITR | UNKNOWN |
| Full backend deployment from GitHub checkout | NOT AVAILABLE in the exposed Manus runtime |
| Migration owner | UNKNOWN |

### Decision and boundary

Source governance is complete, but production migration cannot proceed without externally verified backup/recovery ownership and a full GitHub-backend deployment path. Application checkpoint rollback does not restore remote database schema or data, so it is not a database migration rollback strategy.

No migration, database mutation, backend deployment, OAuth, experiment/session/telemetry creation, P10, or 3D runtime test was performed. The next action must come from infrastructure ownership: provide a production backup/restore/PITR procedure, named migration and release owners, and a deployment mechanism that runs the complete GitHub backend from a verifiable release identity.

---

## 2026-08-26 — P15 Modern 3D Control Room source publication

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Commit:** Source-publication commit for this entry
**PR:** open; no merge performed

### Temuan

`ProcessMachine3D` sudah menjadi consumer `CausalFrame`; P15 membatasi pekerjaan pada presentasi renderer dan Control Room tanpa mengubah authority scientific. Browser runtime yang benar tetap memerlukan OAuth operator yang sah serta persisted experiment dan canonical session yang sudah ada. Kondisi tersebut belum tersedia, sehingga authenticated WebGL smoke tidak dapat dilakukan tanpa melanggar batas no-bypass/no-data-creation.

### Perubahan

P15 menambah lapisan struktur industrial visual, maintenance platform/rail/column/beacon, fog dan overhead lighting, detail flange reactor, shroud/motor/fins vacuum pump, detail crown cold trap, serta hierarchy overlay yang lebih kuat. Guidance navigasi, layer `structure`, legenda status `SIMULATION`/`DERIVED`/`MEASURED`/`UNKNOWN`, dan wording provenance inspector diperjelas. Kamera OrbitControls, rotate, zoom, pan, focus, preset, selection, inspector, view mode, layer control, topology piping, dan safe canvas cleanup dipertahankan.

### Data flow affected

Tetap `CausalFrame → getProcessMachineVisualState() → Three.js presentation`. Waktu visual berasal dari `frame.timestampSeconds`; `effectiveCommands` tetap authority command/interlock; `actuatorLevels` tetap intensitas visual kontinu; particle flow tetap ditandai sebagai aktivitas `DERIVED`, bukan measured flow rate. Tidak ada route, API, persistence, atau contract scientific yang diubah.

### Scientific impact

Tidak ada perubahan physics, PID, safety, engine, CausalFrame, database, migration, OAuth, backend, experiment, session, lifecycle P10, atau perhitungan sensor. Field yang tidak tersedia tetap `UNKNOWN`; P15 tidak membuat atau mengimputasi data ilmiah, telemetry, experiment, ataupun session.

### Simulation/Lab boundary impact

Tidak berubah. `SIMULATION`, `DERIVED`, `MEASURED`, dan `UNKNOWN` ditampilkan secara eksplisit agar presentasi visual tidak terlihat sebagai pengukuran laboratorium. Status `MEASURED` tetap tidak dimuat jika tidak ada sumber measurement authoritative.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS — 33 files / 88 tests, termasuk `server/processMachine3D.p15.test.ts`. `pnpm build`: PASS. `git diff --check`: PASS. Warning ukuran JavaScript bundle lebih dari 500 kB tetap non-blocking.

### Status

🟢 P15 **source publication** tervalidasi secara statis dan dipublikasikan pada branch fitur tanpa merge. 🟡 Authenticated visual smoke untuk WebGL/Control Room tetap **BLOCKED** oleh OAuth/session yang sah dan deployment backend yang lengkap. Status ini bukan hasil P10 dan tidak mengubah blocker infrastruktur yang sudah tercatat.

### Next action

Jangan melakukan P10 atau browser 3D acceptance sampai external infrastructure configuration menyediakan full GitHub backend deployment, governance migration/recovery yang disetujui, release identity terverifikasi, OAuth operator sah, serta persisted experiment/canonical session yang sudah ada. Saat kondisi tersebut tersedia, jalankan smoke yang legitimate tanpa membuat data baru.

---

## 2026-08-26 — P16 Scientific Interactive Presentation source publication

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Commit:** Source-publication commit for this entry
**PR:** open; no merge performed

### Temuan

P15 telah menyediakan renderer 3D modern yang authoritative terhadap `CausalFrame`, tetapi tampilan masih membutuhkan jalur pembelajaran yang lebih eksplisit untuk membedakan topology proses, fungsi komponen, source value, provenance, dan batas interpretasi. P16 menyelesaikan kebutuhan presentation tersebut di dalam Control Room tanpa mengubah cara scientific state dibentuk atau dipersist.

### Perubahan

3D Twin tetap menjadi pusat Control Room dan sekarang menyediakan mode **SIMPLE**, **SCIENTIFIC**, serta **EXPERT**. Process Flow menampilkan chamber → vapor path → cold traps → vacuum → cooling dengan penjelasan source yang sesuai mode. Component Inspector kini menjelaskan function, method, authoritative input, visual output, provenance, dan interpretation limit untuk setiap component yang dapat dipilih. Scientific status legend `SIMULATION` / `DERIVED` / `MEASURED` / `UNKNOWN`, `Why This Value`, dan contextual link ke Knowledge Center ditambahkan pada presentation layer.

### Data flow affected

Tetap `CausalFrame → getProcessMachineVisualState() → ProcessMachine3D presentation`. `frame.timestampSeconds` tetap satu-satunya simulation time; `frame.sensorAfter` tetap nilai proses; `frame.effectiveCommands` tetap authority command/interlock; dan `frame.actuatorLevels` tetap intensitas visual kontinu. Process Flow hanya menjelaskan topology/source yang sudah ada dan tidak menghitung flow rate atau nilai proses baru.

### Scientific impact

Tidak ada perubahan physics, PID, safety, CausalFrame contract, database, migration, OAuth, backend, experiment/session, lifecycle P10, scientific journal, atau telemetry. Status `MEASURED` menyatakan **NOT LOADED** ketika tidak ada dataset measurement. `UNKNOWN` tidak diisi dengan default, estimasi, atau angka sintetis.

### Simulation/Lab boundary impact

Boundary dipertegas. `SIMULATION` menunjuk nilai dari active CausalFrame; `DERIVED` menunjuk presentasi aktivitas yang diturunkan dari state authoritative; `MEASURED` tidak diklaim tanpa dataset; dan `UNKNOWN` tetap menandai data gap. Particle flow secara eksplisit bukan measured vapor/cooling/vacuum flow rate maupun proof laboratorium.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS — 34 files / 91 tests, termasuk `server/processMachine3D.p16.test.ts`. `pnpm build`: PASS. `git diff --check`: PASS. Warning ukuran JavaScript bundle lebih dari 500 kB tetap non-blocking.

### Status

🟢 P16 **source publication** tervalidasi secara statis pada branch fitur tanpa merge. 🟡 Authenticated WebGL smoke tetap **BLOCKED** karena OAuth operator/session sah serta full backend deployment untuk runtime P10 belum tersedia. Status ini tidak mengubah P10 atau blocker infrastruktur yang telah dicatat.

### Next action

Pertahankan P16 sebagai layer presentasi dan pendidikan. Jangan melakukan P10 atau browser 3D acceptance sampai prasyarat runtime legitimate tersedia: full GitHub backend deployment, governance migration/recovery yang disetujui, verifiable release identity, OAuth operator sah, dan persisted experiment/canonical session yang sudah ada.

---

## 2026-08-26 — P17 Instrument & Calibration Foundation source publication

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Commit:** Source-publication commit for this entry
**PR:** open; no merge performed

### Temuan

Control Room sudah menunjukkan sensor simulation dan provenance `CausalFrame`, tetapi belum memiliki surface yang membedakan channel modelled tersebut dari instrument nyata beserta metadata calibration, certificate, measurement range, resolution, traceability, uncertainty, dan evidence. P17 menambahkan foundation UI/contract agar metadata nyata dapat dimasukkan pada tahap yang disetujui tanpa memperlakukan simulation sebagai hasil laboratorium.

### Perubahan

P17 menambahkan Instrument Registry dan Instrument Inspector yang mendeklarasikan channel reactor temperature, chamber pressure, ultrasonic effective power, serta empat cold-trap temperature channels. Setiap registry entry menyediakan contract fields untuk calibration status, certificate reference, measurement range, resolution, traceability chain, measurement uncertainty, evidence reference, provenance, dan frame field. Semua field laboratorium saat ini berstatus `UNKNOWN` atau `NOT LOADED` tanpa nilai numerik. Inspector 3D sekarang memberi contextual link ke registry ketika component memiliki channel instrument yang dideklarasikan.

### Data flow affected

Jalur runtime tetap `CausalFrame → ProcessMachine3D / ProcessSimulator`. Registry hanya memetakan component 3D ke metadata UI dan menegaskan field authoritative yang sudah ada, misalnya `sensorAfter.temperatureC`, `sensorAfter.pressureMbar`, `ultrasonic.effectivePowerW`, dan `hardwareDiagnostics.coldTrapTemperaturesC[n]`. Tidak ada frame baru, sensor baru, persistence baru, atau request API baru.

### Scientific impact

Tidak ada perubahan physics, PID, safety, CausalFrame contract, database, migration, OAuth, backend, experiment/session, lifecycle P10, scientific journal, atau telemetry. P17 tidak membuat data laboratorium, certificate, calibration date, measurement range, resolution, traceability chain, evidence, atau nilai uncertainty. P17 juga tidak mengklaim ISO/IEC 17025 compliance.

### Simulation/Lab boundary impact

`SIMULATION` tetap berarti value dari active CausalFrame. `MEASURED` tidak digunakan sebagai claim karena measurement dataset belum dimuat. `NOT LOADED` dan `UNKNOWN` dipertahankan untuk calibration, traceability, evidence, range, resolution, dan uncertainty yang belum tersedia. Foundation ini tidak mengubah simulation menjadi laboratory observation atau validation.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS — 35 files / 94 tests, termasuk `server/instrumentRegistry.p17.test.ts`. `pnpm build`: PASS. `git diff --check`: PASS. Warning ukuran JavaScript bundle lebih dari 500 kB tetap non-blocking.

### Status

🟢 P17 **source publication** tervalidasi secara statis pada branch fitur tanpa merge. 🟡 Instrument Registry adalah contract/UI foundation; metadata measurement nyata tetap `NOT LOADED` atau `UNKNOWN` sampai sumber yang legitimate tersedia. 🟡 Authenticated WebGL smoke tetap **BLOCKED** oleh OAuth/session/full backend deployment; status P10 tidak berubah.

### Next action

Sebelum mengisi metadata instrument nyata, sediakan governance terpisah untuk instrument master data, calibration certificate/evidence, traceability, uncertainty, validation, ownership, dan persistence. Jangan mengisi field P17 dengan nilai sintetis. Jangan melakukan P10/3D browser acceptance sebelum prasyarat runtime legitimate tersedia.

---

## 2026-08-26 — P18 Metrological Traceability Foundation source publication

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Commit:** Source-publication commit for this entry
**PR:** open; no merge performed

### Temuan

P17 telah menyediakan contract field traceability pada Instrument Registry, tetapi belum menyediakan visual chain yang memperlihatkan kelengkapan atau ketidaklengkapan hubungan instrument, certificate, reference standard, calibration laboratory, measurement result, dan evidence/provenance. Tanpa chain eksplisit, UI berisiko membuat simulation provenance terlihat sebagai metrological traceability.

### Perubahan

P18 menambahkan Metrological Traceability Chain pada Instrument Inspector. Setiap selected instrument membentuk enam node: **Instrument → Calibration Certificate → Reference Standard → Calibration Laboratory → Measurement Result → Evidence / Provenance**. Setiap node memuat status, identifier/reference, source, provenance, dan interpretation limit. Status saat ini memakai `NOT LOADED` atau `NOT APPLICABLE` sesuai evidence yang tersedia; `VERIFIED` hanya tersedia sebagai contract status dan tidak digunakan oleh registry saat ini.

### Data flow affected

Chain dibentuk secara deterministik dari P17 `InstrumentRegistryEntry` dan hanya mereferensikan instrument ID, existing CausalFrame field, serta provenance yang sudah dideklarasikan. Tidak ada perubahan pada `CausalFrame`, nilai sensor, engine, component geometry, API, persistence, atau request backend. Measurement Result dan Evidence / Provenance node menegaskan bahwa channel active adalah `SIMULATION`, bukan measurement.

### Scientific impact

Tidak ada perubahan physics, PID, safety, CausalFrame contract, database, migration, OAuth, backend, experiment/session, P10 lifecycle, scientific journal, telemetry, certificate, laboratory, reference standard, uncertainty, measurement, maupun evidence. P18 tidak membuat identifier fisik baru; `NOT LOADED` dipakai jika record belum ada dan `UNKNOWN` tetap dipertahankan jika data tidak diketahui.

### Simulation/Lab boundary impact

`SIMULATION ≠ MEASURED` dan `DERIVED ≠ MEASURED` diperlihatkan pada UI chain. CausalFrame provenance mendukung traceability simulation saja dan secara eksplisit bukan metrological evidence. Chain diberi status **CHAIN NOT VERIFIED** hingga records physical instrument, certificate, standard, laboratory, measurement result, dan evidence/provenance benar-benar dimuat serta diverifikasi.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS — 36 files / 97 tests, termasuk `server/metrologicalTraceability.p18.test.ts`. `pnpm build`: PASS. `git diff --check`: PASS. Warning ukuran JavaScript bundle lebih dari 500 kB tetap non-blocking.

### Status

🟢 P18 **source publication** tervalidasi secara statis pada branch fitur tanpa merge. 🟡 Metrological Traceability Chain adalah UI/contract foundation, bukan claim of metrological traceability. 🟡 Authenticated WebGL smoke tetap **BLOCKED** oleh OAuth/session/full backend deployment; P10 tidak berubah.

### Next action

Jangan mengisi node P18 sebelum tersedia evidence-backed records dan governance yang disetujui untuk instrument identity, calibration certificate, reference standard, laboratory, measurement result, uncertainty, evidence/provenance, ownership, dan persistence. Jangan menjalankan P10 atau browser acceptance sampai prasyarat runtime legitimate tersedia.

---

## 2026-08-26 — P19 Measurement Uncertainty Foundation source publication

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Commit:** Source-publication commit for this entry
**PR:** open; no merge performed

### Temuan

P17 dan P18 menyediakan contract instrument dan traceability, tetapi belum menyediakan uncertainty-budget surface yang secara eksplisit membedakan field uncertainty yang belum dimuat dari nilai uncertainty terkuantifikasi. Tanpa contract tersebut, Control Room berisiko menampilkan simulation field seolah-olah sudah memiliki measurement uncertainty atau measurement result.

### Perubahan

P19 menambahkan Measurement Uncertainty Foundation pada Instrument Inspector. Budget mencakup tujuh component: **Instrument**, **Calibration**, **Resolution**, **Repeatability**, **Reference Standard**, **Environmental**, dan **Other**. Setiap component memuat component ID, source/reference, distribution, evaluation method, standard uncertainty, sensitivity coefficient, contribution, provenance, status, dan interpretation limit. Semua field nilai saat ini `NOT LOADED`, `UNKNOWN`, atau `NOT APPLICABLE`; tidak ada angka uncertainty yang dibuat. Budget status awal ditampilkan sebagai **NOT AVAILABLE / NOT LOADED**.

### Data flow affected

Budget dibentuk deterministik dari P17 `InstrumentRegistryEntry`; tidak membaca atau mengubah CausalFrame di luar field provenance yang sudah dideklarasikan. Visual relationship **Instrument → Calibration → Traceability → Uncertainty Budget → Measurement Result** menautkan Registry, Traceability Chain, dan Knowledge Center. `timestampSeconds`, `sensorAfter`, `effectiveCommands`, dan `actuatorLevels` tidak berubah authority maupun penggunaannya.

### Scientific impact

Tidak ada perubahan database, migration, backend, OAuth, experiment/session, telemetry, CausalFrame, physics, PID, safety, certificate, calibration value, uncertainty number, measurement result, atau evidence. `MEASUREMENT RESULT` ditandai `NOT APPLICABLE` karena active channel adalah simulation. P19 tidak menghitung combined/expanded uncertainty atau mengklaim measurement result.

### Simulation/Lab boundary impact

UI menyatakan secara eksplisit `SIMULATION ≠ MEASURED`, `DERIVED ≠ MEASURED`, dan `UNKNOWN` tetap `UNKNOWN`. Uncertainty Budget dan Traceability Chain tetap evidence-bound: `NOT LOADED` bukan nilai nol, dan `NOT AVAILABLE` bukan hasil uncertainty. Tidak ada claim metrological traceability atau laboratory validity.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS — 37 files / 100 tests, termasuk `server/measurementUncertainty.p19.test.ts`. `pnpm build`: PASS. `git diff --check`: PASS. Warning ukuran JavaScript bundle lebih dari 500 kB tetap non-blocking.

### Status

🟢 P19 **source publication** tervalidasi secara statis pada branch fitur tanpa merge. 🟡 Measurement Uncertainty Foundation adalah UI/contract foundation dengan status **NOT AVAILABLE / NOT LOADED**, bukan uncertainty budget terkuantifikasi. 🟡 Authenticated WebGL smoke tetap **BLOCKED** oleh OAuth/session/full backend deployment; P10 tidak berubah.

### Next action

Jangan mengisi budget P19 sebelum tersedia records nyata yang evidence-backed untuk physical instrument, calibration, resolution, repeatability, reference standard, environmental condition, uncertainty method, measurement result, traceability, dan provenance. Jangan menjalankan P10/browser acceptance sebelum prasyarat runtime legitimate tersedia.

---

## 2026-08-26 — P20 Laboratory Evidence & Data Ingestion Foundation source publication

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Commit:** Source-publication commit for this entry
**PR:** open; no merge performed

### Temuan

P17–P19 telah menyediakan instrument, traceability, dan uncertainty contracts, tetapi belum memiliki surface penerimaan evidence nyata yang dapat membedakan absence of laboratory records dari zero values, simulation fields, atau verification claim. Tanpa Evidence Center, future ingestion berisiko mencampurkan contract metadata dengan laboratory observation.

### Perubahan

P20 menambahkan Laboratory Evidence Center dan Evidence Inspector dalam Control Room. Evidence Record contract mendeklarasikan `evidenceId`, `experimentId`, `sampleId`, `instrumentId`, `measurementId`, `datasetId`, source/timestamp/unit/value/uncertainty fields, calibration/laboratory/reference-standard references, provenance, verification status, dan interpretation limit. Registry evidence nyata tetap kosong; tidak ada identifier, sample, data laboratory, measurement, certificate, calibration result, uncertainty, atau evidence yang dibuat.

Lifecycle contract mencakup `RECEIVED`, `PARSED`, `IDENTIFIED`, `TRACEABILITY_PENDING`, `CALIBRATION_PENDING`, `UNCERTAINTY_PENDING`, `VERIFICATION_PENDING`, `VERIFIED`, dan `REJECTED`. Dengan tidak adanya record, seluruh lifecycle berstatus `NOT LOADED`, Evidence Completeness berstatus `NOT READY`, dan verifier tidak dapat menghasilkan `VERIFIED`. UI juga menampilkan flow **Sample → Measurement → Instrument → Calibration → Traceability → Uncertainty → Evidence → Verification** beserta contextual link ke P17 Instrument Registry, P18 Traceability Chain, P19 Uncertainty Budget, dan Knowledge Center.

### Data flow affected

P20 adalah client-side UI/contract dan tidak membuat persistence, database migration, API call, experiment, session, atau telemetry. Tidak ada perubahan pada `CausalFrame`, `timestampSeconds`, `sensorAfter`, `effectiveCommands`, atau `actuatorLevels`. Existing Control Room values tetap simulation/derived seperti sebelum P20; Evidence Center tidak mengonversinya menjadi measurement.

### Scientific impact

Tidak ada perubahan physics, PID, safety, CausalFrame, actuator authority, OAuth, backend, database, migration, certificate, calibration value, uncertainty value, measurement result, sample, atau evidence nyata. `NOT LOADED` digunakan untuk absence of evidence dan bukan zero. `VERIFIED` hanya dapat muncul untuk record yang memenuhi gate evidence; tidak ada record default yang memenuhi gate tersebut. Tidak ada claim ISO/IEC 17025 compliance.

### Simulation/Lab boundary impact

`SIMULATION ≠ MEASURED`, `DERIVED ≠ MEASURED`, `UNKNOWN ≠ ZERO`, dan `COMPLETE ≠ VERIFIED` dinyatakan pada UI dan contract. Measurement timestamp tidak digantikan oleh simulation time; CausalFrame provenance tetap traceability simulation, bukan laboratory evidence. Evidence Completeness bukan scientific confidence score.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS — 38 files / 103 tests, termasuk `server/laboratoryEvidence.p20.test.ts`. `pnpm build`: PASS. `git diff --check`: PASS. Warning ukuran JavaScript bundle lebih dari 500 kB tetap non-blocking.

### Status

🟢 P20 **source publication** tervalidasi secara statis pada branch fitur tanpa merge. 🟡 Laboratory Evidence Center adalah UI/contract foundation dengan zero loaded records; ini bukan data ingestion maupun evidence verification. 🟡 Authenticated WebGL smoke tetap **BLOCKED** oleh OAuth/session/full backend deployment dan P10 tidak berubah.

### Next action

Sebelum evidence record nyata dapat diingest, sediakan governance dan approved persistence untuk source, sample identity, instrument identity, measurement, uncertainty, calibration, traceability, evidence, verification, ownership, validation, and retention. Jangan mengisi contract dengan synthetic record dan jangan menjalankan P10/browser acceptance sebelum runtime prerequisite yang legitimate tersedia.

---

## 2026-08-26 — P21 Experimental Dataset & Simulation Comparison Foundation source publication

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Commit:** Source-publication commit for this entry
**PR:** open; no merge performed

### Temuan

P20 menyiapkan empty Evidence Center tetapi belum menyediakan surface yang memisahkan simulation-only display dari comparison terhadap laboratory measurement. Tanpa readiness gate, UI berisiko menghasilkan comparison, agreement, accuracy, confidence, atau validation claim sebelum sample, timestamp, unit, instrument, calibration, traceability, uncertainty, provenance, serta evidence measurement tersedia.

### Perubahan

P21 menambahkan Comparison Center, Comparison Record contract, Comparison Inspector, readiness gate, dan visual comparison foundation. Contract mendeklarasikan comparison reference, simulation/measurement references and fields, experiment/sample/instrument context, alignment state, calibration/traceability/uncertainty/provenance status, unit, interpretation limit, serta future value context untuk simulation value, measured value, difference, uncertainty, timestamp, dan provenance. Tidak ada Comparison Record, laboratory dataset, measured value, difference, graph, atau comparison result yang diisi.

Readiness gate mengevaluasi sample alignment, timestamp alignment, unit compatibility, instrument identity, calibration status, traceability status, uncertainty status, provenance status, dan measurement status. Karena zero evidence/data records dimuat, UI menampilkan **NO LABORATORY DATA LOADED**, **COMPARISON NOT READY**, dan **REQUIRED EVIDENCE MISSING**; tidak ada comparison calculation atau automatic verification.

### Data flow affected

P21 adalah client-side UI/contract tanpa persistence, database migration, API call, experiment/session, telemetry, atau CausalFrame mutation. Simulation side tetap dapat diberi label `SIMULATION`, sementara measurement side tetap `NOT LOADED`. Tidak ada perubahan pada `timestampSeconds`, `sensorAfter`, `effectiveCommands`, atau `actuatorLevels`; nilai tersebut tidak digunakan sebagai laboratory data atau validation evidence.

### Scientific impact

Tidak ada perubahan physics, PID, safety, CausalFrame, actuator authority, OAuth, backend, database, migration, certificate, calibration, uncertainty, evidence, sample, laboratory measurement, atau comparison outcome. UI tidak membuat accuracy score, confidence score, model validation score, agreement score, laboratory validation claim, atau ISO/IEC 17025 claim.

### Simulation/Lab boundary impact

`SIMULATION ≠ MEASURED`, `DERIVED ≠ MEASURED`, `UNKNOWN ≠ ZERO`, `COMPLETE ≠ VERIFIED`, dan `COMPARISON ≠ VALIDATION` dinyatakan pada UI/contract. Simulation-only data bukan experimental validation. Measurement side tidak dimunculkan tanpa evidence laboratory dan metadata prerequisite yang lengkap; comparison tetap evidence-bound dan blocked.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS — 39 files / 106 tests, termasuk `server/experimentalComparison.p21.test.ts`. `pnpm build`: PASS. `git diff --check`: PASS. Warning ukuran JavaScript bundle lebih dari 500 kB tetap non-blocking.

### Status

🟢 P21 **source publication** tervalidasi secara statis pada branch fitur tanpa merge. 🟡 Comparison Center adalah UI/contract foundation dengan zero loaded comparison and laboratory records; ini bukan comparison result ataupun validation. 🟡 Authenticated WebGL smoke tetap **BLOCKED** oleh OAuth/session/full backend deployment; P10 tidak berubah.

### Next action

Jangan menjalankan comparison sampai available records memiliki lawful sample/experiment/instrument identities, measurement and simulation references, unit compatibility, timestamp alignment, calibration, traceability, uncertainty, provenance, and interpretation methodology. Jangan mengisi contract dengan synthetic data dan jangan menjalankan P10/browser acceptance sampai runtime prerequisite yang legitimate tersedia.

---

## 2026-08-26 — P22 Experimental Identity & Evidence Integrity source publication

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Commit:** Source-publication commit for this entry
**PR:** open; no merge performed

### Source audit

P22 memeriksa `client/src/lib/instrumentRegistry.ts`, `client/src/lib/laboratoryEvidence.ts`, `client/src/lib/experimentalComparison.ts`, `server/scientificRecordIdentity.ts`, `shared/experimentNotebook.ts`, `shared/scientificData.ts`, `server/scientificDataset.ts`, `server/scientificDatasetPersistence.ts`, `server/scientificProvenance.ts`, `server/scientificEventJournal.ts`, `drizzle/schema.ts`, dan `drizzle/meta/_journal.json`. Tidak ditemukan konflik pada canonical persisted identity path; P22 tidak menggunakan adapter notebook in-memory yang membuat ID timestamp sebagai canonical identity.

Identifier dan mekanisme reusable yang ditemukan adalah canonical `researchExperiments.experimentId` dan `sampleId`; `experimentInstruments.instrumentId` serta `calibrationId`; `datasetManifests.id`/`sha256`; `provenanceRecords.id`; dan `scientificEventJournal.eventHash`/`previousHash`. `ScientificRecordIdentity` mempertahankan source experiment ID jika tersedia, sementara `PersistedScientificDataset` menghubungkan dataset, provenance, SHA-256, dan terminal event hash. Mekanisme hashing existing adalah SHA-256 di dataset manifest, event journal canonicalizer, dan simulation dataset persistence. P22 hanya mereferensikan mechanism tersebut sebagai future server-side reuse; tidak membuat hash mechanism kedua atau menghitung hash terhadap evidence yang tidak ada.

### Perubahan

P22 menambahkan `ExperimentalIdentity`, `EvidenceIntegrityRecord`, `EvidenceHashProvider` interface, readiness gates, Identity & Integrity Center, Identity Link Graph, Experimental Identity Inspector, Evidence Integrity Inspector, serta content Knowledge Center dalam mode SIMPLE, SCIENTIFIC, dan EXPERT. Empty contract menyimpan semua ID dan link sebagai `NOT LOADED`; tidak ada experiment, sample, simulation run, measurement, instrument physical record, calibration, dataset, evidence, provenance, timestamp, hash, maupun verified state yang dibuat.

### P17–P21 integration

P17 Instrument Registry, P18 Traceability Chain, dan P19 Uncertainty Budget ditautkan hanya sebagai evidence-bound contextual surfaces. P20 tetap memiliki zero evidence records dan diberi status identity `NOT LOADED`. P21 tetap **COMPARISON BLOCKED** dengan reason `IDENTITY INCOMPLETE`; P22 tidak menghitung difference, accuracy, confidence, validation, atau comparison result. Existing CausalFrame source, `timestampSeconds`, `sensorAfter`, `effectiveCommands`, dan `actuatorLevels` tidak diubah.

### Scientific impact

Tidak ada perubahan physics, PID, safety, closed-loop engine, ProcessMachine3D authority, CausalFrame authority, database, migration, OAuth, experiment/session, telemetry, measurement, laboratory evidence, certificate, calibration result, uncertainty value, comparison result, atau production record. `NOT LOADED` bukan nol; `UNKNOWN` tetap `UNKNOWN`; `VERIFIED` tidak muncul pada identity/evidence empty state. Tidak ada secret, credential, atau OAuth token yang disimpan.

### Simulation/Lab boundary impact

`SIMULATION ≠ MEASURED`, `DERIVED ≠ MEASURED`, `COMPARISON ≠ VALIDATION`, `COMPLETE ≠ VERIFIED`, dan `READY FOR VERIFICATION ≠ VERIFIED` ditegaskan dalam UI/contract. Integrity hanya menjawab keberadaan dan verifiability evidence payload; integrity bukan laboratory validation dan provenance bukan evidence proof secara otomatis.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS — 40 files / 110 tests, termasuk `server/experimentalIdentityIntegrity.p22.test.ts`. `pnpm build`: PASS. `git diff --check`: PASS. Warning ukuran JavaScript bundle lebih dari 500 kB tetap non-blocking.

### Status

🟢 P22 **source publication** tervalidasi secara statis pada branch fitur tanpa merge. 🟡 Identity & Integrity Center adalah UI/contract foundation dengan zero loaded identity/evidence records; ini bukan hash result, verification, integrity approval, atau validation. 🟡 Authenticated WebGL smoke tetap **BLOCKED** oleh OAuth/session/full backend deployment; P10 tidak berubah.

### Next action

Sebelum P22 dapat memverifikasi evidence, sediakan canonical persisted records dan governance yang disetujui untuk experiment/sample/instrument/calibration/dataset/evidence/provenance identity, authorized server-side hash verification, custody, retention, validation method, and reviewer ownership. Jangan mengisi empty contract dengan synthetic identifiers atau menjalankan P10/browser acceptance sebelum runtime prerequisite yang legitimate tersedia.

---

## 2026-08-26 — P23 Scientific Audit Trail & Reproducibility Foundation source publication

**AI/Worker:** Manus AI
**Branch:** `feature/control-room-ui`
**Commit:** Source-publication commit for this entry
**PR:** open; no merge performed

### Source audit

P23 memeriksa P17 Instrument Registry, P18 Traceability, P19 Uncertainty, P20 Laboratory Evidence, P21 Experimental Comparison, P22 Experimental Identity & Evidence Integrity, `CausalFrame`, `scientificEventJournal`, dataset manifests, provenance records, identity experiment/session, hash mechanism, `ProcessRunReplay`, `ProcessSimulator`, `closedLoopRuntimeStore`, dan `controlRoomObservability`. Tidak ditemukan kebutuhan untuk sistem audit paralel.

Canonical reuse yang ditemukan adalah `ScientificEvent` dengan `previousHash`/`eventHash` dan canonical SHA-256 journal, `ClosedLoopRuntimeSession` dengan canonical `sessionId`/`experimentId` serta accessor snapshot/frame history, `ProcessRunReplay` sebagai reader visual atas frame yang disediakan, `ControlRoomObservabilityEvent` sebagai browser-local lifecycle/operator/frame vocabulary, dan P22 identity/integrity/hash reference contract. Browser observability tidak diperlakukan sebagai scientific evidence chain, dan visual replay tidak diperlakukan sebagai scientific reproducibility.

### Perubahan

P23 menambahkan `ScientificAuditEvent`, `ScientificReplayReference`, Reproducibility Matrix, `getReproducibilityReadiness()`, `getReconstructionBlockedReasons()`, Scientific Reconstruction view, Reproducibility Inspector, dan Knowledge Center content dalam mode SIMPLE, SCIENTIFIC, dan EXPERT. Contract menyediakan field audit event yang dapat mereferensikan canonical event existing di masa depan tanpa membuat event runtime baru. Empty audit-event collection, replay reference, dan matrix state ditampilkan secara eksplisit.

Scientific Reconstruction menampilkan urutan konseptual **Experiment → Configuration → Simulation → Frame → Operator Action → Instrument → Evidence → Dataset → Comparison → Integrity**. Setiap tahap memuat status, source, provenance, reference, dan interpretation limit. Karena tidak ada record legitimate dimuat, UI menyatakan **Insufficient evidence for reconstruction**; tidak ada timeline sintetis, CausalFrame sintetis, atau audit event palsu.

### P17–P22 integration

P17 Instrument, P18 Traceability, P19 Uncertainty, P20 Evidence, P21 Comparison, dan P22 Identity/Integrity menjadi contextual references dalam reconstruction surface. P20 tetap **NO EVIDENCE LOADED**. P21 tetap blocked tanpa evidence. P22 identity, provenance, event hash, dan SHA-256 reference hanya direuse sebagai contract; P23 tidak menghitung hash, append event, memverifikasi integrity, atau menghasilkan validation.

### Data flow affected

P23 adalah client-side UI/contract layer tanpa persistence, database migration, API route, experiment/session creation, telemetry, atau CausalFrame mutation. `timestampSeconds`, `sensorAfter`, `effectiveCommands`, dan `actuatorLevels` tetap authority existing yang tidak dimodifikasi. P23 tidak menggunakan browser-local observability atau visual replay sebagai pengganti persisted scientific record.

### Scientific impact

Tidak ada perubahan physics, PID, safety, engine, ProcessMachine3D, CausalFrame, database, migration, OAuth, event journal persistence, hash mechanism, experiment/session lifecycle, measurement, laboratory evidence, calibration, uncertainty, comparison, validation, confidence, atau accuracy score. Default reproducibility readiness berada di **PARTIAL** akibat existing simulation/instrument contract surfaces, tetapi reproducibility tetap tidak dapat diklaim; **REPRODUCIBLE** tidak muncul pada empty state.

### Simulation/Lab boundary impact

`SIMULATION ≠ MEASURED`, `DERIVED ≠ MEASURED`, `COMPARISON ≠ VALIDATION`, `COMPLETE ≠ VERIFIED`, `READY FOR VERIFICATION ≠ VERIFIED`, dan **Replay visual ≠ scientific reproducibility** ditegaskan dalam UI/contract. `UNKNOWN` tetap `UNKNOWN`, `NOT LOADED` tetap `NOT LOADED`, dan absence of reconstruction evidence tidak diganti oleh inferensi.

### Tests / Quality Gate

`pnpm check`: PASS. `pnpm test`: PASS — 41 files / 114 tests, termasuk `server/scientificAuditTrail.p23.test.ts`. `pnpm build`: PASS. `git diff --check`: PASS. Warning ukuran JavaScript bundle lebih dari 500 kB tetap non-blocking.

### Status

🟢 P23 **source publication** tervalidasi secara statis pada branch fitur tanpa merge. 🟡 Audit Trail dan Reproducibility adalah UI/contract foundation dengan zero loaded scientific audit events dan zero reconstruction records; bukan scientific reproduction, integrity verification, atau validation. 🟡 Authenticated WebGL smoke tetap **BLOCKED** oleh OAuth/session/full backend deployment; P10 tidak berubah.

### Next action

Sebelum reconstruction/reproducibility legitimate dapat dinyatakan, sediakan canonical persisted experiment/session/configuration/frame/event/dataset/evidence/provenance/integrity records, authorized hash verification, custody/retention governance, reviewer ownership, dan runtime evidence yang sah. Jangan membuat synthetic audit trail atau menjalankan P10/browser acceptance sebelum prerequisite yang legitimate tersedia.

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

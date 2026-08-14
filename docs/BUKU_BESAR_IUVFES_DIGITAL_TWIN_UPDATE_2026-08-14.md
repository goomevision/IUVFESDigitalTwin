# BUKU BESAR IUVFES DIGITAL TWIN — UPDATE 2026-08-14

> **LIVING ADDENDUM / AI HANDOVER UPDATE**
>
> Dokumen ini adalah addendum resmi terhadap `docs/BUKU_BESAR_IUVFES_DIGITAL_TWIN.md`. Jangan menghapus baseline lama. AI/developer berikutnya wajib membaca Buku Besar utama + addendum ini.

**Repository:** `goomevision/IUVFESDigitalTwin`
**Branch snapshot terakhir yang diperiksa:** `debug/full-source-20260813`
**Tanggal update:** 2026-08-14

---

## 1. STATUS BESAR TERKINI

IUVFES telah berkembang dari Control Room UI menjadi platform yang semakin jelas arahnya sebagai **Scientific Digital Twin / Virtual Laboratory**.

Fokus perkembangan terbaru:

1. Scientific Experiment Intake.
2. Material selection dan material API.
3. Closed-loop process simulation.
4. Process Machine 3D.
5. Live Process Trend.
6. Causal Frame Inspector.
7. Process Replay / Time Machine.
8. Scientific evidence / provenance.
9. Formula dan scientific-model audit.
10. UI readability dan layout stability.
11. Local-development authentication safeguards.
12. Materi presentasi untuk universitas/lembaga penelitian.

---

## 2. PERKEMBANGAN UI DAN BUG FIX TERBARU

### 2.1 Scientific material selector

Radix Select pada scientific material intake telah diganti dengan **native HTML `<select>`** untuk menghindari race condition DOM yang sebelumnya memicu error React:

```text
NotFoundError: Failed to execute 'removeChild' on 'Node'
```

dan:

```text
NotFoundError: Failed to execute 'insertBefore' on 'Node'
```

Perubahan tercatat pada commit:

```text
0b65ed9 fix(ui): replace scientific material Radix Select with native select
```

Konsekuensi arsitektural:

- selector material harus tetap stabil terhadap React reconciliation;
- jangan mengembalikan portal-based Select ke alur ini tanpa audit reproduksi error;
- native select sekarang menjadi baseline untuk scientific material intake.

---

## 3. API URL / LOCAL DEVELOPMENT

Guard telah ditambahkan terhadap malformed `VITE_IUVFES_API_URL` pada tRPC client.

Commit terkait:

```text
213bee2 fix(api): guard malformed IUVFES API URL in tRPC client
```

Selain itu local OAuth telah dibuat lebih aman:

```text
68fe47e fix(auth): prevent invalid OAuth URL during local development
```

`client/src/const.ts` sekarang tidak boleh membuat atau menavigasi ke URL OAuth invalid ketika `VITE_OAUTH_PORTAL_URL` tidak tersedia.

### Local environment finding

Pada local development:

```text
OAUTH_SERVER_URL is not configured
```

masih muncul sebagai warning/error konfigurasi OAuth server.

Namun server tetap dapat berjalan pada local development dengan mode yang sesuai.

**Jangan menganggap warning OAuth ini sebagai bukti bahwa scientific simulation engine rusak.** Pisahkan:

```text
AUTH CONFIGURATION
≠
SIMULATION ENGINE
```

---

## 4. MATERIAL API

Endpoint berikut telah diverifikasi pada local server:

```text
GET /api/trpc/materials.list
HTTP 200
```

Data material yang berhasil dikembalikan antara lain:

- Eucalyptus;
- Lavender;
- Nilam (Patchouli);
- Peppermint;
- Rosemary.

Data juga membawa:

- defaultWaterContent;
- defaultOilContent;
- oilComposition;
- timestamps;
- metadata Date dari superjson.

Temuan penting:

> Material API local sudah memberikan data aktual dari backend. Jangan membuat daftar material synthetic di UI jika API tersedia.

---

## 5. AUTH / SAVE FLOW

Pada local test ditemukan:

```text
[Auth] Missing session cookie
```

Ketika endpoint protected dipanggil tanpa session, perilaku unauthorized/login redirect perlu tetap dipisahkan dari keberhasilan endpoint public seperti `materials.list`.

Prinsip:

```text
materials.list HTTP 200
        ≠
protected mutation authorized
```

Untuk debugging save flow:

1. pastikan request menuju endpoint yang benar;
2. pastikan mutation protected memang membutuhkan session;
3. periksa cookie/session atau local-dev auth path;
4. jangan menyimpulkan database failure hanya dari pesan `Please login`.

---

## 6. ANALYTICS PLACEHOLDER

Placeholder berikut sebelumnya menghasilkan request malformed:

```text
%VITE_ANALYTICS_ENDPOINT%
```

yang menyebabkan:

```text
Malformed URI sequence
URIError: Failed to decode param
```

Perbaikan telah dibuat:

```text
7a2efb3 fix(dev): remove unresolved analytics placeholders from local HTML
```

Baseline local tidak boleh lagi bergantung pada placeholder analytics yang belum di-resolve.

---

## 7. PROCESS SIMULATOR — LAYOUT / VISIBILITY

Masalah UI yang ditemukan:

- **INSPEKTUR RANGKA** terus membesar;
- akibatnya **TREN PROSES LANGSUNG** semakin menyempit;
- visual 3D terlalu gelap sehingga animasi sulit diamati.

Perbaikan yang telah dibuat pada workstream:

```text
fix/process-simulator-visibility-layout
```

Perubahan meliputi:

### ProcessMachine3D

Peningkatan readability visual 3D.

### Layout override

File:

```text
client/src/process-simulator-overrides.css
```

Tujuan:

- membatasi pertumbuhan vertikal inspector;
- memberikan scroll internal;
- menjaga Live Process Trend agar tidak ikut stretched;
- meningkatkan brightness/contrast/saturation canvas 3D;
- mempertahankan layout responsive.

Import telah ditambahkan pada:

```text
client/src/main.tsx
```

### Catatan penting

Perubahan ini bersifat **presentation/layout layer**.

Tidak boleh digunakan untuk mengubah:

- state engine;
- physics;
- formula;
- controller;
- material data;
- sensor values.

---

## 8. CAUSAL FRAME INSPECTOR

Branch `fix/process-simulator-visibility-layout` juga menerima perkembangan pada:

```text
client/src/components/CausalFrameInspector.tsx
```

Commit yang terdeteksi:

```text
60d1d35
```

Perkembangan ini memperkuat fungsi inspector sebagai alat membaca hubungan kausal frame.

Inspector harus tetap diposisikan sebagai **observability/debug/scientific inspection layer**, bukan sumber physics baru.

---

## 9. FORMULA / SCIENTIFIC MODEL AUDIT

Audit sebelumnya telah menetapkan bahwa formula tidak boleh hanya menghasilkan angka yang terlihat masuk akal.

Formula harus:

1. memiliki definisi;
2. memiliki satuan;
3. memiliki domain validitas;
4. menggunakan parameter yang jelas;
5. memiliki hubungan causal dengan state engine;
6. dapat diuji dengan regression/sanity test;
7. dibedakan antara model approximation dan experimentally validated model.

Area formula yang menjadi perhatian:

- Antoine / vapor pressure;
- Fick / diffusion;
- mass balance;
- energy balance;
- recovery/yield;
- efficiency;
- pressure/temperature coupling;
- ultrasonic contribution;
- vacuum/conductance.

### Prinsip status ilmiah

```text
FORMULA IMPLEMENTED
        ≠
MODEL PHYSICALLY COMPLETE
        ≠
EXPERIMENTALLY VALIDATED
```

Jangan mengklaim validasi eksperimen hanya karena TypeScript test atau simulation regression test lulus.

---

## 10. QUALITY GATE TERKINI

Local verification terakhir yang dilaporkan:

```text
pnpm check
```

hasil:

```text
tsc --noEmit
PASS
```

`git diff --check`:

```text
PASS
```

Server Vitest:

```text
22 test files passed
55 tests passed
```

Jadi pada snapshot pengujian tersebut:

```text
TypeScript = PASS
Server regression suite = PASS
```

Tetapi ini **bukan** berarti seluruh scientific model telah experimentally validated.

---

## 11. REPOSITORY BASELINE TERKINI

Snapshot yang telah diperiksa:

```text
0b65ed9 fix(ui): replace scientific material Radix Select with native select
7a2efb3 fix(dev): remove unresolved analytics placeholders from local HTML
68fe47e fix(auth): prevent invalid OAuth URL during local development
ea6005d debug: snapshot full local source for investigation
213bee2 fix(api): guard malformed IUVFES API URL in tRPC client
```

Repository juga memiliki dokumentasi inti:

- `docs/BUKU_BESAR_IUVFES_DIGITAL_TWIN.md`
- `docs/CONTROL_ROOM_NEXT_WORK_ORDER.md`
- `docs/CONTROL_ROOM_PARALLEL_WORKSTREAM_CONTRACT.md`
- `docs/PROCESS_SIMULATOR_DATA_FLOW.md`
- `docs/ScientificValidationLayer.md`
- `docs/ScientificDataArchitecture.md`
- `docs/ScientificExperimentLifecycle.md`
- `docs/ScientificEventJournal.md`
- `docs/ScientificDatasetProvenance.md`
- `docs/ExperimentReplay.md`

---

## 12. PRESENTATION / UNIVERSITY POSITIONING

Pada 2026-08-14 telah dibuat materi presentasi:

```text
IUVFES Digital Twin — Scientific Digital Twin / Virtual Laboratory
```

Narasi utama untuk universitas/lembaga penelitian:

```text
INPUT
  ↓
SIMULATION
  ↓
3D + LIVE TREND
  ↓
CAUSAL FRAME
  ↓
REPLAY
  ↓
EVIDENCE
  ↓
SCIENTIFIC REPORT
  ↓
LAB CALIBRATION
  ↓
EXPERIMENTAL VALIDATION
```

IUVFES diposisikan sebagai platform kolaborasi lintas:

- teknik/proses;
- fisika;
- kimia/material;
- instrumentasi;
- informatika;
- data science;
- penelitian laboratorium.

### Pesan akademik wajib

IUVFES bukan pengganti laboratorium fisik.

IUVFES adalah sarana untuk:

- memahami proses;
- merancang eksperimen;
- menguji skenario;
- melihat causal behavior;
- mengelola scientific evidence;
- mengkalibrasi model;
- mendukung validasi terhadap data laboratorium.

---

## 13. ARAH AUDIT BERIKUTNYA

Sebelum melanjutkan feature besar, audit harus diprioritaskan sebagai berikut:

### A. Formula traceability

Untuk setiap angka yang tampil di UI:

```text
UI value
 ↓
source state
 ↓
engine function
 ↓
formula
 ↓
parameter
 ↓
unit
 ↓
validation/test
```

### B. Mass balance

Pastikan:

```text
input mass
≈
water removed + oil recovered + residual
```

dengan residual yang eksplisit bila model belum menutup neraca secara sempurna.

### C. Energy balance

Pisahkan:

- heating;
- vacuum;
- ultrasonic;
- cooling;
- other energy;
- total energy.

### D. Unit consistency

Audit:

- Pa;
- kPa;
- mbar;
- bar;
- °C/K;
- kg/g;
- L/m³;
- W/kW;
- J/MJ/kWh;
- seconds/minutes/hours.

### E. Model vs measurement

Pastikan label UI tidak membuat simulation-derived value terlihat sebagai laboratory measurement.

### F. Closed-loop causal integrity

Pastikan:

```text
sensorBefore
→ controller
→ intended
→ safety
→ effective
→ dynamics
→ observed
```

tidak dilewati oleh UI shortcut.

### G. Replay integrity

Pastikan replay benar-benar menggunakan historical frames dan bukan menjalankan physics baru.

### H. UI stability

Khusus regression yang harus diuji ulang:

- Scientific material selector;
- Save flow;
- Play/Run;
- Pause/Resume;
- Stop/Reset;
- Causal Inspector resize;
- Live Trend width;
- ProcessMachine3D visibility;
- React DOM reconciliation.

---

## 14. ATURAN UNTUK AI / DEVELOPER BERIKUTNYA

1. **Baca Buku Besar utama dan addendum ini sebelum patch.**
2. Jangan mengembalikan Radix Select ke scientific material flow tanpa alasan dan reproduksi test.
3. Jangan memperbaiki UI dengan mengubah physics.
4. Jangan memperbaiki formula hanya dengan mengubah angka output.
5. Jangan membuat synthetic telemetry.
6. Jangan menyamakan simulation dengan measurement.
7. Jangan menyatakan validation PASS tanpa experimental evidence.
8. Setiap formula baru harus memiliki unit dan test.
9. Setiap perubahan layout harus diuji terhadap inspector/trend/3D secara bersamaan.
10. Setiap bug DOM harus dicatat sebagai regression risk.
11. Pertahankan `intendedCommands`, `effectiveCommands`, dan observed response.
12. Setelah patch jalankan minimal:

```text
pnpm check
pnpm exec vitest run server
```

13. Jika menyentuh build/deployment, lanjutkan quality gate build yang berlaku.
14. Update Buku Besar/Addendum setelah milestone atau bug penting.

---

## 15. STATUS RINGKAS 2026-08-14

| Area | Status |
|---|---|
| Scientific Digital Twin architecture | ACTIVE |
| Closed-loop simulation | ACTIVE |
| Causal frames | ACTIVE |
| Control Room | ACTIVE |
| Material API | VERIFIED LOCAL |
| Native scientific material selector | FIXED |
| Malformed API URL guard | FIXED |
| Local OAuth invalid URL guard | FIXED |
| Analytics placeholder issue | FIXED |
| 3D readability | PATCHED / VERIFY VISUALLY |
| Inspector vs Live Trend layout | PATCHED / VERIFY VISUALLY |
| Causal Frame Inspector | ACTIVE / EVOLVING |
| Replay | ACTIVE |
| Evidence | ACTIVE |
| Scientific report pipeline | ACTIVE / EVOLVING |
| Formula audit | REQUIRED / ONGOING |
| Mass balance audit | REQUIRED |
| Energy balance audit | REQUIRED |
| Experimental validation | NOT CLAIMED |
| University collaboration package | INITIAL PRESENTATION READY |

---

## 16. FINAL HANDOVER STATEMENT

> **IUVFES saat ini harus diperlakukan sebagai Scientific Digital Twin yang sedang bergerak dari functional simulation menuju research-grade virtual laboratory. Fokus pengembangan berikutnya bukan sekadar menambah widget atau mempercantik dashboard, tetapi memastikan setiap angka, state, command, formula, frame, replay, evidence, dan report memiliki hubungan causal, satuan, provenance, testability, dan batas ilmiah yang jelas.**

**END OF UPDATE — 2026-08-14**

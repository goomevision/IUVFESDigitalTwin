# IUVFES CONTROL ROOM — STAGED UI WORK MAP

> **Living task map / implementation order / anti-overlap guard**
>
> Dokumen ini menjadi peta kerja bertahap untuk penyempurnaan Control Room IUVFES. Tujuannya mencegah pekerjaan saling menimpa, mencegah AI/developer berikutnya mengulang pekerjaan, dan memastikan setiap tahap memiliki batas yang jelas.
>
> **Repository:** `goomevision/IUVFESDigitalTwin`
> **Working branch:** `feature/control-room-ui`
> **Primary architecture reference:** `docs/BUKU_BESAR_IUVFES_DIGITAL_TWIN.md`
>
> ---
>
> ## 0. ATURAN KERJA WAJIB
>
> 1. Baca Buku Besar dan dokumen ini sebelum coding.
> 2. Audit sebelum patch.
> 3. Satu fase aktif pada satu waktu kecuali dependensi eksplisit.
> 4. Jangan mengerjakan fase berikutnya sebelum acceptance gate fase aktif terpenuhi.
> 5. Jangan mengubah physics/engine hanya untuk mempercantik UI.
> 6. UI tidak boleh membuat telemetry atau angka physics sendiri.
> 7. Data tidak tersedia harus ditampilkan sebagai `UNKNOWN`, `N/A`, atau status yang sesuai.
> 8. Pertahankan perbedaan `SIMULATION`, `LITERATURE`, `LABORATORY`, `DERIVED`, dan `HYPOTHESIS`.
> 9. Pertahankan perbedaan `intended command`, `effective command`, dan `physical/observed response`.
> 10. Setiap perubahan harus kecil, dapat diuji, dapat dilacak, dan dapat dibalik.
> 11. Setelah fase selesai: typecheck → test/regression → build → review data flow → update Buku Besar/status map.
> 12. Jangan membuat screenshot/demo dengan data palsu hanya untuk memenuhi tampilan.
>
> ---
>
> # 1. MASTER MAP
>
> ```text
> P0  BASELINE & DATA CONTRACT
>         ↓
> P1  UI MASTER MAP + DESIGN TOKENS
>         ↓
> P2  CONTROL ROOM GRID / SHELL
>         ↓
> P3  HEADER + NAVIGATION + OPERATOR RAIL
>         ↓
> P4  PROCESS MACHINE / 3D HERO
>         ↓
> P5  INSTRUMENT STRIP
>         ↓
> P6  TREND / GRAPH
>         ↓
> P7  CAUSAL INSPECTOR
>         ↓
> P8  EVENT TIMELINE
>         ↓
> P9  SCIENTIFIC RECORDER / EVIDENCE
>         ↓
> P10 REPLAY SYNCHRONIZATION
>         ↓
> P11 UNKNOWN / EMPTY / ERROR / SAFETY STATES
>         ↓
> P12 RESPONSIVE + VISUAL QA
>         ↓
> P13 FINAL QUALITY GATE
> ```
>
> Tidak boleh melompat langsung ke P4/P5/P6 jika P1-P3 belum menetapkan layout dan kontrak visual.
>
> ---
>
> # 2. P0 — BASELINE & DATA CONTRACT
>
> **Status:** IN PROGRESS / GATE PRIORITAS
>
> ### Tujuan
> Memastikan UI dibangun di atas data engine/CausalFrame yang benar.
>
> ### Tugas
> - [ ] Audit `ProcessSimulator.tsx`.
> - [ ] Audit `ProcessMachine3D.tsx`.
> - [ ] Audit `ProcessEventTimeline.tsx`.
> - [ ] Audit `ScientificRunRecorder.tsx`.
> - [ ] Audit session API/tRPC.
> - [ ] Audit `CausalFrame` contract.
> - [ ] Audit replay data source.
> - [ ] Audit provenance/evidence contract.
> - [ ] Catat discrepancy antara local clone dan GitHub bila ada.
> - [ ] Diagnosis snapshot/restore `MachineDynamicsEngine` sebelum perubahan yang dapat memengaruhi replay determinism.
>
> ### Acceptance Gate
> UI developer dapat menunjuk sumber data setiap angka utama tanpa membuat kontrak lokal baru.
>
> ---
>
> # 3. P1 — UI MASTER MAP + DESIGN TOKENS
>
> **Status:** NOT STARTED
>
> ### Target layout
>
> ```text
> ┌──────────────────────────────────────────────────────┐
> │ SYSTEM HEADER                                        │
> ├──────────────┬───────────────────────────┬───────────┤
> │ OPERATOR     │ PROCESS MACHINE / HERO    │ SYSTEM    │
> │ CONTROL      │                           │ STATUS    │
> │              │                           │ SAFETY    │
> │              │                           │ HARDWARE  │
> ├──────────────┴───────────────────────────┴───────────┤
> │ LIVE INSTRUMENT STRIP                                │
> ├──────────────────────────────────────────────────────┤
> │ TREND / PROCESS GRAPH                                │
> ├──────────────────────────────────────────────────────┤
> │ CAUSAL TRACE / EVENT / RECORDER                      │
> └──────────────────────────────────────────────────────┘
> ```
>
> ### Tugas
> - [ ] Tetapkan grid desktop.
> - [ ] Tetapkan spacing scale.
> - [ ] Tetapkan typography hierarchy.
> - [ ] Tetapkan panel/card rules.
> - [ ] Tetapkan status vocabulary: RUNNING, PAUSED, STOPPED, COMPLETE, FAULT, UNKNOWN.
> - [ ] Tetapkan provenance vocabulary.
> - [ ] Tetapkan visual hierarchy: Machine → Instrument → Science metadata.
>
> ### Acceptance Gate
> Tidak ada komponen baru yang menentukan spacing/typography/status style secara independen.
>
> ---
>
> # 4. P2 — CONTROL ROOM GRID / SHELL
>
> **Status:** NOT STARTED
>
> ### Tugas
> - [ ] Bangun shell/grid utama.
> - [ ] Pastikan tidak ada horizontal overflow.
> - [ ] Tetapkan area tetap untuk hero machine.
> - [ ] Tetapkan rail kiri/kanan.
> - [ ] Tetapkan instrument strip dan analytics area.
> - [ ] Jangan mengubah engine.
>
> ### Acceptance Gate
> Semua area utama terlihat rapi pada desktop target tanpa komponen saling menimpa.
>
> ---
>
> # 5. P3 — HEADER + NAVIGATION + OPERATOR RAIL
>
> **Status:** NOT STARTED
>
> ### Navigation target
>
> `CONTROL ROOM / PROCESS / TREND / CAUSAL TRACE / MATERIAL / EXPERIMENT / EVIDENCE / REPORT / DIAGNOSTICS`
>
> ### Tugas
> - [ ] Header system status.
> - [ ] Experiment/session identity.
> - [ ] Navigation.
> - [ ] Operator controls START/PAUSE/RESUME/STOP/RESET.
> - [ ] Safety state visibility.
>
> ### Acceptance Gate
> Operator mengetahui status mesin dan kontrol utama tanpa membuka panel tambahan.
>
> ---
>
> # 6. P4 — PROCESS MACHINE / 3D HERO
>
> **Status:** NOT STARTED / BINDING AUDIT REQUIRED
>
> ### Tujuan
> Menjadikan mesin proses sebagai wajah utama simulator.
>
> ### Visual chain
>
> ```text
> Reactor → Material → Ultrasonic → Vapor/Flow → Cold Traps → Vacuum Pump
> ```
>
> ### Tugas
> - [ ] Audit existing Three.js lifecycle.
> - [ ] Bind reactor state ke CausalFrame/session.
> - [ ] Bind ultrasonic state.
> - [ ] Bind flow/pipe state hanya bila data tersedia.
> - [ ] Bind cold-trap state/diagnostics.
> - [ ] Bind vacuum pump state.
> - [ ] Animasi harus merepresentasikan state nyata dari engine, bukan random animation.
> - [ ] Pastikan React/Three.js cleanup aman.
>
> ### Acceptance Gate
> START/STEP/PAUSE/STOP mengubah visual machine sesuai state engine dan tidak menimbulkan leak/cleanup error.
>
> ---
>
> # 7. P5 — LIVE INSTRUMENT STRIP
>
> **Status:** NOT STARTED
>
> ### Target channels
> - Temperature
> - Pressure
> - Yield
> - Oil recovered
> - Water removed
> - Energy
> - Ultrasonic frequency/power bila tersedia
>
> ### Tugas
> - [ ] Semua channel mengambil data dari frame/session.
> - [ ] Unit fisik konsisten.
> - [ ] Timestamp/step jelas.
> - [ ] Unknown state jelas.
> - [ ] Tidak ada synthetic telemetry.
>
> ### Acceptance Gate
> Setiap angka dapat ditelusuri ke frame tertentu.
>
> ---
>
> # 8. P6 — TREND / PROCESS GRAPH
>
> **Status:** NOT STARTED
>
> ### Tugas
> - [ ] Trend temperature.
> - [ ] Trend pressure.
> - [ ] Trend frequency/power bila tersedia.
> - [ ] Trend extraction/output bila tersedia.
> - [ ] Shared timeline dengan CausalFrame.
> - [ ] Cursor replay tersinkron dengan machine/instrument.
>
> ### Acceptance Gate
> Satu frame replay mengubah machine + instrument + graph pada timestamp/step yang sama.
>
> ---
>
> # 9. P7 — CAUSAL INSPECTOR
>
> **Status:** NOT STARTED / PENDING VERIFICATION
>
> ### Struktur
>
> ```text
> SENSOR BEFORE
>       ↓
> CONTROLLER / INTERLOCK
>       ↓
> INTENDED COMMAND
>       ↓
> EFFECTIVE COMMAND
>       ↓
> PHYSICAL RESPONSE
>       ↓
> SENSOR AFTER
> ```
>
> ### Tugas
> - [ ] Inspector berbasis selected frame.
> - [ ] Tampilkan intended/effective command terpisah.
> - [ ] Tampilkan safety/interlock.
> - [ ] Tampilkan transition reason.
> - [ ] Tampilkan provenance/source.
>
> ### Acceptance Gate
> Operator/researcher dapat menjawab "mengapa nilai berubah" dari satu frame tanpa membaca source code.
>
> ---
>
> # 10. P8 — EVENT TIMELINE
>
> **Status:** NOT STARTED / EXISTING COMPONENT AUDIT REQUIRED
>
> ### Tugas
> - [ ] Stage transitions.
> - [ ] Alarms.
> - [ ] Interlocks.
> - [ ] Important hardware events.
> - [ ] Selected event → selected frame.
>
> ### Acceptance Gate
> Event timeline dan causal inspector menunjuk frame yang sama.
>
> ---
>
> # 11. P9 — SCIENTIFIC RECORDER / EVIDENCE
>
> **Status:** PARTIALLY IMPLEMENTED / AUDIT REQUIRED
>
> ### Tugas
> - [ ] Recorder tidak membuat data baru.
> - [ ] Evidence mempertahankan experiment/session/frame range.
> - [ ] Provenance jelas.
> - [ ] Boundary `SIMULATION` jelas.
> - [ ] SHA-256/canonical evidence tetap utuh.
> - [ ] Export JSON tetap reproducible.
>
> ### Acceptance Gate
> Evidence dapat dibuat ulang dari frame yang sama dan menghasilkan payload canonical yang konsisten.
>
> ---
>
> # 12. P10 — REPLAY SYNCHRONIZATION
>
> **Status:** PARTIALLY IMPLEMENTED / PENDING VERIFICATION
>
> ### Tugas
> - [ ] Replay hanya menggunakan valid CausalFrame.
> - [ ] Play/pause/step/reset.
> - [ ] Machine mengikuti selected frame.
> - [ ] Instrument mengikuti selected frame.
> - [ ] Trend cursor mengikuti selected frame.
> - [ ] Causal inspector mengikuti selected frame.
> - [ ] Event timeline mengikuti selected frame.
> - [ ] Tidak membuat fallback frame palsu.
> - [ ] Audit snapshot/restore dynamics untuk determinism.
>
> ### Acceptance Gate
> Replay frame N selalu menghasilkan visual dan data yang sama untuk frame N.
>
> ---
>
> # 13. P11 — UNKNOWN / EMPTY / ERROR / SAFETY STATES
>
> **Status:** NOT STARTED
>
> ### Tugas
> - [ ] UNKNOWN state.
> - [ ] No data state.
> - [ ] Loading state.
> - [ ] API unavailable.
> - [ ] Session expired.
> - [ ] Fault state.
> - [ ] Safety interlock state.
> - [ ] Unsupported legacy replay state.
>
> ### Prinsip
> `UNKNOWN` adalah status ilmiah yang valid, bukan angka yang harus dipaksa tersedia.
>
> ---
>
> # 14. P12 — RESPONSIVE + VISUAL QA
>
> **Status:** NOT STARTED
>
> ### Target
> - [ ] 1920×1080
> - [ ] 1440×900
> - [ ] laptop
> - [ ] tablet
> - [ ] mobile
>
> ### Checklist
> - [ ] Tidak overflow.
> - [ ] Tidak ada card terpotong.
> - [ ] Tidak ada angka bertabrakan.
> - [ ] Alignment konsisten.
> - [ ] Typography konsisten.
> - [ ] Status konsisten.
> - [ ] Loading/empty/error states terlihat benar.
>
> ---
>
> # 15. P13 — FINAL QUALITY GATE
>
> **Status:** BLOCKED UNTIL P0-P12 COMPLETE
>
> ### Required checks
> - [ ] `pnpm check`
> - [ ] `pnpm test`
> - [ ] regression tests
> - [ ] `pnpm build`
> - [ ] replay determinism
> - [ ] evidence integrity
> - [ ] UI data-flow review
> - [ ] GitHub Quality Gate
> - [ ] Buku Besar updated
>
> ### Final principle
>
> ```text
> UI terlihat hidup
>       TETAPI
> tidak boleh menciptakan data.
> ```
>
> ---
>
> # 16. DEFINITION OF DONE PER FASE
>
> Sebuah fase hanya boleh diberi status **DONE** jika:
>
> 1. kode telah diubah sesuai scope fase;
> 2. tidak ada pekerjaan fase berikutnya yang diselundupkan ke dalamnya;
> 3. typecheck/test/build yang relevan lulus;
> 4. data flow dapat dijelaskan;
> 5. tidak ada synthetic scientific value;
> 6. acceptance gate terpenuhi;
> 7. perubahan tercatat di Buku Besar atau changelog;
> 8. commit menjadi checkpoint yang jelas.
>
> ---
>
> # 17. CHECKPOINT REGISTER
>
> | Phase | Status | Checkpoint/Commit | Notes |
> |---|---|---|---|
> | P0 | IN PROGRESS | — | Baseline, data contract, persistence audit |
> | P1 | NOT STARTED | — | Master map + design tokens |
> | P2 | NOT STARTED | — | Control Room shell |
> | P3 | NOT STARTED | — | Header/nav/operator |
> | P4 | NOT STARTED | — | 3D hero |
> | P5 | NOT STARTED | — | Instrument strip |
> | P6 | NOT STARTED | — | Trend |
> | P7 | NOT STARTED | — | Causal inspector |
> | P8 | NOT STARTED | — | Event timeline |
> | P9 | AUDIT | — | Recorder/evidence |
> | P10 | AUDIT | — | Replay synchronization |
> | P11 | NOT STARTED | — | State handling |
> | P12 | NOT STARTED | — | Responsive/visual QA |
> | P13 | BLOCKED | — | Final Quality Gate |
>
> ---
>
> # 18. ANTI-OVERLAP RULE
>
> Jika AI/developer berikutnya menerima perintah umum seperti **"lanjutkan"**, langkah default adalah:
>
> 1. baca Buku Besar;
> 2. baca dokumen ini;
> 3. identifikasi fase aktif paling awal yang belum DONE;
> 4. audit kondisi repository saat ini;
> 5. kerjakan hanya scope fase tersebut;
> 6. jalankan acceptance gate;
> 7. catat hasil;
> 8. baru pindah ke fase berikutnya.
>
> **Jangan melompat fase hanya karena komponen berikutnya terlihat menarik.**
>
> ---
>
> # 19. TUJUAN AKHIR
>
> Control Room IUVFES harus memberikan pengalaman:
>
> ```text
> OPERATOR MELIHAT MESIN
>          ↓
> MELIHAT DATA AKTUAL DARI ENGINE
>          ↓
> MELIHAT HUBUNGAN SEBAB-AKIBAT
>          ↓
> DAPAT MEREPLAY PROSES
>          ↓
> DAPAT MENGAMBIL EVIDENCE
>          ↓
> DAPAT MENYUSUN LAPORAN
>          ↓
> DAPAT MEMBEDAKAN YANG SUDAH DIKETAHUI,
> YANG BELUM DIKETAHUI, DAN HASIL ANALISIS
>          ↓
> DAPAT MENENTUKAN UJI LABORATORIUM BERIKUTNYA
> ```
>
> Ini bukan sekadar target estetika. Ini adalah target integrasi **UI + engine + causal data + evidence + scientific workflow** IUVFES.

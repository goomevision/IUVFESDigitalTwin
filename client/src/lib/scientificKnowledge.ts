export type LiteracyMode = "SIMPLE" | "SCIENTIFIC" | "EXPERT";
export type Availability = "AVAILABLE" | "PARTIAL" | "NOT AVAILABLE" | "FUTURE CAPABILITY";

export interface KnowledgeMethod {
  id: string;
  title: string;
  availability: Availability;
  what: string;
  why: string;
  input: string;
  process: string;
  output: string;
  limitation: string;
  evidenceRequirement: string;
  source: string;
}

export const literacyModes: Record<LiteracyMode, { title: string; description: string }> = {
  SIMPLE: { title: "SIMPLE", description: "Bahasa inti untuk memahami fungsi dan batas sistem." },
  SCIENTIFIC: { title: "SCIENTIFIC", description: "Menampilkan klasifikasi, sumber, provenance, dan batas evidence." },
  EXPERT: { title: "EXPERT", description: "Menampilkan field contract dan hubungan kausal yang tersedia." },
};

export const overviewFlow = ["Input", "Material", "Experiment", "Simulation", "CausalFrame", "3D Twin", "Analysis", "Evidence", "Laboratory", "Knowledge", "Next Experiment"];

export const scientificStatus = [
  ["KNOWN", "Informasi tersedia dari source yang dinyatakan; bukan otomatis bukti laboratorium."],
  ["UNKNOWN", "Informasi tidak tersedia dan tidak diisi dengan asumsi atau angka pengganti."],
  ["OBSERVED", "Nilai yang berasal dari observasi atau instrumen dengan evidence yang sesuai."],
  ["DERIVED", "Nilai yang dihitung atau dihasilkan model; bukan pengukuran langsung."],
  ["SIMULATION", "Nilai berasal dari ClosedLoopSimulationEngine atau CausalFrame."],
  ["LABORATORY", "Hanya berlaku apabila dataset laboratorium yang sesuai tersedia dan ditautkan."],
  ["HYPOTHESIS", "Pernyataan yang perlu diuji; bukan fakta atau hasil tervalidasi."],
  ["AI ANALYSIS", "Interpretasi/pola/gap yang tidak dapat menjadi bukti eksperimental tanpa evidence laboratorium."],
] as const;

export const methods: KnowledgeMethod[] = [
  {
    id: "simulation", title: "Simulation", availability: "AVAILABLE",
    what: "Closed-loop process simulation yang menghasilkan state proses sebagai CausalFrame.",
    why: "Membuat hubungan sensor, controller, command, safety, physical response, dan frame dapat ditelusuri.",
    input: "Experiment input dan target/limit operator yang tersedia.",
    process: "closedLoop session → ClosedLoopSimulationEngine → CausalFrame.",
    output: "Frame simulation-derived untuk visual, trend, replay, recorder, dan evidence.",
    limitation: "Tidak sama dengan observasi atau validasi laboratorium.",
    evidenceRequirement: "Laboratory comparison dataset diperlukan untuk klaim validasi fisik.",
    source: "docs/PROCESS_SIMULATOR_DATA_FLOW.md",
  },
  {
    id: "causal-analysis", title: "Causal Analysis", availability: "AVAILABLE",
    what: "Pembacaan urutan sensor-before → controller/interlock → intended command → effective command → physical/observed state.",
    why: "Membedakan permintaan controller, batas safety, dan respons model.",
    input: "CausalFrame yang tersedia dari closed-loop engine.",
    process: "CausalFrameInspector dan replay membaca frame tanpa membuat state baru.",
    output: "Trace hubungan kausal dan transition/safety context.",
    limitation: "Hanya sejauh field yang tersedia dalam CausalFrame.",
    evidenceRequirement: "Frame persisted/replay yang sah diperlukan untuk evidence causal.",
    source: "docs/BUKU_BESAR_IUVFES_DIGITAL_TWIN.md; docs/PROCESS_SIMULATOR_DATA_FLOW.md",
  },
  {
    id: "material-analysis", title: "Material Analysis", availability: "PARTIAL",
    what: "Pencatatan konteks material yang tersedia pada experiment intake.",
    why: "Mencegah dua sample dianggap ekuivalen hanya karena memiliki nama material yang sama.",
    input: "Material, origin, batch, harvest date, particle size, pre-treatment, mass, water content, dan oil content bila disediakan operator.",
    process: "ScientificExperimentIntake menyimpan field sebagai USER INPUT atau UNKNOWN.",
    output: "Scientific metadata experiment tanpa imputasi field kosong.",
    limitation: "Variety, plant part, storage, solvent, altitude, dan sejarah budidaya tidak dikonfirmasi oleh intake saat ini.",
    evidenceRequirement: "Perbandingan material memerlukan identity/context yang benar-benar tercatat.",
    source: "client/src/components/ScientificExperimentIntake.tsx",
  },
  {
    id: "evidence-assessment", title: "Evidence Assessment", availability: "PARTIAL",
    what: "Pembentukan replay/evidence dari CausalFrame dan provenance yang tersedia.",
    why: "Membuat hasil simulasi dapat diaudit dan dibedakan dari laboratory proof.",
    input: "CausalFrame persisted atau frame range yang sah.",
    process: "Replay/evidence dan recorder menghubungkan frame ke manifest/provenance.",
    output: "Simulation-derived evidence package atau dataset manifest.",
    limitation: "Evidence simulasi tidak otomatis validasi laboratorium.",
    evidenceRequirement: "Dataset laboratorium terpisah diperlukan untuk status VALIDATED.",
    source: "docs/BUKU_BESAR_IUVFES_DIGITAL_TWIN.md; client/src/components/ScientificRunRecorder.tsx",
  },
  {
    id: "provenance", title: "Provenance", availability: "AVAILABLE",
    what: "Label asal nilai dan dataset, termasuk SIMULATION, DERIVED, MEASURED, ASSUMED, DATASHEET_REQUIRED, UNKNOWN, dan VALIDATED.",
    why: "Pengguna perlu mengetahui apakah nilai adalah model output, input, observasi, atau informasi yang belum tersedia.",
    input: "Metadata experiment, CausalFrame, recorder, dan manifest yang tersedia.",
    process: "UI menampilkan source/boundary tanpa mengubah asal data.",
    output: "Konteks sumber dan batas interpretasi.",
    limitation: "Provenance bukan pengganti evidence atau proof laboratorium.",
    evidenceRequirement: "MEASURED/VALIDATED memerlukan evidence laboratorium yang sesuai.",
    source: "docs/PROCESS_SIMULATOR_DATA_FLOW.md",
  },
  {
    id: "uncertainty", title: "Uncertainty", availability: "NOT AVAILABLE",
    what: "Kuantifikasi uncertainty/confidence untuk hasil tertentu.",
    why: "Uncertainty perlu dijelaskan bila contract dan evidence mendukung.",
    input: "NOT AVAILABLE pada contract P14 saat ini.",
    process: "Tidak dihitung atau ditampilkan sebagai angka oleh Knowledge Center.",
    output: "NOT AVAILABLE.",
    limitation: "P14 tidak mengarang confidence interval atau skor keyakinan.",
    evidenceRequirement: "Metode uncertainty dan evidence yang terdokumentasi diperlukan.",
    source: "P14 source audit",
  },
  {
    id: "hypothesis", title: "Hypothesis", availability: "PARTIAL",
    what: "Hipotesis yang diisi peneliti pada experiment intake atau recorder.",
    why: "Memisahkan pertanyaan yang akan diuji dari hasil yang sudah didukung evidence.",
    input: "Field hypothesis operator/researcher bila diisi.",
    process: "Disimpan sebagai metadata; tidak diubah menjadi fact oleh engine atau UI.",
    output: "Hypothesis statement atau UNKNOWN bila tidak disediakan.",
    limitation: "Hipotesis bukan RESULT A dan tidak terbukti oleh simulasi saja.",
    evidenceRequirement: "Evidence/laboratory comparison yang sesuai diperlukan untuk evaluasi hipotesis.",
    source: "client/src/components/ScientificExperimentIntake.tsx; client/src/components/ScientificRunRecorder.tsx",
  },
  {
    id: "ai-analysis", title: "AI Analysis", availability: "NOT AVAILABLE",
    what: "Interpretasi pola, conflict, knowledge gap, atau rekomendasi eksperimen berbasis AI.",
    why: "AI dapat membantu mengarahkan pertanyaan berikutnya, bukan menggantikan evidence.",
    input: "NOT AVAILABLE sebagai user-facing P14 runtime contract saat ini.",
    process: "Tidak ada hasil AI yang ditampilkan atau disintesis oleh P14.",
    output: "NOT AVAILABLE.",
    limitation: "AI analysis tidak dapat menjadi experimental proof.",
    evidenceRequirement: "Setiap klaim laboratorium tetap memerlukan evidence laboratorium yang sesuai.",
    source: "P14 source audit",
  },
  {
    id: "laboratory-comparison", title: "Laboratory Comparison", availability: "FUTURE CAPABILITY",
    what: "Perbandingan dataset laboratory MEASURED dengan hasil simulation-derived.",
    why: "Mendukung calibration dan validation tanpa mencampur identity dataset.",
    input: "Dataset laboratorium yang ditautkan dengan provenance yang sesuai.",
    process: "NOT AVAILABLE pada workflow P14 saat ini.",
    output: "NOT AVAILABLE.",
    limitation: "P14 tidak mengunggah atau membuat dataset laboratory.",
    evidenceRequirement: "Dataset MEASURED terpisah dan comparison contract diperlukan.",
    source: "docs/BUKU_BESAR_IUVFES_DIGITAL_TWIN.md; ScientificExperimentIntake laboratory boundary",
  },
  {
    id: "knowledge-gap", title: "Knowledge Gap", availability: "PARTIAL",
    what: "Penandaan informasi yang belum tersedia sebagai UNKNOWN, DATA GAP, NOT AVAILABLE, atau DATASHEET_REQUIRED.",
    why: "Menjaga keputusan berikutnya tidak dibangun di atas data yang diimputasi.",
    input: "Field/contract yang tidak tersedia.",
    process: "Knowledge Center menjelaskan keterbatasan secara eksplisit.",
    output: "Boundary/availability label, bukan rekomendasi eksperimen baru.",
    limitation: "Tidak ada AI-generated recommendation atau automatic model update pada P14.",
    evidenceRequirement: "Evidence baru diperlukan untuk menutup knowledge gap.",
    source: "docs/BUKU_BESAR_IUVFES_DIGITAL_TWIN.md; P14 source audit",
  },
  {
    id: "model-updating", title: "Model Updating", availability: "FUTURE CAPABILITY",
    what: "Pembaharuan model berdasarkan comparison/calibration yang tervalidasi.",
    why: "Digital Twin hanya dapat dikalibrasi setelah data laboratorium yang relevan tersedia.",
    input: "Laboratory observation dan calibration evidence.",
    process: "Tidak diimplementasikan oleh Knowledge Center.",
    output: "NOT AVAILABLE.",
    limitation: "P14 tidak mengubah physics atau engine parameter.",
    evidenceRequirement: "Calibration protocol dan laboratory evidence diperlukan.",
    source: "docs/BUKU_BESAR_IUVFES_DIGITAL_TWIN.md",
  },
];

export const glossary = [
  ["CausalFrame", "Representasi authoritative satu langkah state proses dan hubungan kausalnya."],
  ["Actuator Level", "Intensitas kontinu actuator untuk visual; bukan temperature, energy, atau measurement laboratory."],
  ["Effective Command", "Command setelah batas safety/hardware diterapkan; berbeda dari intended command."],
  ["Evidence", "Paket/rekaman yang dapat ditelusuri; bukan otomatis proof laboratory."],
  ["Provenance", "Informasi asal, klasifikasi, dan batas interpretasi sebuah nilai."],
  ["Derived", "Nilai yang dihasilkan perhitungan atau model."],
  ["Observed", "Nilai dari observasi/instrumen bila evidence yang sesuai menyatakannya."],
  ["Simulation", "Nilai dari model closed-loop, bukan observasi laboratorium."],
  ["Laboratory", "Data observasi nyata yang harus tetap terpisah dari simulation."],
  ["Hypothesis", "Pernyataan yang memerlukan pengujian; bukan fakta."],
  ["Uncertainty", "Batas ketidakpastian; NOT AVAILABLE bila tidak ada contract/evidence."],
  ["Confidence", "Tingkat keyakinan yang hanya boleh ditampilkan bila tersedia."],
  ["Knowledge Gap", "Informasi/evidence yang belum tersedia."],
  ["Material Context", "Identity dan kondisi sample yang memengaruhi interpretasi."],
  ["Replay", "Pembacaan frame tersimpan; bukan simulasi UI baru."],
  ["Session", "Lifecycle closed-loop yang terkait dengan experiment."],
  ["Experiment", "Identitas dan input prosedural yang mendasari satu run."],
] as const;

export const faq = [
  ["Why is this value UNKNOWN?", "Karena field atau evidence yang diperlukan tidak tersedia. IUVFES tidak mengimputasi nilai kosong sebagai fakta."],
  ["Where did this value come from?", "Periksa source/provenance label. Nilai Control Room yang ditandai CAUSAL FRAME berasal dari frame engine yang aktif."],
  ["Is this laboratory data?", "Tidak, kecuali nilai tersebut secara eksplisit ditautkan sebagai MEASURED dari dataset laboratory terpisah."],
  ["Why can AI not validate a simulation?", "AI analysis bukan experimental proof. Validasi memerlukan perbandingan terhadap evidence laboratory yang sesuai."],
  ["What does simulation-derived mean?", "Nilai dihasilkan oleh ClosedLoopSimulationEngine atau perhitungan turunannya, bukan pengukuran fisik langsung."],
  ["Why are two samples with the same material name not automatically equivalent?", "Batch, origin, harvest, particle size, pre-treatment, dan kondisi sample dapat berbeda; konteks yang tidak tersedia tetap UNKNOWN."],
] as const;

export const experimentGuide = [
  ["Select Material", "AVAILABLE", "Pilih material yang tersedia pada experiment intake."],
  ["Verify Material Context", "PARTIAL", "Tinjau field intake yang tersedia; field yang tidak dicapture tetap NOT AVAILABLE/UNKNOWN."],
  ["Create / Select Experiment", "AVAILABLE", "Tersedia untuk operator terautentikasi; P14 tidak membuat experiment."],
  ["Configure Process", "AVAILABLE", "Baseline ditetapkan di intake dan target/limit di Control Room."],
  ["Run Simulation", "AVAILABLE", "Memerlukan operator auth dan closed-loop session yang sah."],
  ["Inspect CausalFrame", "AVAILABLE", "Control Room/inspector membaca frame engine yang tersedia."],
  ["Review Evidence", "PARTIAL", "Evidence/replay tersedia ketika persisted frame dan contract yang sesuai ada."],
  ["Compare Laboratory Result", "FUTURE CAPABILITY", "P14 tidak melakukan ingestion atau comparison laboratory."],
  ["Review AI Analysis", "NOT AVAILABLE", "Tidak ada user-facing AI-analysis contract yang dikonfirmasi oleh audit P14."],
  ["Identify Knowledge Gap", "PARTIAL", "Gunakan UNKNOWN, DATA GAP, NOT AVAILABLE, atau DATASHEET_REQUIRED sebagai boundary."],
  ["Select Next Experiment", "FUTURE CAPABILITY", "P14 tidak membuat rekomendasi atau experiment baru."],
] as const;

export interface WhyThisValue {
  label: string;
  source: string;
  field: string;
  classification: string;
  meaning: string;
  notMeaning: string;
}

export const whyThisValues: WhyThisValue[] = [
  { label: "Heater visual", source: "CausalFrame", field: "actuatorLevels.heater", classification: "SIMULATION", meaning: "Continuous actuator intensity for the 3D visual.", notMeaning: "Temperature, energy, operator target, or laboratory measurement." },
  { label: "Temperature instrument", source: "CausalFrame", field: "sensorAfter.temperatureC", classification: "SIMULATION", meaning: "Actual active-frame temperature value displayed by the Control Room.", notMeaning: "A laboratory measurement unless a separate MEASURED dataset says so." },
  { label: "Effective command", source: "CausalFrame", field: "effectiveCommands.*", classification: "SIMULATION", meaning: "Command after safety and hardware limits are applied.", notMeaning: "The same thing as intended command or physical response." },
  { label: "Simulation time", source: "CausalFrame", field: "timestampSeconds", classification: "SIMULATION", meaning: "Simulation time supplied by the frame.", notMeaning: "Browser clock time or laboratory elapsed time." },
];

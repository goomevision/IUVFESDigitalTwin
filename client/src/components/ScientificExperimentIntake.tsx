import { useMemo, useState } from "react";
import { CheckCircle2, Database, FlaskConical, Info, UserRound, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface ScientificExperimentIntakeProps {
  onComplete?: (experimentId: string) => void;
  onCancel?: () => void;
}

type FieldStatus = "USER_INPUT" | "UNKNOWN";

export function ScientificExperimentIntake({ onComplete, onCancel }: ScientificExperimentIntakeProps) {
  const { user } = useAuth();
  const { data: materials = [] } = trpc.materials.list.useQuery();
  const createExperiment = trpc.experiments.create.useMutation();

  const [experimentName, setExperimentName] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [materialWeight, setMaterialWeight] = useState(10);
  const [waterContent, setWaterContent] = useState(50);
  const [oilContent, setOilContent] = useState(3);
  const [materialOrigin, setMaterialOrigin] = useState("");
  const [batchId, setBatchId] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [particleSize, setParticleSize] = useState("");
  const [preTreatment, setPreTreatment] = useState("");
  const [researcher, setResearcher] = useState(user?.name ?? "");
  const [institution, setInstitution] = useState("");
  const [laboratory, setLaboratory] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [objective, setObjective] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [hardwareProfileId, setHardwareProfileId] = useState("");
  const [targetPressure, setTargetPressure] = useState(100);
  const [targetTemperature, setTargetTemperature] = useState(60);
  const [duration, setDuration] = useState(2);
  const [ultrasonicFrequency, setUltrasonicFrequency] = useState(40);
  const [ultrasonicPower, setUltrasonicPower] = useState(0);
  const [ultrasonicDuty, setUltrasonicDuty] = useState(100);
  const [notes, setNotes] = useState("");

  const selectedMaterialData = useMemo(() => materials.find(m => m.id === selectedMaterial), [materials, selectedMaterial]);

  const requiredReady = selectedMaterial !== null && experimentName.trim().length > 0 && materialWeight > 0 && waterContent >= 0 && oilContent >= 0 && waterContent + oilContent <= 100 && targetPressure >= 1 && targetTemperature >= 20 && duration >= 0.5;

  const status = (value: string | number | null | undefined): FieldStatus => {
    if (value === null || value === undefined || value === "") return "UNKNOWN";
    return "USER_INPUT";
  };

  const save = async () => {
    if (!requiredReady) {
      toast.error("Lengkapi data minimum yang diperlukan engine sebelum membuat eksperimen.");
      return;
    }
    try {
      const inputParameters = {
        materialWeight,
        waterContent,
        oilContent,
        targetPressure,
        targetTemperature,
        ultrasonicFrequency,
        ultrasonicPower,
        ultrasonicDuty,
        duration,
        processModel: "hybrid",
        materialWaterRatio: "UNKNOWN",
        scientificMetadata: {
          schemaVersion: "experiment-intake-v1",
          experiment: {
            title: experimentName,
            objective: objective || null,
            hypothesis: hypothesis || null,
          },
          researcher: {
            researcher: researcher || null,
            operator: user?.name || null,
            institution: institution || null,
            laboratory: laboratory || null,
            supervisor: supervisor || null,
          },
          material: {
            materialId: selectedMaterial,
            name: selectedMaterialData?.name ?? null,
            origin: materialOrigin || null,
            batchId: batchId || null,
            harvestDate: harvestDate || null,
            particleSize: particleSize || null,
            preTreatment: preTreatment || null,
            dataStatus: {
              origin: status(materialOrigin),
              batchId: status(batchId),
              harvestDate: status(harvestDate),
              particleSize: status(particleSize),
              preTreatment: status(preTreatment),
            },
          },
          hardware: {
            hardwareProfileId: hardwareProfileId || null,
            source: hardwareProfileId ? "HARDWARE_PROFILE" : "UNKNOWN",
          },
          laboratory: {
            datasetLinked: false,
            sourceType: "LABORATORY",
            status: "NOT_PROVIDED",
          },
          provenance: {
            simulationSource: "ClosedLoopSimulationEngine",
            laboratoryDataIsSeparate: true,
            unknownFieldsAreNotImputed: true,
          },
          notes: notes || null,
        },
      };

      const result = await createExperiment.mutateAsync({
        materialId: selectedMaterial!,
        experimentName,
        inputParameters,
      });
      toast.success("Scientific experiment draft tersimpan.");
      onComplete?.(result.experimentId);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan eksperimen.");
    }
  };

  const Status = ({ value }: { value: string | number | null | undefined }) => {
    const unknown = status(value) === "UNKNOWN";
    return <span className={`ml-2 text-[10px] font-mono ${unknown ? "text-slate-500" : "text-emerald-400"}`}>{unknown ? "UNKNOWN" : "USER INPUT"}</span>;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#10263a_0%,#050912_48%,#02040a_100%)] p-4 text-slate-100 md:p-6">
      <div className="mx-auto max-w-[1550px] space-y-4">
        <header className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div><div className="flex items-center gap-2 text-xs font-mono tracking-[0.25em] text-cyan-400"><FlaskConical className="h-4 w-4" /> IUVFES // SCIENTIFIC DATA ENTRY</div><h1 className="mt-2 text-2xl font-bold md:text-3xl">EXPERIMENT INTAKE</h1><p className="text-sm text-slate-400">Satu layar untuk metadata eksperimen. Hardware dan Control Room tetap menjadi sumber konfigurasi masing-masing.</p></div>
            <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 px-4 py-3 text-xs"><div className="text-slate-500">DATA RULE</div><div className="mt-1 text-cyan-300">Unknown boleh kosong • tidak diimputasi AI</div></div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[1fr_1.25fr_1fr_280px]">
          <section className="space-y-4">
            <Panel icon={<UserRound />} title="A. IDENTITAS & PENELITI">
              <Field label="Judul eksperimen" required><Input value={experimentName} onChange={e => setExperimentName(e.target.value)} placeholder="Contoh: Pengaruh ultrasonic 30 kHz terhadap ekstraksi nilam" /><Status value={experimentName} /></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="Peneliti"><Input value={researcher} onChange={e => setResearcher(e.target.value)} /><Status value={researcher} /></Field><Field label="Institusi"><Input value={institution} onChange={e => setInstitution(e.target.value)} /><Status value={institution} /></Field></div>
              <div className="grid grid-cols-2 gap-3"><Field label="Laboratorium"><Input value={laboratory} onChange={e => setLaboratory(e.target.value)} /><Status value={laboratory} /></Field><Field label="Supervisor"><Input value={supervisor} onChange={e => setSupervisor(e.target.value)} /><Status value={supervisor} /></Field></div>
              <Field label="Tujuan eksperimen"><textarea value={objective} onChange={e => setObjective(e.target.value)} className="min-h-20 w-full rounded-md border border-slate-700 bg-slate-950/60 p-3 text-sm outline-none focus:border-cyan-500" /><Status value={objective} /></Field>
              <Field label="Hipotesis"><textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} className="min-h-16 w-full rounded-md border border-slate-700 bg-slate-950/60 p-3 text-sm outline-none focus:border-cyan-500" /><Status value={hypothesis} /></Field>
            </Panel>

            <Panel icon={<Database />} title="B. BAHAN / BATCH">
              <Field label="Jenis bahan" required><Select value={selectedMaterial?.toString() ?? ""} onValueChange={v => setSelectedMaterial(Number(v))}><SelectTrigger><SelectValue placeholder="Pilih material yang tersedia" /></SelectTrigger><SelectContent>{materials.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent></Select><Status value={selectedMaterial} /></Field>
              <div className="grid grid-cols-2 gap-3"><NumberField label="Massa awal" value={materialWeight} setValue={setMaterialWeight} unit="kg" required /><NumberField label="Kadar air" value={waterContent} setValue={setWaterContent} unit="%" required /></div>
              <div className="grid grid-cols-2 gap-3"><NumberField label="Kadar minyak" value={oilContent} setValue={setOilContent} unit="%" required /><Field label="Batch / kode lot"><Input value={batchId} onChange={e => setBatchId(e.target.value)} /><Status value={batchId} /></Field></div>
              <div className="grid grid-cols-2 gap-3"><Field label="Asal / origin"><Input value={materialOrigin} onChange={e => setMaterialOrigin(e.target.value)} /><Status value={materialOrigin} /></Field><Field label="Tanggal panen"><Input type="date" value={harvestDate} onChange={e => setHarvestDate(e.target.value)} /><Status value={harvestDate} /></Field></div>
              <div className="grid grid-cols-2 gap-3"><Field label="Ukuran partikel"><Input value={particleSize} onChange={e => setParticleSize(e.target.value)} placeholder="mis. 5–10 mm" /><Status value={particleSize} /></Field><Field label="Perlakuan awal"><Input value={preTreatment} onChange={e => setPreTreatment(e.target.value)} /><Status value={preTreatment} /></Field></div>
            </Panel>
          </section>

          <section className="space-y-4">
            <Panel icon={<Wrench />} title="C. HARDWARE PROFILE — TIDAK DIULANG">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-slate-400"><Info className="mr-2 inline h-4 w-4 text-cyan-400" />Pilih ID dari layar Hardware. Detail diameter, panjang, material, pump, cold trap, sensor, dan ultrasonic tetap berasal dari Hardware Configuration.</div>
              <Field label="Hardware Profile ID"><Input value={hardwareProfileId} onChange={e => setHardwareProfileId(e.target.value)} placeholder="mis. HW-VMMES-2026-007" /><Status value={hardwareProfileId} /></Field>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono"><Chip label="REACTOR" /><Chip label="HEATER" /><Chip label="VACUUM" /><Chip label="COLD TRAP" /><Chip label="ULTRASONIC" /><Chip label="SENSORS" /></div>
            </Panel>

            <Panel icon={<GaugeIcon />} title="D. PARAMETER AWAL OPERASI">
              <div className="grid grid-cols-2 gap-3"><NumberField label="Target suhu" value={targetTemperature} setValue={setTargetTemperature} unit="°C" required /><NumberField label="Target tekanan" value={targetPressure} setValue={setTargetPressure} unit="mbar" required /></div>
              <div className="grid grid-cols-2 gap-3"><NumberField label="Durasi" value={duration} setValue={setDuration} unit="jam" required /><Field label="Mode"><Input value="hybrid" readOnly className="text-slate-400" /></Field></div>
              <p className="text-[11px] text-slate-500">Parameter operasi yang berubah selama proses tetap dikendalikan di Control Room. Di sini hanya baseline/target eksperimen.</p>
            </Panel>

            <Panel icon={<FlaskConical />} title="E. ULTRASONIC — DATA EKSPERIMEN">
              <div className="grid grid-cols-3 gap-3"><NumberField label="Frequency" value={ultrasonicFrequency} setValue={setUltrasonicFrequency} unit="kHz" /><NumberField label="Power" value={ultrasonicPower} setValue={setUltrasonicPower} unit="W" /><NumberField label="Duty" value={ultrasonicDuty} setValue={setUltrasonicDuty} unit="%" /></div>
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-200">STATUS: EXPERIMENTAL. Nilai ultrasonic di sini adalah input eksperimen; data laboratorium nyata tetap masuk sebagai dataset MEASURED terpisah.</div>
            </Panel>
          </section>

          <section className="space-y-4">
            <Panel icon={<Database />} title="F. LABORATORIUM — TIDAK MENIMPA SIMULASI">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-slate-300"><div className="font-semibold text-emerald-300">DATASET LABORATORIUM</div><p className="mt-2 text-xs text-slate-500">Belum dihubungkan pada tahap intake. Setelah eksperimen, hasil nyata dapat dilampirkan sebagai MEASURED tanpa mengubah MODELLED causal frames.</p><div className="mt-3 grid grid-cols-2 gap-2"><Chip label="MEASURED" /><Chip label="IMMUTABLE" /></div></div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-500">GC-MS, kadar air, massa receiver, energi, komposisi, dan hasil analisis lain dapat ditambahkan pada sesi Laboratory Data.</div>
            </Panel>

            <Panel icon={<Info />} title="G. CATATAN & OBSERVASI AWAL"><Field label="Catatan"><textarea value={notes} onChange={e => setNotes(e.target.value)} className="min-h-32 w-full rounded-md border border-slate-700 bg-slate-950/60 p-3 text-sm outline-none focus:border-cyan-500" placeholder="Catatan operator. Kosong = UNKNOWN." /><Status value={notes} /></Field></Panel>

            <Panel icon={<CheckCircle2 />} title="H. PROVENANCE"><div className="space-y-2 text-xs font-mono"><Row label="Simulation source" value="ClosedLoopSimulationEngine" /><Row label="Lab data" value="SEPARATE / MEASURED" /><Row label="Unknown fields" value="NOT IMPUTED" /><Row label="Experiment ID" value="AUTO AFTER SAVE" /></div></Panel>
          </section>

          <aside className="space-y-4"><Panel title="DATA COMPLETENESS"><div className="text-center"><div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-8 border-cyan-400/30 text-3xl font-bold text-cyan-300">{requiredReady ? "✓" : "…"}</div><div className="mt-3 text-xs text-slate-500">Minimum engine input {requiredReady ? "READY" : "BELUM LENGKAP"}</div></div></Panel><Panel title="DATA STATUS"><Row label="USER INPUT" value="operator" /><Row label="UNKNOWN" value="allowed" /><Row label="LABORATORY" value="separate" /><Row label="MODELLED" value="after simulation" /></Panel><Panel title="ALUR KABEL"><div className="space-y-2 text-xs font-mono text-slate-400"><Row label="Intake" value="→ Experiment" /><Row label="Hardware ID" value="→ Session" /><Row label="Targets" value="→ Control Room" /><Row label="Ultrasonic" value="→ Experimental model" /><Row label="Causal frames" value="→ Recorder" /><Row label="Lab data" value="→ MEASURED" /></div></Panel></aside>
        </div>

        <footer className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:flex-row md:items-center md:justify-between"><div className="text-xs text-slate-500">Data kosong tetap UNKNOWN. Jangan mengisi nilai perkiraan sebagai MEASURED.</div><div className="flex gap-2"><Button variant="outline" onClick={onCancel} className="border-slate-700">BATAL</Button><Button onClick={save} disabled={createExperiment.isPending || !requiredReady} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">{createExperiment.isPending ? "MENYIMPAN…" : "SIMPAN & LANJUTKAN →"}</Button></div></footer>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-2xl border border-cyan-500/15 bg-slate-950/65 p-4"><h2 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-cyan-300">{icon}<span>{title}</span></h2><div className="space-y-3">{children}</div></section>; }
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <div><Label className="mb-1 block text-xs text-slate-400">{label}{required ? <span className="text-red-400"> *</span> : null}</Label>{children}</div>; }
function NumberField({ label, value, setValue, unit, required }: { label: string; value: number; setValue: (value: number) => void; unit: string; required?: boolean }) { return <Field label={label} required={required}><div className="flex items-center gap-2"><Input type="number" value={Number.isFinite(value) ? value : ""} onChange={e => setValue(Number(e.target.value))} /><span className="min-w-12 text-xs text-slate-500">{unit}</span></div></Field>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-2"><span className="text-slate-500">{label}</span><span className="text-cyan-300">{value}</span></div>; }
function Chip({ label }: { label: string }) { return <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-emerald-300">✓ {label}</div>; }
function GaugeIcon() { return <span className="inline-block h-4 w-4 rounded-full border border-cyan-400" />; }

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, ChevronRight, Droplet, Gauge, ShieldCheck, Weight, X, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SetupWizardProps {
  onComplete?: (experimentId: string) => void;
  onCancel?: () => void;
}

interface ValidationErrors {
  material?: string;
  materialWeight?: string;
  waterContent?: string;
  oilContent?: string;
  targetPressure?: string;
  targetTemperature?: string;
  ultrasonicFrequency?: string;
  duration?: string;
  experimentName?: string;
}

const STEP_COUNT = 3;
const STEPS = [
  { number: 1, title: "Material", subtitle: "Input material" },
  { number: 2, title: "Process", subtitle: "Operating conditions" },
  { number: 3, title: "Review", subtitle: "Confirm experiment" },
];

function FieldError({ children }: { children?: string }) {
  return children ? <p className="mt-1.5 text-xs text-red-300">{children}</p> : null;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-2.5 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-right font-mono text-sm text-slate-100">{value}</span>
    </div>
  );
}

export function SetupWizard({ onComplete, onCancel }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [materialWeight, setMaterialWeight] = useState(10);
  const [waterContent, setWaterContent] = useState(50);
  const [oilContent, setOilContent] = useState(3);

  const [targetPressure, setTargetPressure] = useState(100);
  const [targetTemperature, setTargetTemperature] = useState(60);
  const [ultrasonicFrequency, setUltrasonicFrequency] = useState(40);
  const [duration, setDuration] = useState(2);
  const [materialWaterRatio, setMaterialWaterRatio] = useState("1:1");
  const [processModel, setProcessModel] = useState("hybrid");
  const [experimentName, setExperimentName] = useState("");

  const { data: materials = [] } = trpc.materials.list.useQuery();
  const createExperiment = trpc.experiments.create.useMutation();

  const selectedMaterialData = useMemo(
    () => materials.find(material => material.id === selectedMaterial),
    [materials, selectedMaterial],
  );

  const validateStep1 = () => {
    const nextErrors: ValidationErrors = {};
    if (!selectedMaterial) nextErrors.material = "Select a material before continuing.";
    if (materialWeight <= 0 || materialWeight > 1000) nextErrors.materialWeight = "Weight must be between 0.1 and 1000 kg.";
    if (waterContent < 0 || waterContent > 100) nextErrors.waterContent = "Water content must be between 0 and 100%.";
    if (oilContent < 0 || oilContent > 100) nextErrors.oilContent = "Oil content must be between 0 and 100%.";
    if (waterContent + oilContent > 100) nextErrors.waterContent = "Water + oil content cannot exceed 100%.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors: ValidationErrors = {};
    if (!experimentName.trim()) nextErrors.experimentName = "Experiment name is required.";
    if (targetPressure < 1 || targetPressure > 1000) nextErrors.targetPressure = "Pressure must be between 1 and 1000 mbar.";
    if (targetTemperature < 20 || targetTemperature > 150) nextErrors.targetTemperature = "Temperature must be between 20 and 150°C.";
    if (ultrasonicFrequency < 20 || ultrasonicFrequency > 100) nextErrors.ultrasonicFrequency = "Frequency must be between 20 and 100 kHz.";
    if (duration < 0.5 || duration > 24) nextErrors.duration = "Duration must be between 0.5 and 24 hours.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleMaterialSelect = (materialId: number) => {
    setSelectedMaterial(materialId);
    const material = materials.find(item => item.id === materialId);
    if (material) {
      setWaterContent(Number(material.defaultWaterContent) || 50);
      setOilContent(Number(material.defaultOilContent) || 3);
    }
  };

  const handleNext = () => {
    const valid = step === 1 ? validateStep1() : validateStep2();
    if (!valid) {
      toast.error("Please correct the highlighted fields.");
      return;
    }
    setErrors({});
    setStep(current => Math.min(STEP_COUNT, current + 1));
  };

  const handlePrevious = () => {
    setErrors({});
    setStep(current => Math.max(1, current - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      toast.error("Please complete all required fields.");
      return;
    }
    setLoading(true);
    try {
      const result = await createExperiment.mutateAsync({
        materialId: selectedMaterial!,
        experimentName: experimentName.trim(),
        inputParameters: {
          materialWeight,
          waterContent,
          oilContent,
          targetPressure,
          targetTemperature,
          ultrasonicFrequency,
          duration,
          materialWaterRatio,
          processModel,
        },
      });
      toast.success("Experiment created successfully");
      onComplete?.(result.experimentId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create experiment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030711] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px]">
        <header className="mb-6 rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-cyan-950/10 backdrop-blur-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.3em] text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.8)]" /> IUVFES DIGITAL TWIN
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Experiment Setup</h1>
              <p className="mt-1 text-sm text-slate-400">Configure the process inputs before opening the closed-loop simulation.</p>
            </div>
            <Button onClick={onCancel} variant="ghost" className="self-start text-slate-400 hover:bg-white/5 hover:text-white md:self-center" aria-label="Cancel setup">
              <X className="mr-2 h-4 w-4" /> Exit setup
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {STEPS.map(item => {
              const active = item.number === step;
              const complete = item.number < step;
              return (
                <div key={item.number} className={`relative rounded-xl border px-3 py-3 transition-all ${active ? "border-cyan-400/50 bg-cyan-400/10" : complete ? "border-emerald-400/20 bg-emerald-400/5" : "border-white/5 bg-white/[0.02]"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-cyan-400 text-slate-950" : complete ? "bg-emerald-400/20 text-emerald-300" : "bg-slate-800 text-slate-500"}`}>
                      {complete ? <CheckCircle2 className="h-4 w-4" /> : item.number}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold tracking-wide text-white">{item.title}</div>
                      <div className="truncate text-[10px] text-slate-500">{item.subtitle}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </header>

        <main className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl sm:p-6 lg:p-8">
          {step === 1 && (
            <section>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div><p className="font-mono text-[10px] tracking-[0.25em] text-cyan-400">01 / MATERIAL INPUT</p><h2 className="mt-1 text-xl font-semibold text-white">Material selection</h2></div>
                <span className="hidden text-xs text-slate-500 md:block">All values remain editable until confirmation.</span>
              </div>
              <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr_.85fr]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="mb-4 flex items-center justify-between"><span className="text-[10px] font-semibold tracking-[0.2em] text-slate-500">MATERIAL PREVIEW</span><Droplet className="h-4 w-4 text-cyan-400" /></div>
                  <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-900/60 p-6 text-center">
                    <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/5 text-5xl shadow-[0_0_50px_rgba(34,211,238,.08)]">🌿</div>
                    {selectedMaterialData ? <><h3 className="text-lg font-semibold text-white">{selectedMaterialData.name}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{selectedMaterialData.description || "Botanical material"}</p></> : <p className="text-sm text-slate-500">Select a material to load its properties.</p>}
                  </div>
                  {selectedMaterialData && <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-slate-900/80 p-3"><div className="text-[9px] text-slate-500">MOISTURE</div><div className="mt-1 font-mono text-sm text-cyan-300">{selectedMaterialData.defaultWaterContent}%</div></div><div className="rounded-xl bg-slate-900/80 p-3"><div className="text-[9px] text-slate-500">OIL</div><div className="mt-1 font-mono text-sm text-amber-300">{selectedMaterialData.defaultOilContent}%</div></div><div className="rounded-xl bg-slate-900/80 p-3"><div className="text-[9px] text-slate-500">DENSITY</div><div className="mt-1 font-mono text-sm text-slate-200">{selectedMaterialData.density || "0.92"}</div></div></div>}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="mb-5 flex items-center gap-2"><Weight className="h-4 w-4 text-cyan-400" /><span className="text-xs font-semibold tracking-wider text-white">INPUT CONDITIONS</span></div>
                  <div className="space-y-5">
                    <div><Label className="text-xs text-slate-400">Material</Label><Select value={selectedMaterial?.toString() || ""} onValueChange={value => handleMaterialSelect(Number(value))}><SelectTrigger className="mt-2 h-11 border-white/10 bg-slate-900 text-white"><SelectValue placeholder="Select material" /></SelectTrigger><SelectContent className="border-white/10 bg-slate-900">{materials.map(material => <SelectItem key={material.id} value={material.id.toString()} className="text-white">{material.name}</SelectItem>)}</SelectContent></Select><FieldError>{errors.material}</FieldError></div>
                    <div><Label className="text-xs text-slate-400">Material weight</Label><div className="mt-2 flex h-11 items-center gap-3 rounded-lg border border-white/10 bg-slate-900 px-3"><Weight className="h-4 w-4 text-cyan-400" /><Input type="number" min="0.1" max="1000" value={materialWeight} onChange={event => setMaterialWeight(Number(event.target.value))} className="h-9 border-0 bg-transparent p-0 font-mono text-white focus-visible:ring-0" /><span className="text-xs text-slate-500">kg</span></div><FieldError>{errors.materialWeight}</FieldError></div>
                    <div><Label className="text-xs text-slate-400">Initial water content</Label><div className="mt-2 flex h-11 items-center gap-3 rounded-lg border border-white/10 bg-slate-900 px-3"><Droplet className="h-4 w-4 text-blue-400" /><Input type="number" min="0" max="100" value={waterContent} onChange={event => setWaterContent(Number(event.target.value))} className="h-9 border-0 bg-transparent p-0 font-mono text-white focus-visible:ring-0" /><span className="text-xs text-slate-500">%</span></div><FieldError>{errors.waterContent}</FieldError></div>
                    <div><Label className="text-xs text-slate-400">Initial oil content</Label><div className="mt-2 flex h-11 items-center gap-3 rounded-lg border border-white/10 bg-slate-900 px-3"><Droplet className="h-4 w-4 text-amber-400" /><Input type="number" min="0" max="100" value={oilContent} onChange={event => setOilContent(Number(event.target.value))} className="h-9 border-0 bg-transparent p-0 font-mono text-white focus-visible:ring-0" /><span className="text-xs text-slate-500">%</span></div><FieldError>{errors.oilContent}</FieldError></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.025] p-5">
                  <div className="mb-5 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /><span className="text-xs font-semibold tracking-wider text-white">ENGINE HANDSHAKE</span></div>
                  <div className="space-y-2">{[["Controller", "READY"], ["Vacuum pump", "STANDBY"], ["Heater", "STANDBY"], ["Extractor", "STANDBY"], ["Condenser", "STANDBY"], ["Cooling", "STANDBY"]].map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-lg bg-slate-900/70 px-3 py-2.5"><span className="text-xs text-slate-500">{label}</span><span className="font-mono text-[10px] text-slate-300">{value}</span></div>)}</div>
                  <div className="mt-4 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-3"><div className="flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Setup ready</div><p className="mt-1 text-[10px] leading-4 text-slate-500">Live telemetry appears only after a closed-loop session is started.</p></div>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <div className="mb-6"><p className="font-mono text-[10px] tracking-[0.25em] text-cyan-400">02 / PROCESS CONTROL</p><h2 className="mt-1 text-xl font-semibold text-white">Operating conditions</h2></div>
              <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="mb-5 flex items-center gap-2"><Gauge className="h-4 w-4 text-cyan-400" /><span className="text-xs font-semibold tracking-wider text-white">LIVE CONFIGURATION PREVIEW</span></div>
                  <div className="space-y-1"><SummaryRow label="Experiment" value={experimentName || "Not named"} /><SummaryRow label="Target pressure" value={`${targetPressure} mbar`} /><SummaryRow label="Target temperature" value={`${targetTemperature} °C`} /><SummaryRow label="Ultrasonic" value={`${ultrasonicFrequency} kHz`} /><SummaryRow label="Duration" value={`${duration} h`} /><SummaryRow label="Material : water" value={materialWaterRatio} /><SummaryRow label="Process model" value={processModel} /></div>
                  <div className="mt-5 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4"><div className="flex items-center gap-2 text-xs text-cyan-300"><Zap className="h-4 w-4" /> Engine contract preserved</div><p className="mt-1 text-[10px] leading-4 text-slate-500">These values are passed unchanged into the experiment inputParameters object.</p></div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="space-y-6">
                    <div><Label className="text-xs text-slate-400">Experiment name</Label><Input value={experimentName} onChange={event => setExperimentName(event.target.value)} placeholder="e.g. Nilam Extraction — Trial 01" className="mt-2 h-11 border-white/10 bg-slate-900 text-white placeholder:text-slate-600" /><FieldError>{errors.experimentName}</FieldError></div>
                    <div><div className="flex justify-between"><Label className="text-xs text-slate-400">Target pressure</Label><span className="font-mono text-xs text-cyan-300">{targetPressure} mbar</span></div><Slider className="mt-4" value={[targetPressure]} onValueChange={value => setTargetPressure(value[0])} min={1} max={1000} step={1} /><FieldError>{errors.targetPressure}</FieldError></div>
                    <div><div className="flex justify-between"><Label className="text-xs text-slate-400">Target temperature</Label><span className="font-mono text-xs text-cyan-300">{targetTemperature} °C</span></div><Slider className="mt-4" value={[targetTemperature]} onValueChange={value => setTargetTemperature(value[0])} min={20} max={150} step={1} /><FieldError>{errors.targetTemperature}</FieldError></div>
                    <div><div className="flex justify-between"><Label className="text-xs text-slate-400">Ultrasonic frequency</Label><span className="font-mono text-xs text-cyan-300">{ultrasonicFrequency} kHz</span></div><Slider className="mt-4" value={[ultrasonicFrequency]} onValueChange={value => setUltrasonicFrequency(value[0])} min={20} max={100} step={1} /><FieldError>{errors.ultrasonicFrequency}</FieldError></div>
                    <div><div className="flex justify-between"><Label className="text-xs text-slate-400">Duration</Label><span className="font-mono text-xs text-cyan-300">{duration} h</span></div><Slider className="mt-4" value={[duration]} onValueChange={value => setDuration(value[0])} min={0.5} max={24} step={0.5} /><FieldError>{errors.duration}</FieldError></div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <div><Label className="text-xs text-slate-400">Material : water ratio</Label><Select value={materialWaterRatio} onValueChange={setMaterialWaterRatio}><SelectTrigger className="mt-2 h-11 border-white/10 bg-slate-900 text-white"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-slate-900"><SelectItem value="1:1" className="text-white">1 : 1</SelectItem><SelectItem value="1:2" className="text-white">1 : 2</SelectItem><SelectItem value="1:3" className="text-white">1 : 3</SelectItem><SelectItem value="2:1" className="text-white">2 : 1</SelectItem></SelectContent></Select></div>
                      <div><Label className="text-xs text-slate-400">Process model</Label><RadioGroup value={processModel} onValueChange={setProcessModel} className="mt-3 grid grid-cols-2 gap-2">{[["vacuum", "Vacuum drying"], ["distillation", "Vacuum distillation"], ["ultrasonic", "Ultrasonic extraction"], ["hybrid", "Hybrid model"]].map(([value, label]) => <Label key={value} htmlFor={value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-slate-900 p-3 text-[11px] text-slate-300 hover:border-cyan-400/30"><RadioGroupItem value={value} id={value} className="border-cyan-500" />{label}</Label>)}</RadioGroup></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <div className="mb-6"><p className="font-mono text-[10px] tracking-[0.25em] text-cyan-400">03 / FINAL REVIEW</p><h2 className="mt-1 text-xl font-semibold text-white">Confirm experiment</h2><p className="mt-1 text-sm text-slate-500">Review the exact values that will be sent to the experiment engine.</p></div>
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="mb-4 text-xs font-semibold tracking-wider text-cyan-300">EXPERIMENT</div><div className="rounded-xl bg-slate-900 p-4"><div className="text-[10px] text-slate-500">NAME</div><div className="mt-1 text-base font-medium text-white">{experimentName}</div></div><div className="mt-3"><SummaryRow label="Material" value={selectedMaterialData?.name || "—"} /><SummaryRow label="Weight" value={`${materialWeight} kg`} /><SummaryRow label="Water" value={`${waterContent}%`} /><SummaryRow label="Oil" value={`${oilContent}%`} /></div></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="mb-4 text-xs font-semibold tracking-wider text-cyan-300">PROCESS PARAMETERS</div><SummaryRow label="Pressure" value={`${targetPressure} mbar`} /><SummaryRow label="Temperature" value={`${targetTemperature} °C`} /><SummaryRow label="Ultrasonic" value={`${ultrasonicFrequency} kHz`} /><SummaryRow label="Duration" value={`${duration} h`} /><SummaryRow label="Ratio" value={materialWaterRatio} /><SummaryRow label="Model" value={processModel} /></div>
                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.025] p-5"><div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-300"><ShieldCheck className="h-4 w-4" /> ENGINE HANDSHAKE</div><div className="space-y-2"><div className="flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-slate-900/70 p-4"><CheckCircle2 className="h-5 w-5 text-emerald-400" /><div><div className="text-sm font-medium text-white">Ready to create</div><div className="text-[10px] text-slate-500">Experiment input contract validated</div></div></div><p className="mt-3 text-[10px] leading-5 text-slate-500">Starting the experiment creates the backend record. The closed-loop simulation session is started by the control-room flow after creation.</p></div></div>
              </div>
            </section>
          )}

          <footer className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button onClick={step === 1 ? onCancel : handlePrevious} variant="outline" className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"><X className="mr-2 h-4 w-4" />{step === 1 ? "Cancel" : "Previous"}</Button>
            {step < STEP_COUNT ? <Button onClick={handleNext} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Continue <ChevronRight className="ml-2 h-4 w-4" /></Button> : <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300 disabled:opacity-50">{loading ? "Creating experiment…" : "Create experiment"}<ChevronRight className="ml-2 h-4 w-4" /></Button>}
          </footer>
        </main>

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-600"><ShieldCheck className="h-3.5 w-3.5" /> UI presentation layer — engine contract unchanged</div>
      </div>
    </div>
  );
}

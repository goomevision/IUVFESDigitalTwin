import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, ChevronRight, Droplet, Gauge, Weight, X } from "lucide-react";
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

  const handleMaterialSelect = (materialId: number) => {
    setSelectedMaterial(materialId);
    const material = materials.find(item => item.id === materialId);
    if (material) {
      setWaterContent(Number(material.defaultWaterContent) || 50);
      setOilContent(Number(material.defaultOilContent) || 3);
    }
  };

  const validateStep1 = (): boolean => {
    const nextErrors: ValidationErrors = {};
    if (!selectedMaterial) nextErrors.material = "Please select a material";
    if (materialWeight <= 0 || materialWeight > 1000) nextErrors.materialWeight = "Weight must be between 0.1 and 1000 kg";
    if (waterContent < 0 || waterContent > 100) nextErrors.waterContent = "Water content must be between 0 and 100%";
    if (oilContent < 0 || oilContent > 100) nextErrors.oilContent = "Oil content must be between 0 and 100%";
    if (waterContent + oilContent > 100) nextErrors.waterContent = "Water + oil content cannot exceed 100%";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const nextErrors: ValidationErrors = {};
    if (!experimentName.trim()) nextErrors.experimentName = "Experiment name is required";
    if (targetPressure < 1 || targetPressure > 1000) nextErrors.targetPressure = "Pressure must be between 1 and 1000 mbar";
    if (targetTemperature < 20 || targetTemperature > 150) nextErrors.targetTemperature = "Temperature must be between 20 and 150°C";
    if (ultrasonicFrequency < 20 || ultrasonicFrequency > 100) nextErrors.ultrasonicFrequency = "Frequency must be between 20 and 100 kHz";
    if (duration < 0.5 || duration > 24) nextErrors.duration = "Duration must be between 0.5 and 24 hours";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    const valid = step === 1 ? validateStep1() : validateStep2();
    if (!valid) {
      toast.error("Please fix the errors before proceeding");
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
      toast.error("Please fill in all required fields correctly");
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

  const SystemOverviewPanel = () => (
    <div className="space-y-4 rounded-lg border border-cyan-500/30 bg-slate-900/40 p-4">
      <div>
        <h3 className="text-sm font-bold tracking-wider text-cyan-400">SYSTEM PRE-FLIGHT</h3>
        <p className="mt-1 text-[11px] text-slate-500">No live engine frame exists until the simulation session starts.</p>
      </div>
      <div className="space-y-3">
        {[
          ["CONTROLLER", "READY"],
          ["VACUUM PUMP", "STANDBY"],
          ["HEATER", "STANDBY"],
          ["EXTRACTOR", "STANDBY"],
          ["CONDENSER", "STANDBY"],
          ["COOLING", "STANDBY"],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{label}</span>
            <span className="font-mono text-slate-300">{value}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-700 pt-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-cyan-400" />
          <span className="text-xs text-slate-300">SETUP READY — ENGINE NOT RUNNING</span>
        </div>
      </div>
    </div>
  );

  const ProgressIndicator = () => (
    <div className="flex items-center justify-center gap-2 pb-2">
      {Array.from({ length: STEP_COUNT }, (_, index) => index + 1).map(item => (
        <div key={item} className="flex items-center">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold transition-all ${
            item < step ? "bg-cyan-500 text-white" : item === step ? "bg-cyan-500 text-white ring-2 ring-cyan-300" : "border border-slate-600 bg-slate-700 text-slate-400"
          }`}>
            {item < step ? <CheckCircle2 size={20} /> : item}
          </div>
          {item < STEP_COUNT && <div className={`mx-1 h-1 w-8 ${item < step ? "bg-cyan-500" : "bg-slate-700"}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="w-full max-w-7xl">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-cyan-400">SETUP WIZARD</h1>
              <p className="text-sm text-slate-400">STEP {step} OF {STEP_COUNT}</p>
            </div>
            <button onClick={onCancel} className="text-slate-400 transition-colors hover:text-cyan-400" aria-label="Cancel setup">
              <X size={24} />
            </button>
          </div>
          <ProgressIndicator />
        </div>

        <div className="rounded-lg border-2 border-cyan-500/50 bg-slate-900/20 p-8 backdrop-blur-sm">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="mb-8 text-center text-2xl font-bold tracking-wider text-cyan-400">MATERIAL SELECTION</h2>
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="flex flex-col gap-4">
                  <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-cyan-500/30 bg-slate-800/50 p-6">
                    <p className="mb-4 text-xs font-bold tracking-wider text-cyan-400">SELECTED MATERIAL PREVIEW</p>
                    {selectedMaterialData ? (
                      <>
                        <div className="mb-4 flex h-48 w-48 items-center justify-center rounded-full border border-cyan-500/30 bg-gradient-to-b from-purple-500/20 to-transparent">
                          <div className="text-6xl">🌿</div>
                        </div>
                        <h3 className="text-center text-lg font-bold text-cyan-400">{selectedMaterialData.name.toUpperCase()}</h3>
                        <p className="mt-2 text-center text-xs text-slate-400">{selectedMaterialData.description || "Botanical material"}</p>
                      </>
                    ) : <p className="text-center text-slate-500">Select a material to preview</p>}
                  </div>
                  {selectedMaterialData && (
                    <div className="rounded-lg border border-cyan-500/30 bg-slate-800/50 p-4">
                      <h4 className="mb-3 text-xs font-bold tracking-wider text-cyan-400">MATERIAL PROPERTIES</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span className="flex items-center gap-2 text-slate-400"><Droplet size={14} />MOISTURE</span><span className="font-mono text-cyan-400">{selectedMaterialData.defaultWaterContent}%</span></div>
                        <div className="flex justify-between"><span className="flex items-center gap-2 text-slate-400"><Droplet size={14} />OIL CONTENT</span><span className="font-mono text-cyan-400">{selectedMaterialData.defaultOilContent}%</span></div>
                        <div className="flex justify-between"><span className="flex items-center gap-2 text-slate-400"><Weight size={14} />DENSITY</span><span className="font-mono text-cyan-400">{selectedMaterialData.density || "0.92"} g/cm³</span></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-6">
                  <div>
                    <label className="mb-2 block text-sm font-bold tracking-wider text-cyan-400">PILIH JENIS BAHAN</label>
                    <Select value={selectedMaterial?.toString() || ""} onValueChange={value => handleMaterialSelect(Number(value))}>
                      <SelectTrigger className="border-cyan-500/50 bg-slate-800 text-white"><SelectValue placeholder="Select a material..." /></SelectTrigger>
                      <SelectContent className="border-cyan-500/50 bg-slate-800">
                        {materials.map(material => <SelectItem key={material.id} value={material.id.toString()} className="text-white">{material.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.material && <p className="mt-1 text-xs text-red-400">{errors.material}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold tracking-wider text-cyan-400">BERAT BAHAN (KG)</label>
                    <div className="flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-slate-800 px-4 py-2"><Weight size={20} className="text-cyan-400" /><input type="number" min="0.1" max="1000" value={materialWeight} onChange={event => setMaterialWeight(Number(event.target.value))} className="flex-1 bg-transparent font-mono text-white outline-none" /><span className="text-slate-400">kg</span></div>
                    {errors.materialWeight && <p className="mt-1 text-xs text-red-400">{errors.materialWeight}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold tracking-wider text-cyan-400">KADAR AIR AWAL (%)</label>
                    <div className="flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-slate-800 px-4 py-2"><Droplet size={20} className="text-blue-400" /><input type="number" min="0" max="100" value={waterContent} onChange={event => setWaterContent(Number(event.target.value))} className="flex-1 bg-transparent font-mono text-white outline-none" /><span className="text-slate-400">%</span></div>
                    {errors.waterContent && <p className="mt-1 text-xs text-red-400">{errors.waterContent}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold tracking-wider text-cyan-400">KADAR MINYAK AWAL (%)</label>
                    <div className="flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-slate-800 px-4 py-2"><Droplet size={20} className="text-yellow-400" /><input type="number" min="0" max="100" value={oilContent} onChange={event => setOilContent(Number(event.target.value))} className="flex-1 bg-transparent font-mono text-white outline-none" /><span className="text-slate-400">%</span></div>
                    {errors.oilContent && <p className="mt-1 text-xs text-red-400">{errors.oilContent}</p>}
                  </div>
                </div>
                <SystemOverviewPanel />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="mb-8 text-center text-2xl font-bold tracking-wider text-cyan-400">PROCESS PARAMETERS</h2>
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="rounded-lg border border-cyan-500/30 bg-slate-800/50 p-6">
                  <h3 className="mb-4 font-bold tracking-wider text-cyan-400">CONFIGURATION</h3>
                  <div className="space-y-3 text-sm">
                    <div><p className="text-slate-400">Target Pressure</p><p className="font-mono text-lg text-cyan-400">{targetPressure} mbar</p></div>
                    <div><p className="text-slate-400">Target Temperature</p><p className="font-mono text-lg text-cyan-400">{targetTemperature}°C</p></div>
                    <div><p className="text-slate-400">Ultrasonic Frequency</p><p className="font-mono text-lg text-cyan-400">{ultrasonicFrequency} kHz</p></div>
                    <div><p className="text-slate-400">Duration</p><p className="font-mono text-lg text-cyan-400">{duration.toFixed(1)} hours</p></div>
                    <div><p className="text-slate-400">Material:Water Ratio</p><p className="font-mono text-lg text-cyan-400">{materialWaterRatio}</p></div>
                    <div><p className="text-slate-400">Process Model</p><p className="font-mono text-lg capitalize text-cyan-400">{processModel}</p></div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div><label className="mb-2 block text-sm font-bold tracking-wider text-cyan-400">EXPERIMENT NAME</label><Input value={experimentName} onChange={event => setExperimentName(event.target.value)} placeholder="e.g., Nilam Extraction - Trial 1" className="border-cyan-500/50 bg-slate-800 text-white placeholder-slate-500" />{errors.experimentName && <p className="mt-1 text-xs text-red-400">{errors.experimentName}</p>}</div>
                  <div><label className="mb-2 block text-sm font-bold tracking-wider text-cyan-400">TARGET PRESSURE: {targetPressure} mbar</label><Slider value={[targetPressure]} onValueChange={value => setTargetPressure(value[0])} min={1} max={1000} step={1} />{errors.targetPressure && <p className="mt-1 text-xs text-red-400">{errors.targetPressure}</p>}</div>
                  <div><label className="mb-2 block text-sm font-bold tracking-wider text-cyan-400">TARGET TEMPERATURE: {targetTemperature}°C</label><Slider value={[targetTemperature]} onValueChange={value => setTargetTemperature(value[0])} min={20} max={150} step={1} />{errors.targetTemperature && <p className="mt-1 text-xs text-red-400">{errors.targetTemperature}</p>}</div>
                  <div><label className="mb-2 block text-sm font-bold tracking-wider text-cyan-400">ULTRASONIC FREQUENCY: {ultrasonicFrequency} kHz</label><Slider value={[ultrasonicFrequency]} onValueChange={value => setUltrasonicFrequency(value[0])} min={20} max={100} step={1} />{errors.ultrasonicFrequency && <p className="mt-1 text-xs text-red-400">{errors.ultrasonicFrequency}</p>}</div>
                  <div><label className="mb-2 block text-sm font-bold tracking-wider text-cyan-400">DURATION: {duration.toFixed(1)} hours</label><Slider value={[duration]} onValueChange={value => setDuration(value[0])} min={0.5} max={24} step={0.5} />{errors.duration && <p className="mt-1 text-xs text-red-400">{errors.duration}</p>}</div>
                  <div><label className="mb-2 block text-sm font-bold tracking-wider text-cyan-400">MATERIAL:WATER RATIO</label><Select value={materialWaterRatio} onValueChange={setMaterialWaterRatio}><SelectTrigger className="border-cyan-500/50 bg-slate-800 text-white"><SelectValue /></SelectTrigger><SelectContent className="border-cyan-500/50 bg-slate-800"><SelectItem value="1:1" className="text-white">1:1</SelectItem><SelectItem value="1:2" className="text-white">1:2</SelectItem><SelectItem value="1:3" className="text-white">1:3</SelectItem><SelectItem value="2:1" className="text-white">2:1</SelectItem></SelectContent></Select></div>
                  <div><label className="mb-2 block text-sm font-bold tracking-wider text-cyan-400">PROCESS MODEL</label><RadioGroup value={processModel} onValueChange={setProcessModel}><div className="flex items-center space-x-2"><RadioGroupItem value="vacuum" id="vacuum" className="border-cyan-500" /><Label htmlFor="vacuum" className="cursor-pointer text-slate-300">Vacuum Drying</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="distillation" id="distillation" className="border-cyan-500" /><Label htmlFor="distillation" className="cursor-pointer text-slate-300">Vacuum Distillation</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="ultrasonic" id="ultrasonic" className="border-cyan-500" /><Label htmlFor="ultrasonic" className="cursor-pointer text-slate-300">Ultrasonic Extraction</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="hybrid" id="hybrid" className="border-cyan-500" /><Label htmlFor="hybrid" className="cursor-pointer text-slate-300">Hybrid Model</Label></div></RadioGroup></div>
                </div>
                <SystemOverviewPanel />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="mb-8 text-center text-2xl font-bold tracking-wider text-cyan-400">REVIEW & CONFIRM</h2>
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-4">
                  <div className="rounded-lg border border-cyan-500/30 bg-slate-800/50 p-4"><h4 className="mb-3 text-xs font-bold tracking-wider text-cyan-400">MATERIAL</h4><p className="font-semibold text-white">{selectedMaterialData?.name}</p><p className="mt-1 text-xs text-slate-400">{selectedMaterialData?.description || "Botanical material"}</p></div>
                  <div className="rounded-lg border border-cyan-500/30 bg-slate-800/50 p-4"><h4 className="mb-3 text-xs font-bold tracking-wider text-cyan-400">INITIAL CONDITIONS</h4><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-400">Weight</span><span className="font-mono text-cyan-400">{materialWeight.toFixed(1)} kg</span></div><div className="flex justify-between"><span className="text-slate-400">Water</span><span className="font-mono text-cyan-400">{waterContent.toFixed(1)}%</span></div><div className="flex justify-between"><span className="text-slate-400">Oil</span><span className="font-mono text-cyan-400">{oilContent.toFixed(2)}%</span></div></div></div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border border-cyan-500/30 bg-slate-800/50 p-4"><h4 className="mb-3 text-xs font-bold tracking-wider text-cyan-400">EXPERIMENT</h4><p className="font-semibold text-white">{experimentName}</p></div>
                  <div className="rounded-lg border border-cyan-500/30 bg-slate-800/50 p-4"><h4 className="mb-3 text-xs font-bold tracking-wider text-cyan-400">PROCESS PARAMETERS</h4><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-400">Pressure</span><span className="font-mono text-cyan-400">{targetPressure} mbar</span></div><div className="flex justify-between"><span className="text-slate-400">Temperature</span><span className="font-mono text-cyan-400">{targetTemperature}°C</span></div><div className="flex justify-between"><span className="text-slate-400">Frequency</span><span className="font-mono text-cyan-400">{ultrasonicFrequency} kHz</span></div><div className="flex justify-between"><span className="text-slate-400">Duration</span><span className="font-mono text-cyan-400">{duration.toFixed(1)} h</span></div><div className="flex justify-between"><span className="text-slate-400">Ratio</span><span className="font-mono text-cyan-400">{materialWaterRatio}</span></div><div className="flex justify-between"><span className="text-slate-400">Model</span><span className="font-mono capitalize text-cyan-400">{processModel}</span></div></div></div>
                </div>
                <SystemOverviewPanel />
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-slate-700 pt-6">
            <Button onClick={step === 1 ? onCancel : handlePrevious} className="border-2 border-cyan-500/50 bg-transparent text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10"><X size={18} className="mr-2" />{step === 1 ? "CANCEL" : "PREVIOUS"}</Button>
            {step < STEP_COUNT ? <Button onClick={handleNext} className="bg-cyan-600 font-bold text-white hover:bg-cyan-700">NEXT<ChevronRight size={18} className="ml-2" /></Button> : <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 font-bold text-white hover:bg-green-700 disabled:opacity-50">{loading ? "CREATING..." : "START SIMULATION"}<ChevronRight size={18} className="ml-2" /></Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

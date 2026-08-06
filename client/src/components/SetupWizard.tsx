import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, CheckCircle2, ChevronRight, X, Droplet, Weight, Gauge } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SetupWizardProps {
  onComplete?: (experimentId: string) => void;
  onCancel?: () => void;
}

interface ValidationErrors {
  materialWeight?: string;
  waterContent?: string;
  oilContent?: string;
  targetPressure?: string;
  targetTemperature?: string;
  ultrasonicFrequency?: string;
  duration?: string;
  experimentName?: string;
}

export function SetupWizard({ onComplete, onCancel }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Material Selection State
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [materialWeight, setMaterialWeight] = useState(10);
  const [waterContent, setWaterContent] = useState(50);
  const [oilContent, setOilContent] = useState(3);

  // Process Parameters State
  const [targetPressure, setTargetPressure] = useState(100);
  const [targetTemperature, setTargetTemperature] = useState(60);
  const [ultrasonicFrequency, setUltrasonicFrequency] = useState(40);
  const [duration, setDuration] = useState(2);
  const [materialWaterRatio, setMaterialWaterRatio] = useState("1:1");
  const [processModel, setProcessModel] = useState("hybrid");

  // Experiment Name
  const [experimentName, setExperimentName] = useState("");

  // Fetch materials
  const { data: materials = [] } = trpc.materials.list.useQuery();
  const createExperiment = trpc.experiments.create.useMutation();

  // Get selected material details
  const selectedMaterialData = useMemo(() => {
    return materials.find(m => m.id === selectedMaterial);
  }, [selectedMaterial, materials]);

  const handleMaterialSelect = (materialId: number) => {
    setSelectedMaterial(materialId);
    const material = materials.find(m => m.id === materialId);
    if (material) {
      setWaterContent(Number(material.defaultWaterContent) || 50);
      setOilContent(Number(material.defaultOilContent) || 3);
    }
  };

  // Validation functions
  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!selectedMaterial) {
      newErrors.materialWeight = "Please select a material";
    }
    if (materialWeight <= 0 || materialWeight > 1000) {
      newErrors.materialWeight = "Weight must be between 0.1 and 1000 kg";
    }
    if (waterContent < 0 || waterContent > 100) {
      newErrors.waterContent = "Water content must be between 0 and 100%";
    }
    if (oilContent < 0 || oilContent > 100) {
      newErrors.oilContent = "Oil content must be between 0 and 100%";
    }
    if (waterContent + oilContent > 100) {
      newErrors.waterContent = "Water + Oil content cannot exceed 100%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!experimentName.trim()) {
      newErrors.experimentName = "Experiment name is required";
    }
    if (targetPressure < 1 || targetPressure > 1000) {
      newErrors.targetPressure = "Pressure must be between 1 and 1000 mbar";
    }
    if (targetTemperature < 20 || targetTemperature > 150) {
      newErrors.targetTemperature = "Temperature must be between 20 and 150°C";
    }
    if (ultrasonicFrequency < 20 || ultrasonicFrequency > 100) {
      newErrors.ultrasonicFrequency = "Frequency must be between 20 and 100 kHz";
    }
    if (duration < 0.5 || duration > 24) {
      newErrors.duration = "Duration must be between 0.5 and 24 hours";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) {
        toast.error("Please fix the errors before proceeding");
        return;
      }
    } else if (step === 2) {
      if (!validateStep2()) {
        toast.error("Please fix the errors before proceeding");
        return;
      }
    }
    setErrors({});
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setErrors({});
    setStep(step - 1);
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
        experimentName,
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

      toast.success("Experiment created successfully!");
      onComplete?.(result.experimentId);
    } catch (error) {
      toast.error("Failed to create experiment");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Progress Indicator Component
  const ProgressIndicator = () => (
    <div className="flex justify-center items-center gap-2 mb-8">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
            s < step ? "bg-cyan-500 text-white" :
            s === step ? "bg-cyan-500 text-white ring-2 ring-cyan-300" :
            "bg-slate-700 text-slate-400 border border-slate-600"
          }`}>
            {s < step ? <CheckCircle2 size={20} /> : s}
          </div>
          {s < 5 && <div className={`w-8 h-1 mx-1 ${s < step ? "bg-cyan-500" : "bg-slate-700"}`} />}
        </div>
      ))}
    </div>
  );

  // System Overview Panel Component
  const SystemOverviewPanel = () => (
    <div className="bg-slate-900/40 border border-cyan-500/30 rounded-lg p-4 space-y-4">
      <h3 className="text-cyan-400 font-bold text-sm tracking-wider">SYSTEM OVERVIEW</h3>
      
      <div className="space-y-3">
        {/* Temperature */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-cyan-400" />
            <span className="text-slate-400 text-xs">TEMPERATURE</span>
          </div>
          <span className="text-cyan-400 font-mono text-sm">22.4°C</span>
        </div>

        {/* Pressure */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-cyan-400" />
            <span className="text-slate-400 text-xs">PRESSURE</span>
          </div>
          <span className="text-cyan-400 font-mono text-sm">101.3 kPa</span>
        </div>

        {/* Vacuum */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-cyan-400" />
            <span className="text-slate-400 text-xs">VACUUM</span>
          </div>
          <span className="text-cyan-400 font-mono text-sm">-0.8 kPa</span>
        </div>
      </div>

      <div className="border-t border-slate-700 pt-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-500" />
          <span className="text-slate-300 text-xs">ALL SYSTEMS NOMINAL</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-cyan-400 text-2xl font-bold tracking-wider">SETUP WIZARD</h1>
              <p className="text-slate-400 text-sm">STEP {step} OF 5</p>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <ProgressIndicator />
        </div>

        {/* Main Content Area */}
        <div className="border-2 border-cyan-500/50 rounded-lg p-8 bg-slate-900/20 backdrop-blur-sm">
          
          {/* Step 1: Material Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-cyan-400 text-2xl font-bold tracking-wider text-center mb-8">MATERIAL SELECTION</h2>
              
              <div className="grid grid-cols-3 gap-8">
                {/* Left Panel: Material Preview */}
                <div className="flex flex-col gap-4">
                  <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-6 flex flex-col items-center justify-center min-h-96">
                    <p className="text-cyan-400 text-xs font-bold mb-4 tracking-wider">SELECTED MATERIAL PREVIEW</p>
                    {selectedMaterialData ? (
                      <>
                        <div className="w-48 h-48 bg-gradient-to-b from-purple-500/20 to-transparent rounded-full flex items-center justify-center mb-4 border border-cyan-500/30">
                          <div className="text-6xl">🌿</div>
                        </div>
                        <h3 className="text-cyan-400 font-bold text-lg text-center">{selectedMaterialData.name.toUpperCase()}</h3>
                        <p className="text-slate-400 text-xs text-center mt-2">{selectedMaterialData.description || "Botanical material"}</p>
                      </>
                    ) : (
                      <p className="text-slate-500 text-center">Select a material to preview</p>
                    )}
                  </div>

                  {/* Material Properties */}
                  {selectedMaterialData && (
                    <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4">
                      <h4 className="text-cyan-400 text-xs font-bold mb-3 tracking-wider">MATERIAL PROPERTIES</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Droplet size={14} className="text-blue-400" />
                            <span className="text-slate-400">MOISTURE</span>
                          </div>
                          <span className="text-cyan-400 font-mono">{selectedMaterialData.defaultWaterContent}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Droplet size={14} className="text-yellow-400" />
                            <span className="text-slate-400">OIL CONTENT</span>
                          </div>
                          <span className="text-cyan-400 font-mono">{selectedMaterialData.defaultOilContent}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Weight size={14} className="text-slate-400" />
                            <span className="text-slate-400">DENSITY</span>
                          </div>
                          <span className="text-cyan-400 font-mono">{selectedMaterialData.density || "0.92"} g/cm³</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Center Panel: Material Selection Inputs */}
                <div className="flex flex-col gap-6">
                  <div>
                    <label className="text-cyan-400 text-sm font-bold mb-2 block tracking-wider">PILIH JENIS BAHAN</label>
                    <Select value={selectedMaterial?.toString() || ""} onValueChange={(v) => handleMaterialSelect(Number(v))}>
                      <SelectTrigger className="bg-slate-800 border-cyan-500/50 text-white hover:border-cyan-400 transition-colors">
                        <SelectValue placeholder="Select a material..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-cyan-500/50">
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()} className="text-white">
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.materialWeight && <p className="text-red-400 text-xs mt-1">{errors.materialWeight}</p>}
                  </div>

                  <div>
                    <label className="text-cyan-400 text-sm font-bold mb-2 block tracking-wider">BERAT BAHAN (KG)</label>
                    <div className="flex items-center gap-2 border border-cyan-500/50 rounded-lg px-4 py-2 bg-slate-800">
                      <Weight size={20} className="text-cyan-400" />
                      <input
                        type="number"
                        value={materialWeight.toFixed(2)}
                        onChange={(e) => setMaterialWeight(Number(e.target.value))}
                        className="bg-transparent text-white font-mono flex-1 outline-none"
                      />
                      <span className="text-slate-400">kg</span>
                    </div>
                    {errors.materialWeight && <p className="text-red-400 text-xs mt-1">{errors.materialWeight}</p>}
                  </div>

                  <div>
                    <label className="text-cyan-400 text-sm font-bold mb-2 block tracking-wider">KADAR AIR AWAL (%)</label>
                    <div className="flex items-center gap-2 border border-cyan-500/50 rounded-lg px-4 py-2 bg-slate-800">
                      <Droplet size={20} className="text-blue-400" />
                      <input
                        type="number"
                        value={waterContent.toFixed(2)}
                        onChange={(e) => setWaterContent(Number(e.target.value))}
                        className="bg-transparent text-white font-mono flex-1 outline-none"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                    {errors.waterContent && <p className="text-red-400 text-xs mt-1">{errors.waterContent}</p>}
                  </div>

                  <div>
                    <label className="text-cyan-400 text-sm font-bold mb-2 block tracking-wider">KADAR MINYAK AWAL (%)</label>
                    <div className="flex items-center gap-2 border border-cyan-500/50 rounded-lg px-4 py-2 bg-slate-800">
                      <Droplet size={20} className="text-yellow-400" />
                      <input
                        type="number"
                        value={oilContent.toFixed(2)}
                        onChange={(e) => setOilContent(Number(e.target.value))}
                        className="bg-transparent text-white font-mono flex-1 outline-none"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                    {errors.oilContent && <p className="text-red-400 text-xs mt-1">{errors.oilContent}</p>}
                  </div>
                </div>

                {/* Right Panel: System Overview */}
                <div>
                  <SystemOverviewPanel />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Process Parameters */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-cyan-400 text-2xl font-bold tracking-wider text-center mb-8">PROCESS PARAMETERS</h2>
              
              <div className="grid grid-cols-3 gap-8">
                {/* Left Panel: Parameter Info */}
                <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-6">
                  <h3 className="text-cyan-400 font-bold mb-4 tracking-wider">CONFIGURATION</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-400">Target Pressure</p>
                      <p className="text-cyan-400 font-mono text-lg">{targetPressure.toFixed(0)} mbar</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Target Temperature</p>
                      <p className="text-cyan-400 font-mono text-lg">{targetTemperature.toFixed(0)}°C</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Ultrasonic Frequency</p>
                      <p className="text-cyan-400 font-mono text-lg">{ultrasonicFrequency.toFixed(0)} kHz</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Duration</p>
                      <p className="text-cyan-400 font-mono text-lg">{duration.toFixed(1)} hours</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Material:Water Ratio</p>
                      <p className="text-cyan-400 font-mono text-lg">{materialWaterRatio}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Process Model</p>
                      <p className="text-cyan-400 font-mono text-lg capitalize">{processModel}</p>
                    </div>
                  </div>
                </div>

                {/* Center Panel: Parameter Inputs */}
                <div className="flex flex-col gap-6">
                  <div>
                    <label className="text-cyan-400 text-sm font-bold mb-2 block tracking-wider">EXPERIMENT NAME</label>
                    <Input
                      value={experimentName}
                      onChange={(e) => setExperimentName(e.target.value)}
                      placeholder="e.g., Nilam Extraction - Trial 1"
                      className="bg-slate-800 border-cyan-500/50 text-white placeholder-slate-500"
                    />
                    {errors.experimentName && <p className="text-red-400 text-xs mt-1">{errors.experimentName}</p>}
                  </div>

                  <div>
                    <label className="text-cyan-400 text-sm font-bold mb-2 block tracking-wider">
                      TARGET PRESSURE: {targetPressure.toFixed(0)} mbar
                    </label>
                    <Slider
                      value={[targetPressure]}
                      onValueChange={(v) => setTargetPressure(v[0])}
                      min={1}
                      max={1000}
                      step={1}
                    />
                    {errors.targetPressure && <p className="text-red-400 text-xs mt-1">{errors.targetPressure}</p>}
                  </div>

                  <div>
                    <label className="text-cyan-400 text-sm font-bold mb-2 block tracking-wider">
                      TARGET TEMPERATURE: {targetTemperature.toFixed(0)}°C
                    </label>
                    <Slider
                      value={[targetTemperature]}
                      onValueChange={(v) => setTargetTemperature(v[0])}
                      min={20}
                      max={150}
                      step={1}
                    />
                    {errors.targetTemperature && <p className="text-red-400 text-xs mt-1">{errors.targetTemperature}</p>}
                  </div>

                  <div>
                    <label className="text-cyan-400 text-sm font-bold mb-2 block tracking-wider">
                      ULTRASONIC FREQUENCY: {ultrasonicFrequency.toFixed(0)} kHz
                    </label>
                    <Slider
                      value={[ultrasonicFrequency]}
                      onValueChange={(v) => setUltrasonicFrequency(v[0])}
                      min={20}
                      max={100}
                      step={1}
                    />
                    {errors.ultrasonicFrequency && <p className="text-red-400 text-xs mt-1">{errors.ultrasonicFrequency}</p>}
                  </div>

                  <div>
                    <label className="text-cyan-400 text-sm font-bold mb-2 block tracking-wider">
                      DURATION: {duration.toFixed(1)} hours
                    </label>
                    <Slider
                      value={[duration]}
                      onValueChange={(v) => setDuration(v[0])}
                      min={0.5}
                      max={24}
                      step={0.5}
                    />
                    {errors.duration && <p className="text-red-400 text-xs mt-1">{errors.duration}</p>}
                  </div>

                  <div>
                    <label className="text-cyan-400 text-sm font-bold mb-2 block tracking-wider">MATERIAL:WATER RATIO</label>
                    <Select value={materialWaterRatio} onValueChange={setMaterialWaterRatio}>
                      <SelectTrigger className="bg-slate-800 border-cyan-500/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-cyan-500/50">
                        <SelectItem value="1:1" className="text-white">1:1</SelectItem>
                        <SelectItem value="1:2" className="text-white">1:2</SelectItem>
                        <SelectItem value="1:3" className="text-white">1:3</SelectItem>
                        <SelectItem value="2:1" className="text-white">2:1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-cyan-400 text-sm font-bold mb-2 block tracking-wider">PROCESS MODEL</label>
                    <RadioGroup value={processModel} onValueChange={setProcessModel}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="vacuum" id="vacuum" className="border-cyan-500" />
                        <Label htmlFor="vacuum" className="text-slate-300 cursor-pointer">Vacuum Drying</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="distillation" id="distillation" className="border-cyan-500" />
                        <Label htmlFor="distillation" className="text-slate-300 cursor-pointer">Vacuum Distillation</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ultrasonic" id="ultrasonic" className="border-cyan-500" />
                        <Label htmlFor="ultrasonic" className="text-slate-300 cursor-pointer">Ultrasonic Extraction</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hybrid" id="hybrid" className="border-cyan-500" />
                        <Label htmlFor="hybrid" className="text-slate-300 cursor-pointer">Hybrid Model</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Right Panel: System Overview */}
                <div>
                  <SystemOverviewPanel />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-cyan-400 text-2xl font-bold tracking-wider text-center mb-8">REVIEW & CONFIRM</h2>
              
              <div className="grid grid-cols-3 gap-8">
                {/* Left Panel: Material Summary */}
                <div className="space-y-4">
                  <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4">
                    <h4 className="text-cyan-400 text-xs font-bold mb-3 tracking-wider">MATERIAL</h4>
                    <p className="text-white font-semibold">{selectedMaterialData?.name}</p>
                    <p className="text-slate-400 text-xs mt-1">{selectedMaterialData?.description || "Botanical material"}</p>
                  </div>

                  <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4">
                    <h4 className="text-cyan-400 text-xs font-bold mb-3 tracking-wider">INITIAL CONDITIONS</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Weight</span>
                        <span className="text-cyan-400 font-mono">{materialWeight.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Water</span>
                        <span className="text-cyan-400 font-mono">{waterContent.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Oil</span>
                        <span className="text-cyan-400 font-mono">{oilContent.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center Panel: Process Summary */}
                <div className="space-y-4">
                  <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4">
                    <h4 className="text-cyan-400 text-xs font-bold mb-3 tracking-wider">EXPERIMENT</h4>
                    <p className="text-white font-semibold">{experimentName}</p>
                  </div>

                  <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4">
                    <h4 className="text-cyan-400 text-xs font-bold mb-3 tracking-wider">PROCESS PARAMETERS</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pressure</span>
                        <span className="text-cyan-400 font-mono">{targetPressure.toFixed(0)} mbar</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Temperature</span>
                        <span className="text-cyan-400 font-mono">{targetTemperature.toFixed(0)}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Frequency</span>
                        <span className="text-cyan-400 font-mono">{ultrasonicFrequency.toFixed(0)} kHz</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Duration</span>
                        <span className="text-cyan-400 font-mono">{duration.toFixed(1)} h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ratio</span>
                        <span className="text-cyan-400 font-mono">{materialWaterRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Model</span>
                        <span className="text-cyan-400 font-mono capitalize">{processModel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: System Overview */}
                <div>
                  <SystemOverviewPanel />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700">
            <Button
              onClick={step === 1 ? onCancel : handlePrevious}
              className="border-2 border-cyan-500/50 bg-transparent text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400"
            >
              <X size={18} className="mr-2" />
              {step === 1 ? "CANCEL" : "PREVIOUS"}
            </Button>

            {step < 3 ? (
              <Button
                onClick={handleNext}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
              >
                NEXT
                <ChevronRight size={18} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-50"
              >
                {loading ? "STARTING..." : "START SIMULATION"}
                <ChevronRight size={18} className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

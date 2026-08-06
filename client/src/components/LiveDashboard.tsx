import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface LiveDashboardProps {
  experimentId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface SimulationData {
  timestamp: number;
  pressure: number;
  temperature: number;
  yield: number;
  energy: number;
  efficiency: number;
  waterRemoved: number;
}

export function LiveDashboard({ experimentId, onComplete, onCancel }: LiveDashboardProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [simulationData, setSimulationData] = useState<SimulationData[]>([]);
  
  // Parameter adjustments
  const [pressureAdj, setPressureAdj] = useState(0);
  const [temperatureAdj, setTemperatureAdj] = useState(0);
  const [frequencyAdj, setFrequencyAdj] = useState(0);

  // Current values
  const currentData = simulationData[simulationData.length - 1] || {
    timestamp: 0,
    pressure: 0,
    temperature: 0,
    yield: 0,
    energy: 0,
    efficiency: 0,
    waterRemoved: 0,
  };

  const experimentQuery = trpc.experiments.get.useQuery(experimentId);
  const simulationMutation = trpc.simulation.run.useMutation();
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);

  // Start simulation
  const handleStart = async () => {
    if (isRunning || !experimentQuery.data) return;
    
    const experiment = experimentQuery.data;
    const params = experiment.inputParameters as any;

    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();

    try {
      const result = await simulationMutation.mutateAsync({
        experimentId,
        materialId: experiment.materialId,
        materialWeight: params.materialWeight,
        waterContent: params.waterContent,
        oilContent: params.oilContent,
        targetPressure: params.targetPressure,
        targetTemperature: params.targetTemperature,
        ultrasonicFrequency: params.ultrasonicFrequency,
        duration: params.duration,
        materialWaterRatio: params.materialWaterRatio,
        processModel: params.processModel,
      });

      // Process simulation results
      if (result.results && result.results.realTimeData) {
        const data = result.results.realTimeData as unknown as SimulationData[];
        setSimulationData(data);
      }

      toast.success('Simulation completed!');
      setIsRunning(false);
      onComplete?.();
    } catch (error) {
      toast.error('Simulation failed');
      console.error(error);
      setIsRunning(false);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    setSimulationData([]);
  };

  // Animate elapsed time
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const animate = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Animated Gauge Component
  const AnimatedGauge = ({
    value,
    max,
    label,
    unit,
    color = 'cyan',
  }: {
    value: number;
    max: number;
    label: string;
    unit: string;
    color?: string;
  }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 20;

      // Clear canvas
      ctx.fillStyle = 'rgba(10, 14, 39, 1)';
      ctx.fillRect(0, 0, width, height);

      // Draw background circle
      ctx.strokeStyle = 'rgba(100, 100, 120, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw gauge arc (0-180 degrees)
      const startAngle = Math.PI;
      const endAngle = Math.PI * 2;
      const currentAngle = startAngle + ((endAngle - startAngle) * percentage) / 100;

      // Draw background arc
      ctx.strokeStyle = 'rgba(50, 50, 70, 0.5)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.stroke();

      // Draw value arc
      const colorMap: { [key: string]: string } = {
        cyan: 'rgba(0, 240, 255, 0.8)',
        red: 'rgba(255, 0, 100, 0.8)',
        green: 'rgba(0, 255, 100, 0.8)',
      };
      ctx.strokeStyle = colorMap[color] || colorMap.cyan;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, currentAngle);
      ctx.stroke();

      // Draw needle
      const needleAngle = currentAngle;
      const needleLength = radius - 10;
      const needleX = centerX + Math.cos(needleAngle) * needleLength;
      const needleY = centerY + Math.sin(needleAngle) * needleLength;

      ctx.strokeStyle = colorMap[color] || colorMap.cyan;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(needleX, needleY);
      ctx.stroke();

      // Draw center circle
      ctx.fillStyle = colorMap[color] || colorMap.cyan;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw value text
      ctx.fillStyle = colorMap[color] || colorMap.cyan;
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${value.toFixed(1)}${unit}`, centerX, centerY + 40);

      // Draw label
      ctx.fillStyle = 'rgba(200, 200, 220, 0.8)';
      ctx.font = '12px Arial';
      ctx.fillText(label, centerX, centerY - radius + 20);
    }, [value, max, label, unit, color, percentage]);

    return (
      <div className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={200}
          height={160}
          className="border border-cyan-500/30 rounded-lg p-2 bg-slate-800/50"
        />
      </div>
    );
  };

  // Metric Card Component
  const MetricCard = ({
    label,
    value,
    unit,
    icon,
  }: {
    label: string;
    value: number;
    unit: string;
    icon: string;
  }) => (
    <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-cyan-400 font-mono text-2xl font-bold">
        {value.toFixed(2)} {unit}
      </div>
    </div>
  );

  // Real-time Graph Component
  const RealtimeGraph = ({
    data,
    dataKey,
    label,
    max,
    color = 'rgba(0, 240, 255, 0.6)',
  }: {
    data: SimulationData[];
    dataKey: keyof SimulationData;
    label: string;
    max: number;
    color?: string;
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || data.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const padding = 20;

      // Clear canvas
      ctx.fillStyle = 'rgba(10, 14, 39, 1)';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = 'rgba(100, 100, 120, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding + ((height - padding * 2) / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      // Draw axes
      ctx.strokeStyle = 'rgba(100, 100, 120, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // Draw data line
      if (data.length > 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, index) => {
          const x = padding + ((width - padding * 2) / (data.length - 1)) * index;
          const value = (point[dataKey] as number) || 0;
          const y = height - padding - ((value / max) * (height - padding * 2));

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, color.replace('0.6', '0.3'));
        gradient.addColorStop(1, color.replace('0.6', '0'));

        ctx.fillStyle = gradient;
        ctx.lineTo(width - padding, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();
        ctx.fill();
      }

      // Draw label
      ctx.fillStyle = 'rgba(200, 200, 220, 0.8)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(label, padding + 5, padding - 5);
    }, [data, dataKey, label, max, color]);

    return (
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="border border-cyan-500/30 rounded-lg bg-slate-800/50 w-full"
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-cyan-400 text-3xl font-bold tracking-wider">LIVE CONTROL ROOM</h1>
            <p className="text-slate-400 text-sm">Experiment ID: {experimentId}</p>
          </div>
          <div className="text-right">
            <p className="text-cyan-400 text-2xl font-mono font-bold">{elapsedTime}s</p>
            <p className="text-slate-400 text-xs">ELAPSED TIME</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${isRunning && !isPaused ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-slate-300">
              {isRunning ? (isPaused ? 'PAUSED' : 'RUNNING') : 'STOPPED'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleStart}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play size={18} className="mr-2" />
              START
            </Button>
            <Button
              onClick={handlePause}
              disabled={!isRunning}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Pause size={18} className="mr-2" />
              {isPaused ? 'RESUME' : 'PAUSE'}
            </Button>
            <Button
              onClick={handleStop}
              disabled={!isRunning}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Square size={18} className="mr-2" />
              STOP
            </Button>
            <Button
              onClick={onCancel}
              className="bg-slate-700 hover:bg-slate-600 text-white"
            >
              EXIT
            </Button>
          </div>
        </div>

        {/* Gauges Section */}
        <div className="grid grid-cols-3 gap-6">
          <AnimatedGauge
            value={currentData.pressure}
            max={500}
            label="PRESSURE"
            unit="mbar"
            color="cyan"
          />
          <AnimatedGauge
            value={currentData.temperature}
            max={150}
            label="TEMPERATURE"
            unit="°C"
            color="red"
          />
          <AnimatedGauge
            value={currentData.yield}
            max={100}
            label="YIELD"
            unit="%"
            color="green"
          />
        </div>

        {/* Metrics Section */}
        <div className="grid grid-cols-3 gap-6">
          <MetricCard
            label="Energy Consumption"
            value={currentData.energy}
            unit="kWh"
            icon="⚡"
          />
          <MetricCard
            label="Extraction Efficiency"
            value={currentData.efficiency}
            unit="%"
            icon="📊"
          />
          <MetricCard
            label="Water Removed"
            value={currentData.waterRemoved}
            unit="L"
            icon="💧"
          />
        </div>

        {/* Graphs Section */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4">
            <h3 className="text-cyan-400 font-bold mb-4 tracking-wider">PRESSURE vs TIME</h3>
            <RealtimeGraph
              data={simulationData}
              dataKey="pressure"
              label="Pressure (mbar)"
              max={500}
              color="rgba(0, 240, 255, 0.6)"
            />
          </div>

          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4">
            <h3 className="text-cyan-400 font-bold mb-4 tracking-wider">TEMPERATURE vs TIME</h3>
            <RealtimeGraph
              data={simulationData}
              dataKey="temperature"
              label="Temperature (°C)"
              max={150}
              color="rgba(255, 100, 0, 0.6)"
            />
          </div>

          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4">
            <h3 className="text-cyan-400 font-bold mb-4 tracking-wider">YIELD ACCUMULATION</h3>
            <RealtimeGraph
              data={simulationData}
              dataKey="yield"
              label="Yield (%)"
              max={100}
              color="rgba(0, 255, 100, 0.6)"
            />
          </div>

          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4">
            <h3 className="text-cyan-400 font-bold mb-4 tracking-wider">ENERGY CONSUMPTION</h3>
            <RealtimeGraph
              data={simulationData}
              dataKey="energy"
              label="Energy (kWh)"
              max={100}
              color="rgba(255, 215, 0, 0.6)"
            />
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-6">
          <h3 className="text-cyan-400 font-bold mb-6 tracking-wider">PARAMETER ADJUSTMENT</h3>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <label className="text-slate-400 text-sm mb-2 block">
                Pressure Adjustment: {pressureAdj.toFixed(0)} mbar
              </label>
              <Slider
                value={[pressureAdj]}
                onValueChange={(v) => setPressureAdj(v[0])}
                min={-50}
                max={50}
                step={1}
              />
            </div>

            <div>
              <label className="text-slate-400 text-sm mb-2 block">
                Temperature Adjustment: {temperatureAdj.toFixed(0)}°C
              </label>
              <Slider
                value={[temperatureAdj]}
                onValueChange={(v) => setTemperatureAdj(v[0])}
                min={-20}
                max={20}
                step={1}
              />
            </div>

            <div>
              <label className="text-slate-400 text-sm mb-2 block">
                Frequency Adjustment: {frequencyAdj.toFixed(0)} kHz
              </label>
              <Slider
                value={[frequencyAdj]}
                onValueChange={(v) => setFrequencyAdj(v[0])}
                min={-10}
                max={10}
                step={1}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              APPLY CHANGES
            </Button>
            <Button className="bg-slate-700 hover:bg-slate-600 text-white">
              RESET TO DEFAULTS
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

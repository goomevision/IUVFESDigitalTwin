import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Info, Zap, Target, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface AIBrainPanelProps {
  experimentId: string;
  params: {
    targetPressure: number;
    targetTemperature: number;
    ultrasonicFrequency: number;
    duration: number;
    materialWeight: number;
    oilContent: number;
    processModel: string;
  };
  currentTime?: number;
  onApplySuggestion?: (parameter: string, value: number) => void;
  onClose?: () => void;
}

export function AIBrainPanel({ experimentId, params, currentTime, onApplySuggestion, onClose }: AIBrainPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  const analysisQuery = trpc.ai.analyze.useQuery(
    { experimentId, dataUpToTime: currentTime, params },
    { refetchInterval: 5000 }
  );

  const analysis = analysisQuery.data;

  // Neural network visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;

    // Define network: 4 input, 6 hidden, 6 hidden, 3 output
    const layers = [4, 6, 6, 3];
    const nodes: { x: number; y: number; layer: number }[] = [];
    layers.forEach((count, li) => {
      const x = (W / (layers.length + 1)) * (li + 1);
      for (let i = 0; i < count; i++) {
        const y = (H / (count + 1)) * (i + 1);
        nodes.push({ x, y, layer: li });
      }
    });

    let frame = 0;
    let raf: number;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Connections
      for (const a of nodes) {
        for (const b of nodes) {
          if (b.layer === a.layer + 1) {
            const pulse = Math.sin(frame * 0.03 + a.x * 0.01 + a.y * 0.02) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.05 + pulse * 0.15})`;
            ctx.lineWidth = 1 + pulse;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Traveling signals
      for (let s = 0; s < 8; s++) {
        const t = ((frame * 0.008) + s * 0.125) % 1;
        const layerIdx = Math.floor(t * (layers.length - 1));
        const localT = (t * (layers.length - 1)) % 1;
        const fromNodes = nodes.filter(n => n.layer === layerIdx);
        const toNodes = nodes.filter(n => n.layer === layerIdx + 1);
        if (fromNodes.length && toNodes.length) {
          const a = fromNodes[s % fromNodes.length];
          const b = toNodes[(s * 3) % toNodes.length];
          const x = a.x + (b.x - a.x) * localT;
          const y = a.y + (b.y - a.y) * localT;
          ctx.fillStyle = 'rgba(57, 255, 20, 0.9)';
          ctx.shadowColor = '#39ff14';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Nodes
      for (const n of nodes) {
        const pulse = Math.sin(frame * 0.05 + n.x * 0.02 + n.y * 0.03) * 0.5 + 0.5;
        const r = 6 + pulse * 3;
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2);
        grad.addColorStop(0, `rgba(0, 240, 255, ${0.9})`);
        grad.addColorStop(0.5, `rgba(0, 240, 255, ${0.3 + pulse * 0.3})`);
        grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0e27';
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Pulse for status
  useEffect(() => {
    const iv = setInterval(() => setPulsePhase(p => (p + 1) % 4), 600);
    return () => clearInterval(iv);
  }, []);

  const statusColor = analysis?.status === 'optimal' ? '#39ff14'
    : analysis?.status === 'warning' ? '#ff006e'
    : analysis?.status === 'suboptimal' ? '#ffd700'
    : '#00f0ff';

  const suggestionIcon = (type: string) => {
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-[#ffd700] shrink-0 mt-0.5" />;
    if (type === 'optimization') return <TrendingUp className="w-4 h-4 text-[#39ff14] shrink-0 mt-0.5" />;
    return <Info className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />;
  };

  return (
    <div className="w-full h-full bg-[#0a0e27] text-[#e8e8ff] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-7 h-7 text-cyan-400" />
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: statusColor }}
            />
          </div>
          <div>
            <h2 className="text-lg font-mono font-bold tracking-wider text-cyan-400">AI BRAIN — PROCESS INTELLIGENCE</h2>
            <p className="text-xs text-[#8b8ba8]">{analysis?.statusMessage ?? 'Initializing neural engine' + '.'.repeat(pulsePhase)}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-mono border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors">
            CLOSE
          </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-y-auto">
        {/* Left: Neural network viz + trends */}
        <div className="flex flex-col gap-4">
          <div className="hologram-panel rounded-lg p-4 flex-1 min-h-[260px] flex flex-col">
            <h3 className="text-xs font-mono text-cyan-400 tracking-widest mb-2">NEURAL NETWORK ACTIVITY</h3>
            <canvas ref={canvasRef} className="w-full flex-1 min-h-[220px]" />
          </div>

          <div className="hologram-panel rounded-lg p-4">
            <h3 className="text-xs font-mono text-cyan-400 tracking-widest mb-3">TREND ANALYSIS</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8b8ba8]">Yield Rate</span>
                <span className={
                  analysis?.trends.yieldRate === 'increasing' ? 'text-[#39ff14]' :
                  analysis?.trends.yieldRate === 'decreasing' ? 'text-[#ff006e]' : 'text-cyan-400'
                }>
                  {analysis?.trends.yieldRate?.toUpperCase() ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b8ba8]">Energy Efficiency</span>
                <span className={
                  analysis?.trends.energyEfficiency === 'good' ? 'text-[#39ff14]' :
                  analysis?.trends.energyEfficiency === 'poor' ? 'text-[#ff006e]' : 'text-[#ffd700]'
                }>
                  {analysis?.trends.energyEfficiency?.toUpperCase() ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b8ba8]">Temperature</span>
                <span className={analysis?.trends.temperatureStability === 'stable' ? 'text-[#39ff14]' : 'text-[#ffd700]'}>
                  {analysis?.trends.temperatureStability?.toUpperCase() ?? '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Suggestions */}
        <div className="hologram-panel rounded-lg p-4 flex flex-col">
          <h3 className="text-xs font-mono text-cyan-400 tracking-widest mb-3">OPTIMIZATION SUGGESTIONS</h3>
          <div className="space-y-3 overflow-y-auto flex-1">
            {analysisQuery.isLoading && (
              <div className="text-sm text-[#8b8ba8] animate-pulse">Analyzing process data...</div>
            )}
            {analysis?.suggestions.map(sug => (
              <div
                key={sug.id}
                className="border border-cyan-500/20 rounded-md p-3 bg-[#0f1535]/60 hover:border-cyan-500/50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  {suggestionIcon(sug.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold">{sug.title}</h4>
                      <span className="text-[10px] font-mono text-[#8b8ba8] border border-[#8b8ba8]/30 rounded px-1.5 py-0.5 shrink-0">
                        {sug.confidence}%
                      </span>
                    </div>
                    <p className="text-xs text-[#8b8ba8] mt-1">{sug.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-[#39ff14] font-mono">{sug.impact}</span>
                      {sug.parameter && sug.suggestedValue !== undefined && onApplySuggestion && (
                        <button
                          onClick={() => {
                            onApplySuggestion(sug.parameter!, sug.suggestedValue!);
                            toast.success(`Applied: ${sug.parameter} → ${sug.suggestedValue}`);
                          }}
                          className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 border border-cyan-500/40 rounded px-2 py-1 hover:bg-cyan-500/10 transition-colors"
                        >
                          APPLY <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {analysis?.anomalies.map((a, i) => (
              <div key={i} className="border border-[#ff006e]/40 rounded-md p-3 bg-[#ff006e]/5 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ff006e] shrink-0 mt-0.5" />
                <p className="text-xs text-[#ff9ec4]">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Prediction */}
        <div className="flex flex-col gap-4">
          <div className="hologram-panel rounded-lg p-4">
            <h3 className="text-xs font-mono text-cyan-400 tracking-widest mb-4">YIELD PREDICTION</h3>
            <div className="text-center py-4">
              <div className="text-4xl font-mono font-bold glow-text">
                {analysis?.prediction.predictedYield?.toFixed(1) ?? '—'}
                <span className="text-lg text-[#8b8ba8] ml-1">mL</span>
              </div>
              <div className="text-xs text-[#8b8ba8] mt-2">
                ± {analysis?.prediction.errorRange?.toFixed(1) ?? '—'} mL error range
              </div>
            </div>
            <div className="space-y-3 mt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#8b8ba8]">Confidence</span>
                  <span className="text-cyan-400 font-mono">{analysis?.prediction.confidenceLevel ?? 0}%</span>
                </div>
                <div className="h-1.5 bg-[#151d3b] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-[#39ff14] transition-all duration-700"
                    style={{ width: `${analysis?.prediction.confidenceLevel ?? 0}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="border border-cyan-500/20 rounded p-2 text-center">
                  <Target className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <div className="text-sm font-mono text-[#e8e8ff]">{analysis?.prediction.efficiency ?? 0}%</div>
                  <div className="text-[10px] text-[#8b8ba8]">RECOVERY</div>
                </div>
                <div className="border border-cyan-500/20 rounded p-2 text-center">
                  <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <div className="text-sm font-mono text-[#e8e8ff]">{analysis?.prediction.timeToCompletion?.toFixed(1) ?? '—'}h</div>
                  <div className="text-[10px] text-[#8b8ba8]">REMAINING</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hologram-panel rounded-lg p-4 flex-1">
            <h3 className="text-xs font-mono text-cyan-400 tracking-widest mb-3">AI RECOMMENDATIONS</h3>
            <div className="space-y-2">
              {analysis?.prediction.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#39ff14] shrink-0 mt-0.5" />
                  <span className="text-[#c8c8e8]">{rec}</span>
                </div>
              ))}
              {!analysis && <div className="text-xs text-[#8b8ba8]">Waiting for data...</div>}
            </div>
            <div className="mt-4 pt-3 border-t border-cyan-500/10 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#ffd700]" />
              <span className="text-[10px] font-mono text-[#8b8ba8]">MODEL: FIRST-ORDER EXTRACTION KINETICS + RULE ENGINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

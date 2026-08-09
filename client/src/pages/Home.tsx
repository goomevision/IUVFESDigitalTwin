import { useState, useEffect, useRef } from 'react';
import { SetupWizard } from '@/components/SetupWizard';
import { ProcessSimulator } from '@/components/ProcessSimulator';
import { useAuth } from '@/_core/hooks/useAuth';

type AppState = 'opening' | 'setup' | 'running';

export default function Home() {
  useAuth();
  const [appState, setAppState] = useState<AppState>('opening');
  const [currentExperimentId, setCurrentExperimentId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (appState !== 'opening') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let phase = 0;
    let elapsed = 0;
    let active = true;
    let frameId = 0;
    const particles: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];

    const draw = () => {
      if (!active) return;
      ctx.fillStyle = 'rgba(10, 14, 39, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const duration = phase === 0 ? 3000 : phase === 1 ? 4000 : phase === 2 ? 3000 : 1000;
      const progress = Math.min(1, elapsed / duration);
      ctx.strokeStyle = `rgba(0, 220, 255, ${0.25 + progress * 0.35})`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        const radius = 50 + i * 25;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
      }
      if (Math.random() < 0.35) {
        const a = Math.random() * Math.PI * 2;
        particles.push({ x: cx + Math.cos(a) * 100, y: cy + Math.sin(a) * 100, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, life: 1 });
      }
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.008; if (p.life > 0) { ctx.fillStyle = `rgba(0,240,255,${p.life * 0.5})`; ctx.fillRect(p.x - 1, p.y - 1, 2, 2); } });
      particles.splice(0, particles.length, ...particles.filter(p => p.life > 0));
      ctx.textAlign = 'center';
      ctx.font = 'bold 42px Arial';
      ctx.fillStyle = `rgba(0,240,255,${0.25 + progress * 0.75})`;
      ctx.fillText('IUVFES DIGITAL TWIN LABORATORY', cx, cy - 35);
      ctx.font = '18px Arial';
      ctx.fillStyle = `rgba(0,200,255,${0.2 + progress * 0.8})`;
      ctx.fillText('BOTANICAL EXTRACTION • PHYSICS • AI • PROCESS DIGITAL TWIN', cx, cy + 15);
      if (elapsed >= duration) { phase += 1; elapsed = 0; if (phase > 3) { active = false; setAppState('setup'); return; } }
      elapsed += 16;
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);
    const skip = () => { active = false; setAppState('setup'); };
    window.addEventListener('keydown', e => { if (e.key === 'Escape') skip(); });
    return () => { active = false; cancelAnimationFrame(frameId); };
  }, [appState]);

  const startExperiment = (experimentId: string) => { setCurrentExperimentId(experimentId); setAppState('running'); };

  return <div className="min-h-screen bg-slate-950">
    {appState === 'opening' && <div className="relative h-screen w-full"><canvas ref={canvasRef} className="absolute inset-0 h-full w-full" /><button onClick={() => setAppState('setup')} className="absolute bottom-8 right-8 z-10 border-2 border-cyan-400 px-6 py-2 font-mono text-sm text-cyan-400 transition-all hover:bg-cyan-400 hover:text-slate-950">SKIP »</button></div>}
    {appState === 'setup' && <div className="h-screen w-full"><SetupWizard onComplete={startExperiment} onCancel={() => setAppState('opening')} /></div>}
    {appState === 'running' && currentExperimentId && <div className="min-h-screen w-full"><ProcessSimulator experimentId={currentExperimentId} onComplete={() => undefined} onExit={() => setAppState('setup')} /></div>}
  </div>;
}

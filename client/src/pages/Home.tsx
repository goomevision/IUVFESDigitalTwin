import { useState, useEffect, useRef } from 'react';
import { Laboratory3D } from '@/components/Laboratory3D';
import { SetupWizard } from '@/components/SetupWizard';
import { LiveDashboard } from '@/components/LiveDashboard';
import { useAuth } from '@/_core/hooks/useAuth';

type AppState = 'opening' | 'setup' | 'dashboard' | 'running';

export default function Home() {
  const { user } = useAuth();
  const [appState, setAppState] = useState<AppState>('opening');
  const [currentExperimentId, setCurrentExperimentId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Opening Animation Effect
  useEffect(() => {
    if (appState !== 'opening') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationPhase = 0;
    let animationTime = 0;
    let isAnimating = true;
    let animationFrameId: number;

    // Particle system for hologram
    const particles: Array<{x: number; y: number; vx: number; vy: number; life: number}> = [];
    
    const draw = () => {
      if (!isAnimating) return;

      // Clear canvas with dark background
      ctx!.fillStyle = 'rgba(10, 14, 39, 1)';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Phase 0: Sound waves with hologram intro (0-3s)
      if (animationPhase === 0) {
        const progress = animationTime / 3000;
        
        // Draw concentric circles (hologram)
        ctx!.strokeStyle = `rgba(0, 200, 255, ${0.3 * (1 - progress * 0.3)})`;
        ctx!.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
          const radius = 50 + i * 30 + Math.sin(progress * Math.PI * 2) * 10;
          ctx!.beginPath();
          ctx!.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx!.stroke();
        }

        // Draw sound waves
        ctx!.strokeStyle = `rgba(0, 240, 255, ${0.4 * (1 - progress)})`;
        ctx!.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const radius = 20 + i * 20 + progress * 80;
          ctx!.beginPath();
          ctx!.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx!.stroke();
        }

        // Generate particles
        if (Math.random() < 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 2;
          particles.push({
            x: centerX + Math.cos(angle) * 100,
            y: centerY + Math.sin(angle) * 100,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1
          });
        }

        if (animationTime >= 3000) {
          animationPhase = 1;
          animationTime = 0;
        }
      }

      // Phase 1: Hologram expansion with panels (3-7s)
      else if (animationPhase === 1) {
        const progress = animationTime / 4000;

        // Draw main hologram circles
        ctx!.strokeStyle = `rgba(0, 200, 255, ${0.5})`;
        ctx!.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          const radius = 50 + i * 25;
          const opacity = Math.max(0, 1 - (i / 12) * 0.5);
          ctx!.strokeStyle = `rgba(0, 200, 255, ${opacity * 0.6})`;
          ctx!.beginPath();
          ctx!.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx!.stroke();
        }

        // Draw rotating inner hologram
        ctx!.strokeStyle = `rgba(0, 240, 255, 0.8)`;
        ctx!.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const angle = (progress * Math.PI * 2) + (i / 6) * Math.PI * 2;
          ctx!.beginPath();
          ctx!.arc(centerX, centerY, 80, angle, angle + Math.PI / 3);
          ctx!.stroke();
        }

        // Draw particles
        particles.forEach((p, idx) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.01;
          
          if (p.life > 0) {
            ctx!.fillStyle = `rgba(0, 240, 255, ${p.life * 0.6})`;
            ctx!.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
          }
        });

        // Remove dead particles
        particles.splice(0, particles.length, ...particles.filter(p => p.life > 0));

        // Generate more particles
        if (Math.random() < 0.5) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 2;
          particles.push({
            x: centerX + Math.cos(angle) * 120,
            y: centerY + Math.sin(angle) * 120,
            vx: Math.cos(angle) * speed * 0.5,
            vy: Math.sin(angle) * speed * 0.5,
            life: 1
          });
        }

        // Draw left panel (Botanical Data)
        ctx!.strokeStyle = 'rgba(0, 200, 255, 0.5)';
        ctx!.lineWidth = 1;
        ctx!.strokeRect(30, 100, 220, 180);
        ctx!.fillStyle = 'rgba(0, 200, 255, 0.1)';
        ctx!.fillRect(30, 100, 220, 180);

        ctx!.fillStyle = 'rgba(0, 240, 255, 0.8)';
        ctx!.font = 'bold 12px monospace';
        ctx!.fillText('BOTANICAL DATA', 45, 120);
        ctx!.font = '10px monospace';
        ctx!.fillText('HARVEST: 2025-01-22', 45, 138);
        ctx!.fillText('EXTRACTION EFFICIENCY', 45, 153);
        ctx!.fillText('98.7%', 45, 168);
        ctx!.fillText('AI MODELS', 45, 183);
        ctx!.fillText('BOTANICAL-TWIN: V3.2', 45, 198);
        ctx!.fillText('QUANTUM-OPT: ACTIVE', 45, 213);

        // Draw right panel (AI Engine)
        ctx!.strokeStyle = 'rgba(0, 200, 255, 0.5)';
        ctx!.lineWidth = 1;
        ctx!.strokeRect(canvas.width - 250, 100, 220, 180);
        ctx!.fillStyle = 'rgba(0, 200, 255, 0.1)';
        ctx!.fillRect(canvas.width - 250, 100, 220, 180);

        ctx!.fillStyle = 'rgba(0, 240, 255, 0.8)';
        ctx!.font = 'bold 12px monospace';
        ctx!.fillText('AI ENGINE', canvas.width - 235, 120);
        ctx!.font = '10px monospace';
        ctx!.fillText('V3.2.1', canvas.width - 235, 138);
        ctx!.fillText('MACHINE LEARNING', canvas.width - 235, 153);
        ctx!.fillText('ACTIVE', canvas.width - 235, 168);
        ctx!.fillText('SYSTEM MONITOR', canvas.width - 235, 183);
        ctx!.fillText('98.7% STABLE', canvas.width - 235, 198);
        ctx!.fillText('ALL SYSTEMS NOMINAL', canvas.width - 235, 213);

        if (animationTime >= 4000) {
          animationPhase = 2;
          animationTime = 0;
        }
      }

      // Phase 2: Title and subtitle (7-10s)
      else if (animationPhase === 2) {
        const progress = animationTime / 3000;

        // Draw hologram background
        ctx!.strokeStyle = `rgba(0, 200, 255, ${0.4})`;
        ctx!.lineWidth = 1.5;
        for (let i = 0; i < 12; i++) {
          const radius = 50 + i * 25;
          const opacity = Math.max(0, 1 - (i / 12) * 0.5);
          ctx!.strokeStyle = `rgba(0, 200, 255, ${opacity * 0.5})`;
          ctx!.beginPath();
          ctx!.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx!.stroke();
        }

        // Draw title with glow
        ctx!.font = 'bold 48px Arial';
        ctx!.fillStyle = `rgba(0, 240, 255, ${0.3 + progress * 0.7})`;
        ctx!.textAlign = 'center';
        ctx!.fillText('IUVFES DIGITAL TWIN LABORATORY', centerX, centerY - 60);

        // Draw subtitle
        ctx!.font = '24px Arial';
        ctx!.fillStyle = `rgba(0, 200, 255, ${0.2 + progress * 0.8})`;
        ctx!.fillText('FUTURE BOTANICAL EXTRACTION TECHNOLOGY', centerX, centerY + 20);
        ctx!.fillText('POWERED BY ARTIFICIAL INTELLIGENCE', centerX, centerY + 55);

        // Draw particles
        particles.forEach((p) => {
          p.x += p.vx * 0.5;
          p.y += p.vy * 0.5;
          p.life -= 0.005;
          
          if (p.life > 0) {
            ctx!.fillStyle = `rgba(0, 240, 255, ${p.life * 0.4})`;
            ctx!.fillRect(p.x - 1, p.y - 1, 2, 2);
          }
        });

        particles.splice(0, particles.length, ...particles.filter(p => p.life > 0));

        if (animationTime >= 3000) {
          animationPhase = 3;
          animationTime = 0;
        }
      }

      // Phase 3: Fade out and transition (10-11s)
      else if (animationPhase === 3) {
        const progress = animationTime / 1000;
        
        ctx!.fillStyle = `rgba(10, 14, 39, ${progress})`;
        ctx!.fillRect(0, 0, canvas.width, canvas.height);

        if (animationTime >= 1000) {
          isAnimating = false;
          setAppState('setup');
        }
      }

      animationTime += 16;
      if (isAnimating) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    const handleSkip = () => {
      isAnimating = false;
      setAppState('setup');
    };

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') handleSkip();
    });

    return () => {
      isAnimating = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleSkip);
    };
  }, [appState]);

  const handleSkip = () => {
    setAppState('setup');
  };

  const handleExperimentStart = (experimentId: string) => {
    setCurrentExperimentId(experimentId);
    setAppState('running');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {appState === 'opening' && (
        <div className="relative w-full h-screen">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
          <button
            onClick={handleSkip}
            className="absolute bottom-8 right-8 px-6 py-2 border-2 border-cyan-400 text-cyan-400 font-mono text-sm hover:bg-cyan-400 hover:text-slate-950 transition-all duration-300 z-10"
          >
            SKIP »
          </button>
        </div>
      )}

      {appState === 'setup' && (
        <div className="w-full h-screen">
          <SetupWizard onComplete={handleExperimentStart} onCancel={() => setAppState('opening')} />
        </div>
      )}

      {appState === 'running' && currentExperimentId && (
        <div className="w-full h-screen">
          <LiveDashboard 
            experimentId={currentExperimentId} 
            onComplete={() => setAppState('dashboard')}
            onCancel={() => setAppState('opening')}
          />
        </div>
      )}

      {appState === 'dashboard' && (
        <div className="w-full h-screen p-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-8">
            IUVFES Digital Twin Laboratory
          </h1>
          <p className="text-cyan-300">Dashboard View</p>
        </div>
      )}
    </div>
  );
}

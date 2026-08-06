import React, { useEffect, useRef } from 'react';

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  color?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
}

/**
 * Animated Gauge Component with smooth needle animation
 * Uses Canvas for smooth SVG-like rendering with high performance
 */
export const AnimatedGauge: React.FC<GaugeProps> = ({
  value,
  min,
  max,
  unit,
  label,
  color = '#00f0ff',
  warningThreshold,
  criticalThreshold,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const currentValueRef = useRef<number>(min);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d' as const);
    if (!ctx) return;

    // Set canvas size
    const size = 200;
    canvas.width = size;
    canvas.height = size;

    // Smooth animation towards target value
    const animate = () => {
      const diff = value - currentValueRef.current;
      if (Math.abs(diff) > 0.1) {
        currentValueRef.current += diff * 0.1; // Smooth easing
      } else {
        currentValueRef.current = value;
      }

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Draw gauge background
      drawGaugeBackground(ctx, size, color);

      // Draw gauge needle
      const percentage = (currentValueRef.current - min) / (max - min);
      drawGaugeNeedle(ctx, size, percentage, color);

      // Draw value text
      ctx.fillStyle = '#e8e8ff';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${currentValueRef.current.toFixed(1)}`, size / 2, size / 2 + 20);

      // Draw unit
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = '#8b8ba8';
      ctx.fillText(unit, size / 2, size / 2 + 40);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, min, max, unit, color]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        className="w-48 h-48 drop-shadow-lg"
        style={{
          filter: `drop-shadow(0 0 10px rgba(0, 240, 255, 0.3))`,
        }}
      />
      <div className="text-center">
        <h3 className="text-sm font-semibold text-cyan-300 glow-text">{label}</h3>
        <p className="text-xs text-gray-400 mt-1">
          Range: {min} - {max} {unit}
        </p>
      </div>
    </div>
  );
};

/**
 * Draw gauge background (arc)
 */
function drawGaugeBackground(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string
) {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 20;

  // Draw outer circle with glow
  ctx.strokeStyle = `rgba(0, 240, 255, 0.2)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw gauge arc (0 to 180 degrees)
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 10, Math.PI, Math.PI * 2, false);
  ctx.stroke();

  // Draw tick marks
  ctx.strokeStyle = `rgba(0, 240, 255, 0.4)`;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const angle = Math.PI + (Math.PI / 10) * i;
    const x1 = centerX + Math.cos(angle) * (radius - 15);
    const y1 = centerY + Math.sin(angle) * (radius - 15);
    const x2 = centerX + Math.cos(angle) * (radius - 5);
    const y2 = centerY + Math.sin(angle) * (radius - 5);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Draw center circle
  ctx.fillStyle = 'rgba(10, 14, 39, 0.8)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Draw gauge needle with smooth animation
 */
function drawGaugeNeedle(
  ctx: CanvasRenderingContext2D,
  size: number,
  percentage: number,
  color: string
) {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 20;

  // Calculate needle angle (0 to 180 degrees)
  const angle = Math.PI + Math.PI * percentage;

  // Draw needle shadow
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(
    centerX + Math.cos(angle) * (radius - 20),
    centerY + Math.sin(angle) * (radius - 20)
  );
  ctx.stroke();

  // Draw needle with glow
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(
    centerX + Math.cos(angle) * (radius - 20),
    centerY + Math.sin(angle) * (radius - 20)
  );
  ctx.stroke();

  // Draw needle glow effect
  ctx.strokeStyle = `rgba(0, 240, 255, 0.3)`;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(
    centerX + Math.cos(angle) * (radius - 20),
    centerY + Math.sin(angle) * (radius - 20)
  );
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * Pressure Gauge Component
 */
export const PressureGauge: React.FC<{ value: number }> = ({ value }) => (
  <AnimatedGauge
    value={value}
    min={0}
    max={1000}
    unit="mbar"
    label="Vacuum Pressure"
    color="#00f0ff"
  />
);

/**
 * Temperature Gauge Component
 */
export const TemperatureGauge: React.FC<{ value: number }> = ({ value }) => (
  <AnimatedGauge
    value={value}
    min={20}
    max={150}
    unit="°C"
    label="Process Temperature"
    color="#ffd700"
  />
);

/**
 * Yield Monitor Component
 */
export const YieldMonitor: React.FC<{ value: number }> = ({ value }) => (
  <AnimatedGauge
    value={value}
    min={0}
    max={100}
    unit="%"
    label="Oil Yield"
    color="#39ff14"
  />
);

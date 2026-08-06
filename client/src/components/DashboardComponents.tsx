import React from 'react';
import { Pause, Play, Square, AlertTriangle } from 'lucide-react';

/**
 * Metric Card Component
 */
interface MetricCardProps {
  label: string;
  value: number | string;
  unit: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  icon,
  trend = 'stable',
  color = 'cyan',
}) => {
  const colorMap = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
    gold: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30',
  };

  const trendIcon = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color as keyof typeof colorMap]} border border-opacity-30 rounded-lg p-4 backdrop-blur-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            <span className="text-sm text-gray-400">{unit}</span>
          </div>
        </div>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>
      <div className="flex items-center justify-between">
        <div className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden mr-2">
          <div
            className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-400`}
            style={{ width: `${Math.min(100, (typeof value === 'number' ? value : 0) / 10)}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
          {trendIcon[trend]}
        </span>
      </div>
    </div>
  );
};

/**
 * Control Panel Component
 */
interface ControlPanelProps {
  isRunning: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onEmergencyStop: () => void;
  onParameterChange?: (param: string, value: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  isPaused,
  onPlay,
  onPause,
  onStop,
  onEmergencyStop,
  onParameterChange,
}) => {
  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-500/30 rounded-lg p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-purple-300 glow-text mb-4">Process Control</h3>

      {/* Control Buttons */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <button
          onClick={onPlay}
          disabled={isRunning && !isPaused}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Play size={16} />
          <span className="text-xs font-semibold">Play</span>
        </button>

        <button
          onClick={onPause}
          disabled={!isRunning || isPaused}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Pause size={16} />
          <span className="text-xs font-semibold">Pause</span>
        </button>

        <button
          onClick={onStop}
          disabled={!isRunning}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Square size={16} />
          <span className="text-xs font-semibold">Stop</span>
        </button>

        <button
          onClick={onEmergencyStop}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/30 transition-all"
        >
          <AlertTriangle size={16} />
          <span className="text-xs font-semibold">E-Stop</span>
        </button>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
        <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-sm text-gray-300">
          Status: {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
        </span>
      </div>
    </div>
  );
};

/**
 * Parameter Slider Component
 */
interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-cyan-300">{label}</label>
        <span className="text-sm text-gray-400">
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Zap,
  Trash2,
  Sliders,
  ShieldAlert,
  Droplets,
  Layers,
  Compass,
  Footprints,
} from 'lucide-react';
import { AlgorithmId, ALGORITHM_REGISTRY } from '../core/runner';
import { MovementMode, HeuristicType } from '../core/types';
import { DrawTool } from './CanvasGrid';
import { PRESET_SCENARIOS } from '../core/presets';

interface ControlsBarProps {
  algorithm: AlgorithmId;
  onSelectAlgorithm: (id: AlgorithmId) => void;
  movement: MovementMode;
  onChangeMovement: (m: MovementMode) => void;
  heuristic: HeuristicType;
  onChangeHeuristic: (h: HeuristicType) => void;
  selectedPreset: string;
  onSelectPreset: (presetId: string) => void;
  drawTool: DrawTool;
  onSelectDrawTool: (tool: DrawTool) => void;
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStepForward: () => void;
  onRunInstant: () => void;
  onResetExploration: () => void;
  onClearBoard: () => void;
  speed: number;
  onChangeSpeed: (s: number) => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  algorithm,
  onSelectAlgorithm,
  movement,
  onChangeMovement,
  heuristic,
  onChangeHeuristic,
  selectedPreset,
  onSelectPreset,
  drawTool,
  onSelectDrawTool,
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStepForward,
  onRunInstant,
  onResetExploration,
  onClearBoard,
  speed,
  onChangeSpeed,
}) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-lg space-y-3">
      {/* Top Row: Algorithm, Scenarios, Movement, Heuristic */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Algorithm Select */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
          <Compass className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-semibold text-slate-300">Algorithm:</span>
          <select
            value={algorithm}
            onChange={(e) => onSelectAlgorithm(e.target.value as AlgorithmId)}
            disabled={isRunning}
            className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer py-1"
          >
            {Object.values(ALGORITHM_REGISTRY).map((algo) => (
              <option key={algo.id} value={algo.id} className="bg-slate-900 text-white">
                {algo.name}
              </option>
            ))}
          </select>
        </div>

        {/* Preset Scenarios */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-slate-300">Preset:</span>
          <select
            value={selectedPreset}
            onChange={(e) => onSelectPreset(e.target.value)}
            disabled={isRunning}
            className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer py-1"
          >
            <option value="custom" className="bg-slate-900 text-white">Custom Map</option>
            {PRESET_SCENARIOS.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Movement Model */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
          <Footprints className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300">Movement:</span>
          <select
            value={movement}
            onChange={(e) => onChangeMovement(e.target.value as MovementMode)}
            disabled={isRunning}
            className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer py-1"
          >
            <option value="4-directional" className="bg-slate-900 text-white">4-Dir (Orthogonal)</option>
            <option value="8-directional" className="bg-slate-900 text-white">8-Dir (Diagonal)</option>
          </select>
        </div>

        {/* Heuristic (for A*, Greedy) */}
        {(algorithm === 'astar' || algorithm === 'greedy') && (
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 animate-fadeIn">
            <span className="text-xs font-semibold text-slate-300">Heuristic:</span>
            <select
              value={heuristic}
              onChange={(e) => onChangeHeuristic(e.target.value as HeuristicType)}
              disabled={isRunning}
              className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer py-1"
            >
              <option value="manhattan" className="bg-slate-900 text-white">Manhattan (L1)</option>
              <option value="octile" className="bg-slate-900 text-white">Octile (Exact 8-Dir)</option>
              <option value="euclidean" className="bg-slate-900 text-white">Euclidean (L2)</option>
              <option value="chebyshev" className="bg-slate-900 text-white">Chebyshev (L∞)</option>
              <option value="zero" className="bg-slate-900 text-white">Zero (h=0, Dijkstra equiv)</option>
            </select>
          </div>
        )}
      </div>

      {/* Bottom Row: Playback Controls, Drawing Tools, Speed Slider */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Visualize</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition active:scale-95"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={onStepForward}
            disabled={!isPaused && isRunning}
            title="Step Forward 1 Node"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          <button
            onClick={onRunInstant}
            disabled={isRunning && !isPaused}
            title="Compute instantly without animation delay"
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Instant</span>
          </button>

          <button
            onClick={onResetExploration}
            title="Clear visualization path & exploration"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={onClearBoard}
            disabled={isRunning}
            title="Clear walls, weights and paths"
            className="flex items-center gap-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-rose-800/60 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Grid</span>
          </button>
        </div>

        {/* Speed Slider */}
        <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1 rounded-lg border border-slate-700">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Speed:</span>
          <input
            type="range"
            min="1"
            max="100"
            value={speed}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
          <span className="text-xs font-mono text-slate-300 w-8">{speed}x</span>
        </div>

        {/* Terrain & Drawing Tools */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onSelectDrawTool('wall')}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition ${
              drawTool === 'wall'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-2.5 h-2.5 bg-slate-800 border border-slate-600 rounded-sm" />
            Wall
          </button>

          <button
            onClick={() => onSelectDrawTool('sand')}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition ${
              drawTool === 'sand'
                ? 'bg-amber-900/60 text-amber-200 border border-amber-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-2.5 h-2.5 bg-amber-700 rounded-sm" />
            Sand (2x)
          </button>

          <button
            onClick={() => onSelectDrawTool('mud')}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition ${
              drawTool === 'mud'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-900 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-2.5 h-2.5 bg-amber-950 rounded-sm" />
            Mud (3x)
          </button>

          <button
            onClick={() => onSelectDrawTool('water')}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition ${
              drawTool === 'water'
                ? 'bg-sky-900/60 text-sky-200 border border-sky-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-3 h-3 text-sky-400" />
            Water (5x)
          </button>

          <button
            onClick={() => onSelectDrawTool('zone')}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition ${
              drawTool === 'zone'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            Hazard (10x)
          </button>

          <button
            onClick={() => onSelectDrawTool('eraser')}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              drawTool === 'eraser'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Eraser
          </button>
        </div>
      </div>
    </div>
  );
};

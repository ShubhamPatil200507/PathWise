import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Zap,
  Trash2,
  Sliders,
  Droplets,
  Eraser,
  Footprints,
  Compass,
  Layers,
  FolderOpen,
} from 'lucide-react';
import { AlgorithmId } from '../core/runner';
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
  onOpenSaveLoad?: () => void;
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
  onOpenSaveLoad,
}) => {
  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 shadow-sm space-y-3">
      {/* Top Controls: Algorithm & Environment Choices */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Algorithm Dropdown */}
        <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs">
          <span className="text-zinc-500 font-medium">Algorithm:</span>
          <select
            value={algorithm}
            onChange={(e) => onSelectAlgorithm(e.target.value as AlgorithmId)}
            disabled={isRunning}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="astar" className="bg-zinc-900 text-white">A* Search (Fast & Optimal)</option>
            <option value="dijkstra" className="bg-zinc-900 text-white">Dijkstra (Guaranteed Shortest)</option>
            <option value="bfs" className="bg-zinc-900 text-white">Breadth-First Search (Unweighted)</option>
            <option value="greedy" className="bg-zinc-900 text-white">Greedy Best-First (Fastest)</option>
            <option value="dlite" className="bg-zinc-900 text-white">D* Lite (Live Replanner)</option>
          </select>
        </div>

        {/* Preset Maps */}
        <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs">
          <span className="text-zinc-500 font-medium">Map:</span>
          <select
            value={selectedPreset}
            onChange={(e) => onSelectPreset(e.target.value)}
            disabled={isRunning}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="custom" className="bg-zinc-900 text-white">Custom (Draw your own)</option>
            <option value="empty-grid" className="bg-zinc-900 text-white">Clear Open Field</option>
            <option value="recursive-maze" className="bg-zinc-900 text-white">Random Maze</option>
            <option value="narrow-corridor" className="bg-zinc-900 text-white">Narrow Tunnel</option>
            <option value="weighted-terrain" className="bg-zinc-900 text-white">Swamp & River (Weighted)</option>
            <option value="multiple-routes" className="bg-zinc-900 text-white">Shortcut vs Detour</option>
            <option value="warehouse-aisle" className="bg-zinc-900 text-white">Warehouse Aisles</option>
          </select>
        </div>

        {/* Movement */}
        <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs">
          <span className="text-zinc-500 font-medium">Movement:</span>
          <select
            value={movement}
            onChange={(e) => onChangeMovement(e.target.value as MovementMode)}
            disabled={isRunning}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="4-directional" className="bg-zinc-900 text-white">4-way (No diagonal)</option>
            <option value="8-directional" className="bg-zinc-900 text-white">8-way (Allow diagonal)</option>
          </select>
        </div>

        {/* Heuristic (for A*, Greedy) */}
        {(algorithm === 'astar' || algorithm === 'greedy') && (
          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs">
            <span className="text-zinc-500 font-medium">Heuristic:</span>
            <select
              value={heuristic}
              onChange={(e) => onChangeHeuristic(e.target.value as HeuristicType)}
              disabled={isRunning}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="manhattan" className="bg-zinc-900 text-white">Manhattan (Grid distance)</option>
              <option value="octile" className="bg-zinc-900 text-white">Octile (Diagonal distance)</option>
              <option value="euclidean" className="bg-zinc-900 text-white">Euclidean (Straight line)</option>
              <option value="zero" className="bg-zinc-900 text-white">Zero (Behaves like Dijkstra)</option>
            </select>
          </div>
        )}
      </div>

      {/* Action Row: Playback & Drawing Tools */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={onStepForward}
            disabled={!isPaused && isRunning}
            title="Step forward 1 cell"
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-medium px-3 py-2 rounded-lg border border-zinc-700 transition"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          <button
            onClick={onRunInstant}
            disabled={isRunning && !isPaused}
            title="Compute instantly without animation"
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Instant</span>
          </button>

          <button
            onClick={onResetExploration}
            title="Clear visualization path"
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium px-3 py-2 rounded-lg border border-zinc-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Path</span>
          </button>

          <button
            onClick={onClearBoard}
            disabled={isRunning}
            title="Clear walls and terrain"
            className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium px-2.5 py-2 rounded-lg border border-zinc-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Grid</span>
          </button>

          {onOpenSaveLoad && (
            <button
              onClick={onOpenSaveLoad}
              title="Save or Load Custom Maps"
              className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium px-2.5 py-2 rounded-lg border border-zinc-800 transition"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Save/Load</span>
            </button>
          )}
        </div>

        {/* Speed Slider */}
        <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs">
          <span className="text-zinc-500">Speed:</span>
          <input
            type="range"
            min="1"
            max="100"
            value={speed}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            className="w-24 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
          <span className="text-zinc-400 font-mono text-[11px] w-8">
            {speed > 80 ? 'Fast' : speed < 30 ? 'Slow' : 'Normal'}
          </span>
        </div>

        {/* Terrain Drawing Tools */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <span className="text-[11px] text-zinc-500 px-1.5">Draw:</span>
          <button
            onClick={() => onSelectDrawTool('wall')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              drawTool === 'wall'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Wall
          </button>

          <button
            onClick={() => onSelectDrawTool('water')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              drawTool === 'water'
                ? 'bg-sky-900/60 text-sky-200 border border-sky-700 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Water (Cost 5)
          </button>

          <button
            onClick={() => onSelectDrawTool('mud')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              drawTool === 'mud'
                ? 'bg-amber-950/80 text-amber-200 border border-amber-800 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Mud (Cost 3)
          </button>

          <button
            onClick={() => onSelectDrawTool('sand')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              drawTool === 'sand'
                ? 'bg-amber-900/50 text-amber-200 border border-amber-700 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sand (Cost 2)
          </button>

          <button
            onClick={() => onSelectDrawTool('eraser')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              drawTool === 'eraser'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Eraser
          </button>
        </div>
      </div>
    </div>
  );
};

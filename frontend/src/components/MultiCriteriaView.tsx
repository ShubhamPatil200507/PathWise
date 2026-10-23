import React, { useState, useMemo } from 'react';
import { Sliders, Compass, Gauge, Zap, AlertTriangle, ShieldCheck, PieChart as PieIcon } from 'lucide-react';
import { GridCell, GridCoord, MovementMode, MultiCriteriaWeights } from '../core/types';
import { runAStar } from '../core/astar';
import { CanvasGrid } from './CanvasGrid';

interface MultiCriteriaViewProps {
  rows: number;
  cols: number;
  grid: GridCell[][];
  start: GridCoord;
  target: GridCoord;
  movement: MovementMode;
}

export const MultiCriteriaView: React.FC<MultiCriteriaViewProps> = ({
  rows,
  cols,
  grid,
  start,
  target,
  movement,
}) => {
  const [weights, setWeights] = useState<MultiCriteriaWeights>({
    alpha: 1.0, // Distance
    beta: 1.0,  // Travel Time
    gamma: 1.0, // Energy
    delta: 1.0, // Risk / Safety
  });

  // Calculate Pareto route based on current weights
  const weightedResult = useMemo(() => {
    return runAStar({
      rows,
      cols,
      grid,
      start,
      target,
      movement,
      multiCriteria: weights,
      recordEvents: false,
    });
  }, [rows, cols, grid, start, target, movement, weights]);

  // Baseline: pure geometric shortest distance (alpha=1, others=0)
  const shortestDistResult = useMemo(() => {
    return runAStar({
      rows,
      cols,
      grid,
      start,
      target,
      movement,
      multiCriteria: { alpha: 1.0, beta: 0.0, gamma: 0.0, delta: 0.0 },
      recordEvents: false,
    });
  }, [rows, cols, grid, start, target, movement]);

  // Safest route: delta=5.0, others=0.1
  const safestResult = useMemo(() => {
    return runAStar({
      rows,
      cols,
      grid,
      start,
      target,
      movement,
      multiCriteria: { alpha: 0.2, beta: 0.2, gamma: 0.2, delta: 5.0 },
      recordEvents: false,
    });
  }, [rows, cols, grid, start, target, movement]);

  const presetProfiles = [
    { name: 'Balanced', w: { alpha: 1.0, beta: 1.0, gamma: 1.0, delta: 1.0 } },
    { name: 'Shortest Distance', w: { alpha: 5.0, beta: 0.2, gamma: 0.2, delta: 0.1 } },
    { name: 'Fastest Transit', w: { alpha: 0.5, beta: 5.0, gamma: 0.5, delta: 0.5 } },
    { name: 'Eco / Low Energy', w: { alpha: 0.5, beta: 0.5, gamma: 5.0, delta: 0.2 } },
    { name: 'Maximum Safety / Low Risk', w: { alpha: 0.2, beta: 0.2, gamma: 0.2, delta: 5.0 } },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            Multi-Criteria Route Optimization Engine
          </h2>
          <p className="text-xs text-slate-400">
            Formulate multi-objective path costs: <code className="text-purple-300 font-mono">C(P) = α·Distance + β·Time + γ·Energy + δ·Risk</code>.
            Adjust coefficients to observe route shifts between treacherous shortcuts and safe detours.
          </p>
        </div>

        {/* Preset profiles */}
        <div className="flex flex-wrap items-center gap-1.5">
          {presetProfiles.map((p) => (
            <button
              key={p.name}
              onClick={() => setWeights(p.w)}
              className="text-xs font-semibold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas viewport */}
        <div className="lg:col-span-3 h-[520px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <CanvasGrid
            rows={rows}
            cols={cols}
            grid={grid}
            start={start}
            target={target}
            visitedNodes={new Set()}
            frontierNodes={new Set()}
            pathNodes={weightedResult.path}
            drawTool="wall"
            isRunning={false}
            onCellClick={() => {}}
            onCellDrag={() => {}}
            onMoveStart={() => {}}
            onMoveTarget={() => {}}
          />
        </div>

        {/* Multi-Criteria Sliders Side Panel */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-brand-400" />
              Weight Coefficients
            </h3>

            {/* Alpha: Distance */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">α (Distance Penalty)</span>
                <span className="font-mono font-bold text-sky-400">{weights.alpha.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={weights.alpha}
                onChange={(e) => setWeights({ ...weights, alpha: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Beta: Time */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">β (Transit Time)</span>
                <span className="font-mono font-bold text-emerald-400">{weights.beta.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={weights.beta}
                onChange={(e) => setWeights({ ...weights, beta: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Gamma: Energy */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">γ (Energy Consumption)</span>
                <span className="font-mono font-bold text-amber-400">{weights.gamma.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={weights.gamma}
                onChange={(e) => setWeights({ ...weights, gamma: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Delta: Risk */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">δ (Risk & Hazard Avoidance)</span>
                <span className="font-mono font-bold text-rose-400">{weights.delta.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={weights.delta}
                onChange={(e) => setWeights({ ...weights, delta: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>

          {/* Multi-Criteria Comparison Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Solution Breakdown</span>
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Optimized Cost:</span>
                <span className="text-purple-400 font-bold">{weightedResult.metrics.pathCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Geometric Distance:</span>
                <span className="text-sky-400 font-bold">{weightedResult.metrics.geometricDistance.toFixed(1)} units</span>
              </div>
              <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Shortest Route Cost:</span>
                <span className="text-slate-300 font-bold">{shortestDistResult.metrics.pathCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

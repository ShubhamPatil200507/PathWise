import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { AlgorithmMetrics } from '../core/types';

interface MetricsCardProps {
  metrics: AlgorithmMetrics | null;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ metrics }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-3">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* Status */}
        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 flex flex-col justify-between">
          <span className="text-[11px] text-zinc-500 font-medium">Result</span>
          {metrics ? (
            metrics.found ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Path Found
              </span>
            ) : (
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 mt-1">
                <XCircle className="w-3.5 h-3.5" /> Blocked
              </span>
            )
          ) : (
            <span className="text-xs text-zinc-500 mt-1">Ready</span>
          )}
        </div>

        {/* Total Cost */}
        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span className="text-[11px] text-zinc-500 font-medium block">Total Cost</span>
          <span className="font-mono text-base font-bold text-purple-400">
            {metrics && metrics.found ? metrics.pathCost.toFixed(1) : '—'}
          </span>
        </div>

        {/* Path Length */}
        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span className="text-[11px] text-zinc-500 font-medium block">Path Length</span>
          <span className="font-mono text-base font-bold text-zinc-200">
            {metrics && metrics.found ? `${metrics.pathLength} steps` : '—'}
          </span>
        </div>

        {/* Cells Checked */}
        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span className="text-[11px] text-zinc-500 font-medium block">Cells Explored</span>
          <span className="font-mono text-base font-bold text-sky-400">
            {metrics ? metrics.nodesExpanded : '—'}
          </span>
        </div>

        {/* Calculation Time */}
        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-zinc-500 font-medium block">Search Time</span>
          <span className="font-mono text-base font-bold text-emerald-400">
            {metrics ? `${metrics.executionTimeMs} ms` : '—'}
          </span>
        </div>
      </div>

      {/* Clean Human Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80 gap-3 px-1">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span>Start (S)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span>Target (T)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700 inline-block" />
            <span>Wall</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-900 border border-sky-700 inline-block" />
            <span>Water (Cost 5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-950 border border-amber-800 inline-block" />
            <span>Mud (Cost 3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500/50 inline-block" />
            <span>Visited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-500 inline-block" />
            <span>Shortest Path</span>
          </div>
        </div>

        <span className="text-[11px] text-zinc-500 hidden md:inline">
          Tip: Click & drag on grid to draw walls. Drag S or T to move them.
        </span>
      </div>
    </div>
  );
};

import React from 'react';
import { Activity, Clock, CheckCircle2, XCircle, Gauge, Route, Database, Sparkles } from 'lucide-react';
import { AlgorithmMetrics } from '../core/types';

interface MetricsCardProps {
  metrics: AlgorithmMetrics | null;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg text-slate-500 text-xs text-center flex items-center justify-center min-h-[90px]">
        Execute an algorithm to view verified performance metrics.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Activity className="w-4 h-4 text-brand-400" />
          <span>Execution Performance Metrics</span>
        </div>
        <div className="flex items-center gap-2">
          {metrics.found ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Path Found
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded-full">
              <XCircle className="w-3 h-3" /> Destination Unreachable
            </span>
          )}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              metrics.isOptimal
                ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                : 'bg-amber-950/80 text-amber-300 border-amber-800'
            }`}
          >
            {metrics.isOptimal ? 'Optimal Cost' : 'Suboptimal'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {/* Path Cost */}
        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Total Path Cost</span>
          <span className="font-mono font-bold text-base text-purple-400">
            {metrics.found ? metrics.pathCost.toFixed(2) : '—'}
          </span>
        </div>

        {/* Path Length */}
        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Path Nodes / Length</span>
          <span className="font-mono font-bold text-base text-slate-200">
            {metrics.found ? `${metrics.pathLength} cells` : '—'}
          </span>
        </div>

        {/* Nodes Expanded */}
        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Nodes Expanded</span>
          <span className="font-mono font-bold text-base text-sky-400">
            {metrics.nodesExpanded}
          </span>
        </div>

        {/* Nodes Discovered */}
        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Nodes Discovered</span>
          <span className="font-mono font-bold text-base text-blue-300">
            {metrics.nodesDiscovered}
          </span>
        </div>

        {/* Max Frontier Size */}
        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Peak Frontier Size</span>
          <span className="font-mono font-bold text-base text-amber-400">
            {metrics.maxFrontierSize}
          </span>
        </div>

        {/* Execution Time */}
        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-center">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Algorithm Runtime</span>
          <span className="font-mono font-bold text-base text-emerald-400">
            {metrics.executionTimeMs} ms
          </span>
        </div>
      </div>
    </div>
  );
};

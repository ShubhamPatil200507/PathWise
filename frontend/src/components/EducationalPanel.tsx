import React from 'react';
import { BookOpen, CheckCircle, Info, Calculator, ListOrdered, GitBranch } from 'lucide-react';
import { AlgorithmId, ALGORITHM_REGISTRY } from '../core/runner';
import { SearchStepEvent } from '../core/types';

interface EducationalPanelProps {
  algorithm: AlgorithmId;
  currentStepEvent?: SearchStepEvent | null;
  stepIndex: number;
  totalSteps: number;
  openSetSize: number;
  closedSetSize: number;
  hoverCoord: { r: number; c: number } | null;
}

export const EducationalPanel: React.FC<EducationalPanelProps> = ({
  algorithm,
  currentStepEvent,
  stepIndex,
  totalSteps,
  openSetSize,
  closedSetSize,
  hoverCoord,
}) => {
  const info = ALGORITHM_REGISTRY[algorithm];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-400" />
          <h3 className="font-semibold text-sm text-slate-100">Educational Inspector</h3>
        </div>
        <span className="text-[11px] font-mono bg-brand-950 text-brand-300 border border-brand-800/80 px-2 py-0.5 rounded-full">
          Step {stepIndex} / {totalSteps}
        </span>
      </div>

      {/* Algorithm Theory & Complexity Card */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">{info.name}</span>
          <span
            className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
              info.guaranteesOptimality
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}
          >
            {info.guaranteesOptimality ? 'Strictly Optimal' : 'Suboptimal / Heuristic'}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{info.description}</p>
        <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400 font-mono">
          <span>Time: <strong className="text-slate-200">{info.timeComplexity}</strong></span>
          <span>Space: <strong className="text-slate-200">{info.spaceComplexity}</strong></span>
        </div>
      </div>

      {/* Real-time State Breakdown */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
            <Calculator className="w-4 h-4 text-purple-400" />
            <span>Real-time Node Evaluation</span>
          </div>

          {currentStepEvent ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Inspected Node</span>
                  <span className="font-mono text-sm font-bold text-white">
                    ({currentStepEvent.coord.r}, {currentStepEvent.coord.c})
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Event Action</span>
                  <span className="font-mono text-xs font-semibold uppercase text-brand-400">
                    {currentStepEvent.type}
                  </span>
                </div>
              </div>

              {/* Mathematical Values */}
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 space-y-1 font-mono text-xs">
                {currentStepEvent.g !== undefined && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">g(n) [Cost from start]:</span>
                    <span className="text-emerald-400 font-bold">{currentStepEvent.g.toFixed(2)}</span>
                  </div>
                )}
                {currentStepEvent.h !== undefined && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">h(n) [Heuristic to goal]:</span>
                    <span className="text-amber-400 font-bold">{currentStepEvent.h.toFixed(2)}</span>
                  </div>
                )}
                {currentStepEvent.f !== undefined && (
                  <div className="flex justify-between items-center border-t border-slate-800 pt-1 text-white">
                    <span className="text-purple-300 font-semibold">f(n) = g + h:</span>
                    <span className="text-purple-400 font-extrabold text-sm">{currentStepEvent.f.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Algorithmic Reason */}
              {currentStepEvent.explanation && (
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
                  <div className="flex items-start gap-1.5 text-xs text-slate-300">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{currentStepEvent.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              Run or step through an algorithm to inspect real-time mathematical state transitions.
            </div>
          )}
        </div>

        {/* Frontier & Explored Counts */}
        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-slate-900/60 p-1.5 rounded">
            <span className="text-[10px] text-slate-400 block">Frontier (Open)</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{openSetSize}</span>
          </div>
          <div className="bg-slate-900/60 p-1.5 rounded">
            <span className="text-[10px] text-slate-400 block">Explored (Closed)</span>
            <span className="font-mono font-bold text-sky-400 text-sm">{closedSetSize}</span>
          </div>
        </div>
      </div>

      {/* Hover Readout */}
      {hoverCoord && (
        <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-mono text-slate-300">
          <span className="text-slate-400">Hover:</span>
          <span>Row: {hoverCoord.r}, Col: {hoverCoord.c}</span>
        </div>
      )}
    </div>
  );
};

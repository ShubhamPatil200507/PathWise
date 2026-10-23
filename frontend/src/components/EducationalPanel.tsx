import React from 'react';
import { Compass, Info, CheckCircle2 } from 'lucide-react';
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

const PLAIN_ENGLISH_EXPLANATIONS: Record<AlgorithmId, { summary: string; howItWorks: string; guarantee: string }> = {
  astar: {
    summary: 'Smart Search (A*)',
    howItWorks: 'A* combines the actual distance traveled with an estimate of how far remains. It aims directly toward the goal like an arrow, exploring far fewer cells than Dijkstra.',
    guarantee: 'Guaranteed to find the shortest possible path as long as the heuristic does not overestimate.',
  },
  dijkstra: {
    summary: "Dijkstra's Algorithm",
    howItWorks: 'Dijkstra expands outward in concentric rings like ripples in a pond. It always checks the closest unexplored cell first.',
    guarantee: 'Guaranteed to find the lowest-cost path, even across tricky terrain like water and mud.',
  },
  bfs: {
    summary: 'Breadth-First Search (BFS)',
    howItWorks: 'BFS checks cells level by level in a simple first-in, first-out queue. It ignores terrain weights like mud or water.',
    guarantee: 'Finds the path with the fewest hops, but not necessarily the lowest total terrain cost.',
  },
  greedy: {
    summary: 'Greedy Best-First Search',
    howItWorks: 'Greedy only looks at estimated distance to the goal. It rushes straight forward and can get stuck behind walls.',
    guarantee: 'Very fast, but does NOT guarantee the shortest path.',
  },
  dlite: {
    summary: 'D* Lite (Dynamic Replanner)',
    howItWorks: 'Designed for robots and game units. When a new wall blocks the active route, D* Lite repairs only the broken section without restarting from scratch.',
    guarantee: 'Guaranteed optimal path with instant real-time rerouting.',
  },
};

export const EducationalPanel: React.FC<EducationalPanelProps> = ({
  algorithm,
  currentStepEvent,
  stepIndex,
  totalSteps,
  openSetSize,
  closedSetSize,
  hoverCoord,
}) => {
  const guide = PLAIN_ENGLISH_EXPLANATIONS[algorithm] || PLAIN_ENGLISH_EXPLANATIONS.astar;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-sky-400" />
          <h3 className="font-semibold text-xs text-zinc-100">Algorithm Inspector</h3>
        </div>
        {totalSteps > 0 && (
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
            Step {stepIndex} of {totalSteps}
          </span>
        )}
      </div>

      {/* Plain English Guide */}
      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">{guide.summary}</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">{guide.howItWorks}</p>
        <div className="pt-1 text-[11px] text-zinc-300 flex items-start gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-snug">{guide.guarantee}</span>
        </div>
      </div>

      {/* Live Step Numbers */}
      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 space-y-2.5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Current Step
          </span>

          {currentStepEvent ? (
            <div className="space-y-2 text-xs">
              <div className="bg-zinc-900 p-2 rounded border border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-400">Examining Cell:</span>
                <span className="font-mono font-bold text-white">
                  Row {currentStepEvent.coord.r}, Col {currentStepEvent.coord.c}
                </span>
              </div>

              <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                {currentStepEvent.g !== undefined && (
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="text-zinc-400">Distance from start (g):</span>
                    <span className="text-emerald-400 font-bold">{currentStepEvent.g.toFixed(1)}</span>
                  </div>
                )}
                {currentStepEvent.h !== undefined && (
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="text-zinc-400">Estimated to goal (h):</span>
                    <span className="text-amber-400 font-bold">{currentStepEvent.h.toFixed(1)}</span>
                  </div>
                )}
                {currentStepEvent.f !== undefined && (
                  <div className="flex justify-between items-center border-t border-zinc-800 pt-1 text-white">
                    <span className="text-purple-300">Total priority score (f):</span>
                    <span className="text-purple-400 font-extrabold">{currentStepEvent.f.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 py-4 text-center leading-relaxed">
              Click <strong className="text-zinc-300">"Start"</strong> or <strong className="text-zinc-300">"Step"</strong> above to watch how this algorithm searches the grid cell by cell.
            </p>
          )}
        </div>

        {/* Counts */}
        <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">Waiting in Queue</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{openSetSize}</span>
          </div>
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">Cells Visited</span>
            <span className="font-mono font-bold text-sky-400 text-sm">{closedSetSize}</span>
          </div>
        </div>
      </div>

      {/* Hover Coordinates Helper */}
      <div className="text-[11px] text-zinc-500 font-mono px-1 flex justify-between">
        <span>Cursor:</span>
        <span>{hoverCoord ? `Row ${hoverCoord.r}, Col ${hoverCoord.c}` : 'Hover over grid'}</span>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Play, Columns2, CheckCircle2, Trophy } from 'lucide-react';
import { GridCell, GridCoord, MovementMode, HeuristicType, PathfindingResult } from '../core/types';
import { AlgorithmId, ALGORITHM_REGISTRY, runAlgorithm } from '../core/runner';
import { CanvasGrid } from './CanvasGrid';

interface ComparisonViewProps {
  rows: number;
  cols: number;
  grid: GridCell[][];
  start: GridCoord;
  target: GridCoord;
  movement: MovementMode;
  heuristic: HeuristicType;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  rows,
  cols,
  grid,
  start,
  target,
  movement,
  heuristic,
}) => {
  const [selectedAlgos, setSelectedAlgos] = useState<AlgorithmId[]>(['astar', 'dijkstra', 'greedy', 'bfs']);
  const [results, setResults] = useState<Record<string, PathfindingResult | null>>({});
  const [hasRun, setHasRun] = useState<boolean>(false);

  const toggleAlgo = (id: AlgorithmId) => {
    if (selectedAlgos.includes(id)) {
      if (selectedAlgos.length > 2) {
        setSelectedAlgos(selectedAlgos.filter((a) => a !== id));
      }
    } else {
      if (selectedAlgos.length < 4) {
        setSelectedAlgos([...selectedAlgos, id]);
      }
    }
  };

  const handleRunAll = () => {
    const newResults: Record<string, PathfindingResult | null> = {};
    for (const algoId of selectedAlgos) {
      const res = runAlgorithm(algoId, {
        rows,
        cols,
        grid,
        start,
        target,
        movement,
        heuristic,
        recordEvents: false,
      });
      newResults[algoId] = res;
    }
    setResults(newResults);
    setHasRun(true);
  };

  const chartData = useMemo(() => {
    return selectedAlgos
      .filter((id) => results[id])
      .map((id) => {
        const r = results[id]!;
        const nameMap: Record<string, string> = {
          astar: 'A* Search',
          dijkstra: 'Dijkstra',
          greedy: 'Greedy',
          bfs: 'BFS',
          dlite: 'D* Lite',
        };
        return {
          name: nameMap[id] || id,
          cellsChecked: r.metrics.nodesExpanded,
          pathCost: r.metrics.pathCost,
          timeMs: r.metrics.executionTimeMs,
        };
      });
  }, [selectedAlgos, results]);

  // Plain English Human Summary
  const humanSummary = useMemo(() => {
    if (!hasRun) return null;
    const astar = results['astar'];
    const dijkstra = results['dijkstra'];
    const greedy = results['greedy'];
    const bfs = results['bfs'];

    const takeaways: string[] = [];

    if (astar && dijkstra) {
      if (astar.metrics.nodesExpanded < dijkstra.metrics.nodesExpanded) {
        const savedPct = Math.round(
          ((dijkstra.metrics.nodesExpanded - astar.metrics.nodesExpanded) /
            dijkstra.metrics.nodesExpanded) *
            100
        );
        takeaways.push(
          `A* was significantly more efficient than Dijkstra: it checked ${savedPct}% fewer cells (${astar.metrics.nodesExpanded} vs ${dijkstra.metrics.nodesExpanded}) while discovering the exact same shortest path cost (${astar.metrics.pathCost.toFixed(1)}).`
        );
      }
    }

    if (greedy && astar) {
      if (greedy.metrics.pathCost > astar.metrics.pathCost) {
        takeaways.push(
          `Greedy rushed straight toward the target and finished fast, but took an expensive detour (cost ${greedy.metrics.pathCost.toFixed(1)} vs optimal ${astar.metrics.pathCost.toFixed(1)}).`
        );
      } else {
        takeaways.push(
          `Greedy found a direct path quickly with only ${greedy.metrics.nodesExpanded} cells checked because there were no complex obstacles in its direct line of sight.`
        );
      }
    }

    if (bfs && dijkstra) {
      if (bfs.metrics.pathCost > dijkstra.metrics.pathCost) {
        takeaways.push(
          `BFS does not understand terrain weights: it picked a route through expensive water or mud (cost ${bfs.metrics.pathCost.toFixed(1)}) because it only counts edge hops.`
        );
      }
    }

    return takeaways;
  }, [results, hasRun]);

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Columns2 className="w-4 h-4 text-sky-400" />
            Compare Algorithms on the Same Map
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Test how different algorithms behave under identical obstacles and terrain costs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 mr-1">Select:</span>
          {(['astar', 'dijkstra', 'greedy', 'bfs'] as AlgorithmId[]).map((id) => {
            const isSelected = selectedAlgos.includes(id);
            const labelMap: Record<string, string> = {
              astar: 'A* Search',
              dijkstra: 'Dijkstra',
              greedy: 'Greedy',
              bfs: 'BFS',
            };
            return (
              <button
                key={id}
                onClick={() => toggleAlgo(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  isSelected
                    ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {labelMap[id]}
              </button>
            );
          })}

          <button
            onClick={handleRunAll}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition active:scale-95 ml-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Compare Now</span>
          </button>
        </div>
      </div>

      {/* Synchronized Maps */}
      <div className={`grid gap-4 ${selectedAlgos.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'}`}>
        {selectedAlgos.map((algoId) => {
          const res = results[algoId];
          const visitedSet = new Set(res ? res.visitedOrder.map((c) => `${c.r},${c.c}`) : []);
          const pathList = res ? res.path : [];

          return (
            <div key={algoId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                <span className="font-semibold text-xs text-white">{ALGORITHM_REGISTRY[algoId].name}</span>
                {res && (
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60">
                    {res.metrics.executionTimeMs} ms
                  </span>
                )}
              </div>

              {/* Map viewport */}
              <div className="h-60 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                <CanvasGrid
                  rows={rows}
                  cols={cols}
                  grid={grid}
                  start={start}
                  target={target}
                  visitedNodes={visitedSet}
                  frontierNodes={new Set()}
                  pathNodes={pathList}
                  drawTool="wall"
                  isRunning={false}
                  onCellClick={() => {}}
                  onCellDrag={() => {}}
                  onMoveStart={() => {}}
                  onMoveTarget={() => {}}
                />
              </div>

              {/* Quick Numbers */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-center pt-1">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block">Total Cost</span>
                  <span className="text-purple-400 font-bold">{res ? res.metrics.pathCost.toFixed(1) : '—'}</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block">Cells Checked</span>
                  <span className="text-sky-400 font-bold">{res ? res.metrics.nodesExpanded : '—'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Charts */}
      {hasRun && chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cells Checked */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-200">
              Cells Checked (Fewer is better)
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="cellsChecked" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Cells Checked" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Path Cost */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-200">
              Path Cost (Lower is better)
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="pathCost" fill="#c084fc" radius={[4, 4, 0, 0]} name="Total Cost" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Plain English Takeaways */}
      {humanSummary && humanSummary.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>Summary & Key Takeaways</span>
          </div>
          <div className="space-y-1.5 text-xs text-zinc-300 leading-relaxed">
            {humanSummary.map((item, idx) => (
              <p key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{item}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

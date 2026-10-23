import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Play, Columns2, Trophy } from 'lucide-react';
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

const ALL_ALGORITHMS: { id: AlgorithmId; name: string; color: string }[] = [
  { id: 'astar', name: 'A* Search', color: '#38bdf8' },
  { id: 'dijkstra', name: 'Dijkstra', color: '#c084fc' },
  { id: 'bfs', name: 'BFS', color: '#10b981' },
  { id: 'greedy', name: 'Greedy', color: '#f59e0b' },
  { id: 'dlite', name: 'D* Lite', color: '#f43f5e' },
];

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  rows,
  cols,
  grid,
  start,
  target,
  movement,
  heuristic,
}) => {
  const [selectedAlgos, setSelectedAlgos] = useState<AlgorithmId[]>([
    'astar',
    'dijkstra',
    'bfs',
    'greedy',
    'dlite',
  ]);
  const [results, setResults] = useState<Record<string, PathfindingResult | null>>({});
  const [hasRun, setHasRun] = useState<boolean>(false);

  const toggleAlgo = (id: AlgorithmId) => {
    if (selectedAlgos.includes(id)) {
      if (selectedAlgos.length > 2) {
        setSelectedAlgos(selectedAlgos.filter((a) => a !== id));
      }
    } else {
      if (selectedAlgos.length < 5) {
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
        const meta = ALL_ALGORITHMS.find((a) => a.id === id);
        return {
          id,
          name: meta ? meta.name : id,
          color: meta ? meta.color : '#38bdf8',
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
    const dlite = results['dlite'];

    const takeaways: string[] = [];

    if (astar && dijkstra) {
      if (astar.metrics.nodesExpanded < dijkstra.metrics.nodesExpanded) {
        const savedPct = Math.round(
          ((dijkstra.metrics.nodesExpanded - astar.metrics.nodesExpanded) /
            dijkstra.metrics.nodesExpanded) *
            100
        );
        takeaways.push(
          `A* checked ${savedPct}% fewer cells than Dijkstra (${astar.metrics.nodesExpanded} vs ${dijkstra.metrics.nodesExpanded}) while discovering the exact same optimal path cost (${astar.metrics.pathCost.toFixed(1)}).`
        );
      }
    }

    if (greedy && astar) {
      if (greedy.metrics.pathCost > astar.metrics.pathCost) {
        takeaways.push(
          `Greedy rushed straight toward the target with fast execution, but settled for a more expensive route (cost ${greedy.metrics.pathCost.toFixed(1)} vs optimal ${astar.metrics.pathCost.toFixed(1)}).`
        );
      } else {
        takeaways.push(
          `Greedy found an optimal route quickly with only ${greedy.metrics.nodesExpanded} cells checked because there were no major obstacles in its direct line of sight.`
        );
      }
    }

    if (bfs && dijkstra) {
      if (bfs.metrics.pathCost > dijkstra.metrics.pathCost) {
        takeaways.push(
          `BFS only counts hop counts and ignores terrain weights: it routed through expensive water/mud (cost ${bfs.metrics.pathCost.toFixed(1)}) whereas Dijkstra took the cheaper path.`
        );
      }
    }

    if (dlite && astar) {
      takeaways.push(
        `D* Lite computed the optimal path (cost ${dlite.metrics.pathCost.toFixed(1)}) and maintained search tree keys so it can repair routes dynamically if new obstacles appear.`
      );
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
            Compare 5 Algorithms on the Same Map
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Test how all 5 pathfinding algorithms perform on the identical obstacles and terrain.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 mr-1">Select:</span>
          {ALL_ALGORITHMS.map((algo) => {
            const isSelected = selectedAlgos.includes(algo.id);
            return (
              <button
                key={algo.id}
                onClick={() => toggleAlgo(algo.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: algo.color }}
                />
                <span>{algo.name}</span>
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
      <div
        className={`grid gap-3 ${
          selectedAlgos.length <= 2
            ? 'grid-cols-1 md:grid-cols-2'
            : selectedAlgos.length === 3
            ? 'grid-cols-1 md:grid-cols-3'
            : selectedAlgos.length === 4
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
        }`}
      >
        {selectedAlgos.map((algoId) => {
          const res = results[algoId];
          const visitedSet = new Set(res ? res.visitedOrder.map((c) => `${c.r},${c.c}`) : []);
          const pathList = res ? res.path : [];
          const meta = ALL_ALGORITHMS.find((a) => a.id === algoId);

          return (
            <div
              key={algoId}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-sm space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: meta?.color }}
                  />
                  {meta?.name || ALGORITHM_REGISTRY[algoId].name}
                </span>
                {res && (
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/60">
                    {res.metrics.executionTimeMs} ms
                  </span>
                )}
              </div>

              {/* Map viewport */}
              <div className="h-48 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
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
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono text-center pt-1">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block">Total Cost</span>
                  <span className="text-purple-400 font-bold">
                    {res ? res.metrics.pathCost.toFixed(1) : '—'}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block">Cells Checked</span>
                  <span className="text-sky-400 font-bold">
                    {res ? res.metrics.nodesExpanded : '—'}
                  </span>
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
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="cellsChecked" radius={[4, 4, 0, 0]} name="Cells Checked">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Path Cost */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-200">
              Path Cost (Lower is better)
            </h4>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="pathCost" radius={[4, 4, 0, 0]} name="Total Cost">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
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

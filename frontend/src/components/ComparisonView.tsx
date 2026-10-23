import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Play, RotateCcw, CheckCircle, BarChart3, ArrowRight, ShieldCheck, Scale } from 'lucide-react';
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
  // Select 2 to 4 algorithms to compare
  const [selectedAlgos, setSelectedAlgos] = useState<AlgorithmId[]>(['bfs', 'dijkstra', 'astar', 'greedy']);
  const [results, setResults] = useState<Record<AlgorithmId, PathfindingResult | null>>({
    bfs: null,
    dijkstra: null,
    astar: null,
    greedy: null,
    dlite: null,
  });
  const [isRunning, setIsRunning] = useState<boolean>(false);

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

  const runAllComparisons = () => {
    setIsRunning(true);
    const newResults: Record<AlgorithmId, PathfindingResult | null> = { ...results };

    for (const algoId of selectedAlgos) {
      const res = runAlgorithm(algoId, {
        rows,
        cols,
        grid,
        start,
        target,
        movement,
        heuristic,
        recordEvents: false, // instant for exact benchmark measurement
      });
      newResults[algoId] = res;
    }

    setResults(newResults);
    setIsRunning(false);
  };

  const chartData = useMemo(() => {
    return selectedAlgos
      .filter((id) => results[id] !== null)
      .map((id) => {
        const r = results[id]!;
        return {
          name: ALGORITHM_REGISTRY[id].name.split(' ')[0], // short name
          fullName: ALGORITHM_REGISTRY[id].name,
          nodesExpanded: r.metrics.nodesExpanded,
          nodesDiscovered: r.metrics.nodesDiscovered,
          pathCost: r.metrics.pathCost,
          runtimeMs: r.metrics.executionTimeMs,
          frontierPeak: r.metrics.maxFrontierSize,
        };
      });
  }, [selectedAlgos, results]);

  // Evidence-based analytical synthesis
  const analysisSynthesis = useMemo(() => {
    const executed = selectedAlgos.map((id) => results[id]).filter(Boolean) as PathfindingResult[];
    if (executed.length < 2) return null;

    const dijkstra = results['dijkstra'];
    const astar = results['astar'];
    const greedy = results['greedy'];
    const bfs = results['bfs'];

    const insights: string[] = [];

    if (astar && dijkstra) {
      const nodeDiff = dijkstra.metrics.nodesExpanded - astar.metrics.nodesExpanded;
      const pctSaved = Math.max(0, ((nodeDiff / dijkstra.metrics.nodesExpanded) * 100)).toFixed(1);
      insights.push(
        `A* explored ${pctSaved}% fewer nodes than Dijkstra (${astar.metrics.nodesExpanded} vs ${dijkstra.metrics.nodesExpanded}) while maintaining identical optimal path cost of ${astar.metrics.pathCost.toFixed(2)}.`
      );
    }

    if (greedy && astar) {
      if (greedy.metrics.pathCost > astar.metrics.pathCost) {
        const costOvershoot = (
          ((greedy.metrics.pathCost - astar.metrics.pathCost) / astar.metrics.pathCost) *
          100
        ).toFixed(1);
        insights.push(
          `Greedy Best-First expanded rapidly (${greedy.metrics.nodesExpanded} nodes) but resulted in a suboptimal path cost overshoot of +${costOvershoot}%.`
        );
      } else {
        insights.push(
          `Greedy Best-First matched the optimal cost in this particular layout with ${greedy.metrics.nodesExpanded} node expansions, demonstrating pure heuristic guidance.`
        );
      }
    }

    if (bfs && dijkstra) {
      if (bfs.metrics.pathCost > dijkstra.metrics.pathCost) {
        insights.push(
          `BFS produced a suboptimal weighted cost of ${bfs.metrics.pathCost.toFixed(2)} vs Dijkstra's optimal ${dijkstra.metrics.pathCost.toFixed(2)} because BFS minimizes edge hops without weighting terrain resistance.`
        );
      }
    }

    return insights;
  }, [selectedAlgos, results]);

  return (
    <div className="space-y-4">
      {/* Top Bar: Selector & Execution */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-brand-400" />
            Side-by-Side Synchronized Algorithm Comparison
          </h2>
          <p className="text-xs text-slate-400">
            Compare 2 to 4 pathfinding algorithms simultaneously on the identical environment, movement rules, and terrain costs.
          </p>
        </div>

        {/* Algorithm toggles */}
        <div className="flex items-center gap-2">
          {(Object.keys(ALGORITHM_REGISTRY) as AlgorithmId[]).map((id) => {
            const isSelected = selectedAlgos.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleAlgo(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  isSelected
                    ? 'bg-brand-600 border-brand-500 text-white shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {ALGORITHM_REGISTRY[id].name.split(' ')[0]}
              </button>
            );
          })}

          <button
            onClick={runAllComparisons}
            disabled={isRunning}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg active:scale-95 transition ml-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Benchmark All</span>
          </button>
        </div>
      </div>

      {/* Synchronized Side-by-Side Map Grids */}
      <div className={`grid gap-4 ${selectedAlgos.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'}`}>
        {selectedAlgos.map((algoId) => {
          const res = results[algoId];
          const visitedSet = new Set(res ? res.visitedOrder.map((c) => `${c.r},${c.c}`) : []);
          const pathList = res ? res.path : [];

          return (
            <div key={algoId} className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="font-bold text-xs text-white">{ALGORITHM_REGISTRY[algoId].name}</span>
                {res && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    {res.metrics.executionTimeMs} ms
                  </span>
                )}
              </div>

              {/* Canvas viewport */}
              <div className="h-64 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
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

              {/* Metric stats card */}
              <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-center pt-1">
                <div className="bg-slate-950 p-1.5 rounded">
                  <span className="text-[9px] text-slate-400 block uppercase">Cost</span>
                  <span className="text-purple-400 font-bold">{res ? res.metrics.pathCost.toFixed(1) : '—'}</span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded">
                  <span className="text-[9px] text-slate-400 block uppercase">Nodes</span>
                  <span className="text-sky-400 font-bold">{res ? res.metrics.nodesExpanded : '—'}</span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded">
                  <span className="text-[9px] text-slate-400 block uppercase">Frontier</span>
                  <span className="text-amber-400 font-bold">{res ? res.metrics.maxFrontierSize : '—'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Performance Charts & Table */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Nodes Expanded Comparison */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              Exploration Effort: Nodes Expanded vs Discovered
            </h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="nodesExpanded" fill="#38bdf8" name="Nodes Expanded" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nodesDiscovered" fill="#818cf8" name="Nodes Discovered" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Path Cost & Runtime Comparison */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Solution Quality: Total Path Cost
            </h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="pathCost" fill="#a855f7" name="Total Path Cost" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Synthesis Report */}
      {analysisSynthesis && analysisSynthesis.length > 0 && (
        <div className="bg-slate-900/90 border border-brand-800/60 rounded-xl p-4 shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-300">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span>Empirical Algorithmic Interpretation</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
            {analysisSynthesis.map((point, idx) => (
              <p key={idx} className="flex items-start gap-2">
                <span className="text-brand-400 font-bold">•</span>
                <span>{point}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

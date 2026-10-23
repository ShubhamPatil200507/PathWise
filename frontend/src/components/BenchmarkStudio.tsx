import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Play, Download, CheckCircle, BarChart3, Database, Layers, Sparkles, Loader2 } from 'lucide-react';
import { AlgorithmId, ALGORITHM_REGISTRY, runAlgorithm } from '../core/runner';
import { generateRandomMap } from '../core/presets';
import { MovementMode } from '../core/types';

interface BenchmarkRunRecord {
  algorithm: string;
  gridSize: number;
  density: number;
  repetition: number;
  found: boolean;
  pathCost: number;
  nodesExpanded: number;
  nodesDiscovered: number;
  executionTimeMs: number;
}

export const BenchmarkStudio: React.FC = () => {
  const [selectedAlgos, setSelectedAlgos] = useState<AlgorithmId[]>(['dijkstra', 'astar', 'greedy']);
  const [gridSizes, setGridSizes] = useState<number[]>([15, 25, 35]);
  const [densities, setDensities] = useState<number[]>([0.1, 0.25, 0.35]);
  const [repetitions, setRepetitions] = useState<number>(3);
  const [movement, setMovement] = useState<MovementMode>('4-directional');

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [records, setRecords] = useState<BenchmarkRunRecord[]>([]);

  const toggleAlgo = (id: AlgorithmId) => {
    if (selectedAlgos.includes(id)) {
      if (selectedAlgos.length > 1) {
        setSelectedAlgos(selectedAlgos.filter((a) => a !== id));
      }
    } else {
      setSelectedAlgos([...selectedAlgos, id]);
    }
  };

  const handleRunBenchmarks = async () => {
    setIsRunning(true);
    const totalRuns = gridSizes.length * densities.length * repetitions * selectedAlgos.length;
    setProgress({ current: 0, total: totalRuns });

    const newRecords: BenchmarkRunRecord[] = [];
    let completed = 0;

    // Run synchronously in batches with requestAnimationFrame to prevent browser freezing
    for (const size of gridSizes) {
      const start = { r: 1, c: 1 };
      const target = { r: size - 2, c: size - 2 };

      for (const density of densities) {
        for (let rep = 1; rep <= repetitions; rep++) {
          // Generate deterministic pseudo-random map
          const grid = generateRandomMap(size, size, density, 0.1, start, target);

          for (const algoId of selectedAlgos) {
            const res = runAlgorithm(algoId, {
              rows: size,
              cols: size,
              grid,
              start,
              target,
              movement,
              recordEvents: false,
            });

            newRecords.push({
              algorithm: ALGORITHM_REGISTRY[algoId].name,
              gridSize: size,
              density,
              repetition: rep,
              found: res.metrics.found,
              pathCost: res.metrics.pathCost,
              nodesExpanded: res.metrics.nodesExpanded,
              nodesDiscovered: res.metrics.nodesDiscovered,
              executionTimeMs: res.metrics.executionTimeMs,
            });

            completed++;
            setProgress({ current: completed, total: totalRuns });
          }

          // Yield UI thread
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    }

    setRecords(newRecords);
    setIsRunning(false);
  };

  // Aggregated data: Runtime vs Grid Size
  const runtimeVsGridSize = useMemoDataByField(records, 'gridSize', 'executionTimeMs');

  // Aggregated data: Nodes Expanded vs Obstacle Density
  const nodesVsDensity = useMemoDataByField(records, 'density', 'nodesExpanded');

  // Export results as CSV
  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = [
      'Algorithm',
      'GridSize',
      'ObstacleDensity',
      'Repetition',
      'PathFound',
      'PathCost',
      'NodesExpanded',
      'NodesDiscovered',
      'ExecutionTimeMs',
    ];
    const rows = records.map((r) => [
      `"${r.algorithm}"`,
      r.gridSize,
      r.density,
      r.repetition,
      r.found,
      r.pathCost,
      r.nodesExpanded,
      r.nodesDiscovered,
      r.executionTimeMs,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pathwise_benchmark_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            Empirical Benchmark Studio & Algorithmic Evaluation
          </h2>
          <p className="text-xs text-slate-400">
            Execute repeatable scientific experiments across systematically varying grid dimensions, obstacle densities, and repetitions. All measurements are collected in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={handleRunBenchmarks}
            disabled={isRunning}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg active:scale-95 transition"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running ({progress.current}/{progress.total})...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute Benchmark Suite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Experimental Setup Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* Algorithms */}
        <div className="space-y-2">
          <span className="font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">Algorithms</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(ALGORITHM_REGISTRY) as AlgorithmId[]).map((id) => (
              <button
                key={id}
                onClick={() => toggleAlgo(id)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                  selectedAlgos.includes(id)
                    ? 'bg-brand-600 text-white border-brand-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {ALGORITHM_REGISTRY[id].name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Sizes */}
        <div className="space-y-2">
          <span className="font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">Grid Dimensions</span>
          <div className="flex items-center gap-2">
            {[15, 25, 35, 50].map((sz) => (
              <label key={sz} className="flex items-center gap-1 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gridSizes.includes(sz)}
                  onChange={(e) => {
                    if (e.target.checked) setGridSizes([...gridSizes, sz]);
                    else if (gridSizes.length > 1) setGridSizes(gridSizes.filter((s) => s !== sz));
                  }}
                  className="rounded bg-slate-800 text-brand-600 focus:ring-0"
                />
                <span>{sz}x{sz}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Obstacle Densities */}
        <div className="space-y-2">
          <span className="font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">Obstacle Densities</span>
          <div className="flex items-center gap-2">
            {[0.1, 0.25, 0.35, 0.45].map((d) => (
              <label key={d} className="flex items-center gap-1 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={densities.includes(d)}
                  onChange={(e) => {
                    if (e.target.checked) setDensities([...densities, d]);
                    else if (densities.length > 1) setDensities(densities.filter((x) => x !== d));
                  }}
                  className="rounded bg-slate-800 text-brand-600 focus:ring-0"
                />
                <span>{d * 100}%</span>
              </label>
            ))}
          </div>
        </div>

        {/* Repetitions */}
        <div className="space-y-2">
          <span className="font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">Repetitions per Condition</span>
          <select
            value={repetitions}
            onChange={(e) => setRepetitions(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-white rounded p-1.5 w-full font-mono"
          >
            <option value="1">1 Run (Fast)</option>
            <option value="3">3 Runs (Recommended)</option>
            <option value="5">5 Runs (Statistically Rigorous)</option>
          </select>
        </div>
      </div>

      {/* Measurement Charts */}
      {records.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Runtime vs Grid Size */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
            <h4 className="text-xs font-bold text-slate-200">Execution Runtime (ms) vs Grid Dimension</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={runtimeVsGridSize} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="x" stroke="#64748b" fontSize={11} label={{ value: 'Grid Dimension (N×N)', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {selectedAlgos.map((algo, i) => {
                    const name = ALGORITHM_REGISTRY[algo].name;
                    const colors = ['#38bdf8', '#818cf8', '#f59e0b', '#10b981', '#ec4899'];
                    return (
                      <Line
                        key={algo}
                        type="monotone"
                        dataKey={name}
                        stroke={colors[i % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Nodes vs Density */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
            <h4 className="text-xs font-bold text-slate-200">Nodes Expanded vs Obstacle Density</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nodesVsDensity} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="x" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {selectedAlgos.map((algo, i) => {
                    const name = ALGORITHM_REGISTRY[algo].name;
                    const colors = ['#38bdf8', '#818cf8', '#f59e0b', '#10b981', '#ec4899'];
                    return (
                      <Bar
                        key={algo}
                        dataKey={name}
                        fill={colors[i % colors.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
          Click <strong className="text-slate-300">"Execute Benchmark Suite"</strong> above to run statistical evaluations across varying graph scales.
        </div>
      )}
    </div>
  );
};

// Helper to pivot and average data for Recharts
function useMemoDataByField(records: BenchmarkRunRecord[], groupField: 'gridSize' | 'density', metricField: 'executionTimeMs' | 'nodesExpanded') {
  return React.useMemo(() => {
    if (records.length === 0) return [];

    const distinctX = Array.from(new Set(records.map((r) => r[groupField]))).sort((a, b) => a - b);
    const algorithms = Array.from(new Set(records.map((r) => r.algorithm)));

    return distinctX.map((xVal) => {
      const row: any = { x: groupField === 'density' ? `${(Number(xVal) * 100).toFixed(0)}%` : `${xVal}×${xVal}` };

      for (const algo of algorithms) {
        const matches = records.filter((r) => r[groupField] === xVal && r.algorithm === algo);
        if (matches.length > 0) {
          const avg = matches.reduce((sum, m) => sum + m[metricField], 0) / matches.length;
          row[algo] = Number(avg.toFixed(2));
        }
      }
      return row;
    });
  }, [records, groupField, metricField]);
}

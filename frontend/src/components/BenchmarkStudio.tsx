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
import { Play, Download, Gauge, Loader2 } from 'lucide-react';
import { AlgorithmId, runAlgorithm } from '../core/runner';
import { generateRandomMap } from '../core/presets';

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

const ALGO_OPTIONS: { id: AlgorithmId; name: string; color: string }[] = [
  { id: 'astar', name: 'A*', color: '#38bdf8' },
  { id: 'dijkstra', name: 'Dijkstra', color: '#c084fc' },
  { id: 'bfs', name: 'BFS', color: '#10b981' },
  { id: 'greedy', name: 'Greedy', color: '#f59e0b' },
  { id: 'dlite', name: 'D* Lite', color: '#f43f5e' },
];

export const BenchmarkStudio: React.FC = () => {
  const [selectedAlgos, setSelectedAlgos] = useState<AlgorithmId[]>([
    'astar',
    'dijkstra',
    'bfs',
    'greedy',
    'dlite',
  ]);
  const [gridSizes, setGridSizes] = useState<number[]>([15, 25, 35]);
  const [densities, setDensities] = useState<number[]>([0.1, 0.25, 0.35]);
  const [repetitions, setRepetitions] = useState<number>(3);

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

    for (const size of gridSizes) {
      const start = { r: 1, c: 1 };
      const target = { r: size - 2, c: size - 2 };

      for (const density of densities) {
        for (let rep = 1; rep <= repetitions; rep++) {
          const grid = generateRandomMap(size, size, density, 0.1, start, target);

          for (const algoId of selectedAlgos) {
            const meta = ALGO_OPTIONS.find((a) => a.id === algoId);
            const res = runAlgorithm(algoId, {
              rows: size,
              cols: size,
              grid,
              start,
              target,
              movement: '4-directional',
              recordEvents: false,
            });

            newRecords.push({
              algorithm: meta ? meta.name : algoId,
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

          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      }
    }

    setRecords(newRecords);
    setIsRunning(false);
  };

  const runtimeData = useMemoPivotedData(records, 'gridSize', 'executionTimeMs');
  const cellsCheckedData = useMemoPivotedData(records, 'density', 'nodesExpanded');

  const activeAlgoNames = React.useMemo(() => {
    return Array.from(new Set(records.map((r) => r.algorithm)));
  }, [records]);

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = [
      'Algorithm',
      'GridSize',
      'ObstacleDensity',
      'Repetition',
      'PathFound',
      'PathCost',
      'CellsChecked',
      'TimeMs',
    ];
    const rows = records.map((r) => [
      `"${r.algorithm}"`,
      r.gridSize,
      r.density,
      r.repetition,
      r.found,
      r.pathCost,
      r.nodesExpanded,
      r.executionTimeMs,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pathwise_5_algos_benchmark_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-sky-400" />
            Algorithm Speed & Efficiency Test (5 Algorithms)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Test and benchmark A*, Dijkstra, BFS, Greedy, and D* Lite across different map sizes and densities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium px-3 py-2 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download CSV</span>
            </button>
          )}

          <button
            onClick={handleRunBenchmarks}
            disabled={isRunning}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Testing ({progress.current}/{progress.total})...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Speed Test</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Settings */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {/* Algorithms */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-zinc-400 block">Algorithms to test:</span>
          <div className="flex flex-wrap gap-1.5">
            {ALGO_OPTIONS.map((algo) => (
              <button
                key={algo.id}
                onClick={() => toggleAlgo(algo.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition flex items-center gap-1.5 ${
                  selectedAlgos.includes(algo.id)
                    ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                    : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ backgroundColor: algo.color }}
                />
                <span>{algo.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Map Sizes */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-zinc-400 block">Grid sizes:</span>
          <div className="flex items-center gap-3">
            {[15, 25, 35].map((sz) => (
              <label key={sz} className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gridSizes.includes(sz)}
                  onChange={(e) => {
                    if (e.target.checked) setGridSizes([...gridSizes, sz]);
                    else if (gridSizes.length > 1) setGridSizes(gridSizes.filter((s) => s !== sz));
                  }}
                  className="rounded bg-zinc-800 text-sky-500 focus:ring-0"
                />
                <span>{sz}×{sz}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Repetitions */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-zinc-400 block">Runs per size:</span>
          <select
            value={repetitions}
            onChange={(e) => setRepetitions(Number(e.target.value))}
            className="bg-zinc-950 border border-zinc-800 text-white rounded p-1.5 w-full text-xs"
          >
            <option value="1">1 run (Fast)</option>
            <option value="3">3 runs (Average)</option>
          </select>
        </div>
      </div>

      {/* Results Charts */}
      {records.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Runtime */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm space-y-2">
            <h4 className="text-xs font-semibold text-zinc-200">Execution Time (ms) vs Map Size</h4>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={runtimeData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="x" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {activeAlgoNames.map((algo) => {
                    const meta = ALGO_OPTIONS.find((a) => a.name === algo);
                    return (
                      <Line
                        key={algo}
                        type="monotone"
                        dataKey={algo}
                        stroke={meta?.color || '#38bdf8'}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cells Checked */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm space-y-2">
            <h4 className="text-xs font-semibold text-zinc-200">Cells Explored vs Obstacle Density</h4>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cellsCheckedData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="x" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {activeAlgoNames.map((algo) => {
                    const meta = ALGO_OPTIONS.find((a) => a.name === algo);
                    return (
                      <Bar
                        key={algo}
                        dataKey={algo}
                        fill={meta?.color || '#38bdf8'}
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
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-10 text-center text-zinc-500 text-xs">
          Click <strong className="text-zinc-300">"Run Speed Test"</strong> above to see how all 5 algorithms (A*, Dijkstra, BFS, Greedy, D* Lite) compare.
        </div>
      )}
    </div>
  );
};

function useMemoPivotedData(
  records: BenchmarkRunRecord[],
  groupField: 'gridSize' | 'density',
  metricField: 'executionTimeMs' | 'nodesExpanded'
) {
  return React.useMemo(() => {
    if (records.length === 0) return [];

    const distinctX = Array.from(new Set(records.map((r) => r[groupField]))).sort((a, b) => a - b);
    const algorithms = Array.from(new Set(records.map((r) => r.algorithm)));

    return distinctX.map((xVal) => {
      const row: any = {
        x: groupField === 'density' ? `${(Number(xVal) * 100).toFixed(0)}% walls` : `${xVal}×${xVal}`,
      };

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

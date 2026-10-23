import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Zap, ShieldAlert, AlertTriangle, ArrowRight, Activity, CheckCircle, Split } from 'lucide-react';
import { GridCell, GridCoord, MovementMode } from '../core/types';
import { DStarLiteEngine } from '../core/dlite';
import { runAStar } from '../core/astar';
import { CanvasGrid } from './CanvasGrid';
import { coordKey } from '../core/grid';

interface DynamicReplanningViewProps {
  rows: number;
  cols: number;
  grid: GridCell[][];
  start: GridCoord;
  target: GridCoord;
  movement: MovementMode;
}

export const DynamicReplanningView: React.FC<DynamicReplanningViewProps> = ({
  rows,
  cols,
  grid: initialGrid,
  start,
  target,
  movement,
}) => {
  const [currentGrid, setCurrentGrid] = useState<GridCell[][]>(() =>
    initialGrid.map((row) => row.map((cell) => ({ ...cell })))
  );

  const [activePath, setActivePath] = useState<GridCoord[]>([]);
  const [ghostPath, setGhostPath] = useState<GridCoord[]>([]);
  const [changedCellsCount, setChangedCellsCount] = useState<number>(0);

  const [dliteTimeMs, setDliteTimeMs] = useState<number | null>(null);
  const [scratchTimeMs, setScratchTimeMs] = useState<number | null>(null);
  const [dliteNodes, setDliteNodes] = useState<number>(0);
  const [scratchNodes, setScratchNodes] = useState<number>(0);

  const dliteEngineRef = useRef<DStarLiteEngine | null>(null);

  // Initialize D* Lite Engine
  useEffect(() => {
    const engine = new DStarLiteEngine(rows, cols, currentGrid, start, target, movement);
    dliteEngineRef.current = engine;
    const initialRes = engine.runInitialSearch();
    setActivePath(initialRes.path);
    setGhostPath([]);
    setChangedCellsCount(0);
    setDliteTimeMs(initialRes.metrics.executionTimeMs);
    setDliteNodes(initialRes.metrics.nodesExpanded);
  }, [rows, cols, start, target, movement]);

  // Block a cell directly on the active path
  const handleBlockActivePath = () => {
    if (activePath.length <= 2 || !dliteEngineRef.current) return;

    // Pick middle node along active path
    const midIdx = Math.floor(activePath.length / 2);
    const targetNode = activePath[midIdx];

    handleCellToggle(targetNode);
  };

  const handleCellToggle = (coord: GridCoord) => {
    if (!dliteEngineRef.current) return;
    const isWall = currentGrid[coord.r][coord.c].type === 'wall';
    const newType = isWall ? 'empty' : 'wall';
    const newWeight = isWall ? 1.0 : Infinity;

    // Save previous path as ghost path
    setGhostPath([...activePath]);

    // Update local grid copy
    const newGrid = currentGrid.map((row) => row.map((cell) => ({ ...cell })));
    newGrid[coord.r][coord.c].type = newType;
    newGrid[coord.r][coord.c].weight = newWeight;
    setCurrentGrid(newGrid);
    setChangedCellsCount((prev) => prev + 1);

    // 1. Run incremental replanning with D* Lite
    const replanRes = dliteEngineRef.current.replanAfterChange([
      { r: coord.r, c: coord.c, newType, newWeight },
    ]);
    setActivePath(replanRes.path);
    setDliteTimeMs(replanRes.replanningTimeMs);
    setDliteNodes(dliteEngineRef.current.nodesExpanded);

    // 2. Run scratch search from scratch with A* for direct scientific comparison!
    const scratchRes = runAStar({
      rows,
      cols,
      grid: newGrid,
      start,
      target,
      movement,
      recordEvents: false,
    });
    setScratchTimeMs(scratchRes.metrics.executionTimeMs);
    setScratchNodes(scratchRes.metrics.nodesExpanded);
  };

  const speedup =
    scratchTimeMs !== null && dliteTimeMs !== null && dliteTimeMs > 0
      ? (scratchTimeMs / dliteTimeMs).toFixed(1)
      : '1.0';

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            Dynamic Environmental Invalidation & Incremental Replanning (D* Lite)
          </h2>
          <p className="text-xs text-slate-400">
            Click on any grid cell (or block the current route) to dynamically introduce obstacles. D* Lite reuses previous search trees rather than recomputing from scratch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBlockActivePath}
            disabled={activePath.length <= 2}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Block Path Midpoint</span>
          </button>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 h-[520px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <CanvasGrid
            rows={rows}
            cols={cols}
            grid={currentGrid}
            start={start}
            target={target}
            visitedNodes={new Set()}
            frontierNodes={new Set()}
            pathNodes={activePath}
            ghostPath={ghostPath}
            drawTool="wall"
            isRunning={false}
            onCellClick={(coord) => handleCellToggle(coord)}
            onCellDrag={() => {}}
            onMoveStart={() => {}}
            onMoveTarget={() => {}}
          />
        </div>

        {/* Dynamic Analytics Side Panel */}
        <div className="space-y-3 flex flex-col justify-between">
          {/* Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Replanning Status</span>
            {activePath.length > 0 ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Valid Alternate Route Found</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Route Completely Blocked</span>
              </div>
            )}
            <div className="text-xs text-slate-400 pt-1 border-t border-slate-800">
              Total Environmental Changes: <strong className="text-white font-mono">{changedCellsCount}</strong>
            </div>
          </div>

          {/* D* Lite vs Scratch A* Comparison */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Split className="w-4 h-4 text-brand-400" />
              Replanning Efficiency Metric
            </span>

            <div className="space-y-2">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs">
                <span className="text-slate-400 block text-[10px] uppercase">D* Lite (Incremental)</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-amber-400 font-bold">{dliteTimeMs ?? '—'} ms</span>
                  <span className="text-slate-400 text-[11px]">{dliteNodes} nodes updated</span>
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs">
                <span className="text-slate-400 block text-[10px] uppercase">Scratch A* (Recomputed)</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-purple-400 font-bold">{scratchTimeMs ?? '—'} ms</span>
                  <span className="text-slate-400 text-[11px]">{scratchNodes} nodes re-evaluated</span>
                </div>
              </div>
            </div>

            {/* Speedup badge */}
            <div className="bg-brand-950/70 border border-brand-800/80 p-2.5 rounded-lg text-center">
              <span className="text-[10px] uppercase tracking-wider text-brand-300 block">Incremental Responsiveness</span>
              <span className="font-mono font-extrabold text-lg text-brand-400">
                {speedup}x Efficiency
              </span>
            </div>
          </div>

          {/* Legend Guide */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-[11px] space-y-1.5 text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-sm" />
              <span>Active Replanned Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500/40 border border-rose-500 rounded-sm" />
              <span>Invalidated Ghost Path (Previous)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

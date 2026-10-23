import React, { useRef, useEffect, useCallback } from 'react';
import { CellType, GridCell, GridCoord } from '../core/types';
import { coordsEqual, coordKey } from '../core/grid';

export type DrawTool = 'wall' | 'eraser' | 'mud' | 'sand' | 'water' | 'zone' | 'move-start' | 'move-target';

interface CanvasGridProps {
  rows: number;
  cols: number;
  grid: GridCell[][];
  start: GridCoord;
  target: GridCoord;
  visitedNodes: Set<string>;
  frontierNodes: Set<string>;
  pathNodes: GridCoord[];
  currentActiveNode?: GridCoord | null;
  drawTool: DrawTool;
  isRunning: boolean;
  onCellClick: (coord: GridCoord, tool: DrawTool) => void;
  onCellDrag: (coord: GridCoord, tool: DrawTool) => void;
  onHoverCell?: (coord: GridCoord | null) => void;
  onMoveStart: (newStart: GridCoord) => void;
  onMoveTarget: (newTarget: GridCoord) => void;
  ghostPath?: GridCoord[]; // For dynamic replanning: shows previous path in ghosted style!
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({
  rows,
  cols,
  grid,
  start,
  target,
  visitedNodes,
  frontierNodes,
  pathNodes,
  currentActiveNode,
  drawTool,
  isRunning,
  onCellClick,
  onCellDrag,
  onHoverCell,
  onMoveStart,
  onMoveTarget,
  ghostPath,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const draggingNodeTypeRef = useRef<'start' | 'target' | null>(null);

  // Fast set lookup for path coordinates
  const pathSet = new Set(pathNodes.map(coordKey));
  const ghostSet = new Set(ghostPath ? ghostPath.map(coordKey) : []);

  const getCellFromMouse = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): GridCoord | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cellW = rect.width / cols;
      const cellH = rect.height / rows;

      const c = Math.floor(x / cellW);
      const r = Math.floor(y / cellH);

      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        return { r, c };
      }
      return null;
    },
    [rows, cols]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#090d16'; // deep navy/black
    ctx.fillRect(0, 0, width, height);

    const cellW = width / cols;
    const cellH = height / rows;

    // Draw all cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW;
        const y = r * cellH;
        const cell = grid[r][c];
        const key = `${r},${c}`;
        const isStart = coordsEqual({ r, c }, start);
        const isTarget = coordsEqual({ r, c }, target);
        const isWall = cell.type === 'wall';
        const isPath = pathSet.has(key);
        const isGhostPath = ghostSet.has(key) && !isPath;
        const isFrontier = frontierNodes.has(key);
        const isVisited = visitedNodes.has(key);
        const isActive = currentActiveNode && coordsEqual({ r, c }, currentActiveNode);

        // 1. Base Terrain / Cell color
        if (isWall) {
          ctx.fillStyle = '#1e293b'; // slate-800
        } else if (cell.type === 'sand') {
          ctx.fillStyle = '#78350f'; // amber-900 (sand)
        } else if (cell.type === 'mud') {
          ctx.fillStyle = '#451a03'; // warm brown (mud)
        } else if (cell.type === 'water') {
          ctx.fillStyle = '#0369a1'; // sky-700 (water)
        } else if (cell.type === 'zone') {
          ctx.fillStyle = '#831843'; // pink-900 / hazard
        } else {
          ctx.fillStyle = '#0f172a'; // slate-900 (empty)
        }
        ctx.fillRect(x, y, cellW, cellH);

        // 2. Exploration states (Visited / Frontier overlay)
        if (!isStart && !isTarget && !isWall) {
          if (isPath) {
            ctx.fillStyle = 'rgba(168, 85, 247, 0.85)'; // purple-500
            ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
          } else if (isGhostPath) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.35)'; // red ghosted
            ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
          } else if (isActive) {
            ctx.fillStyle = '#ec4899'; // pink-500 active
            ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
          } else if (isFrontier) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.75)'; // amber-500
            ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
          } else if (isVisited) {
            ctx.fillStyle = 'rgba(14, 165, 233, 0.55)'; // sky-500
            ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
          }
        }

        // 3. Grid line borders
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)'; // slate-700 subtle
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellW, cellH);

        // 4. Terrain icons / markers for weighted cells if large enough
        if (cellW > 14 && !isWall && !isStart && !isTarget) {
          if (cell.type !== 'empty') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = `${Math.max(9, Math.floor(cellH * 0.45))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const weightLabel = cell.weight.toString();
            ctx.fillText(weightLabel, x + cellW / 2, y + cellH / 2);
          }
        }

        // 5. Start and Target Nodes
        if (isStart) {
          ctx.fillStyle = '#10b981'; // emerald-500
          ctx.beginPath();
          ctx.arc(x + cellW / 2, y + cellH / 2, Math.min(cellW, cellH) * 0.38, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // S label
          if (cellW > 12) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(10, Math.floor(cellH * 0.5))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('S', x + cellW / 2, y + cellH / 2);
          }
        } else if (isTarget) {
          ctx.fillStyle = '#ef4444'; // red-500
          ctx.beginPath();
          ctx.arc(x + cellW / 2, y + cellH / 2, Math.min(cellW, cellH) * 0.38, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // T label
          if (cellW > 12) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(10, Math.floor(cellH * 0.5))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('T', x + cellW / 2, y + cellH / 2);
          }
        }
      }
    }

    // Draw connected path line ribbon over cells for visual elegance
    if (pathNodes.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#c084fc'; // purple-400
      ctx.lineWidth = Math.max(2, Math.min(cellW, cellH) * 0.25);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < pathNodes.length; i++) {
        const p = pathNodes[i];
        const px = p.c * cellW + cellW / 2;
        const py = p.r * cellH + cellH / 2;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }, [
    rows,
    cols,
    grid,
    start,
    target,
    visitedNodes,
    frontierNodes,
    pathSet,
    ghostSet,
    pathNodes,
    currentActiveNode,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRunning) return;
    const coord = getCellFromMouse(e);
    if (!coord) return;

    isMouseDownRef.current = true;

    // Check if clicking start or target to drag
    if (coordsEqual(coord, start)) {
      draggingNodeTypeRef.current = 'start';
      return;
    }
    if (coordsEqual(coord, target)) {
      draggingNodeTypeRef.current = 'target';
      return;
    }

    draggingNodeTypeRef.current = null;
    onCellClick(coord, drawTool);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coord = getCellFromMouse(e);
    if (onHoverCell) onHoverCell(coord);

    if (!isMouseDownRef.current || !coord || isRunning) return;

    if (draggingNodeTypeRef.current === 'start') {
      if (!coordsEqual(coord, target) && grid[coord.r][coord.c].type !== 'wall') {
        onMoveStart(coord);
      }
      return;
    }

    if (draggingNodeTypeRef.current === 'target') {
      if (!coordsEqual(coord, start) && grid[coord.r][coord.c].type !== 'wall') {
        onMoveTarget(coord);
      }
      return;
    }

    // Normal drawing
    if (!coordsEqual(coord, start) && !coordsEqual(coord, target)) {
      onCellDrag(coord, drawTool);
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    draggingNodeTypeRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          isMouseDownRef.current = false;
          draggingNodeTypeRef.current = null;
          if (onHoverCell) onHoverCell(null);
        }}
        className="w-full h-full cursor-crosshair block select-none"
      />
    </div>
  );
};

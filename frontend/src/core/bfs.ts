import { AlgorithmRunnerOptions, PathfindingResult, SearchStepEvent } from './types';
import { coordKey, coordsEqual, getValidNeighbors, reconstructPath } from './grid';

/**
 * Breadth-First Search (BFS)
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 * Optimality: Optimal for unweighted graphs (shortest edge-count path).
 * Suboptimal when edge weights / terrain costs differ.
 */
export function runBFS(options: AlgorithmRunnerOptions): PathfindingResult {
  const { rows, cols, grid, start, target, movement, recordEvents = true } = options;

  const startTime = performance.now();

  const queue: { r: number; c: number }[] = [];
  const visited = new Set<string>();
  const parents = new Map<string, { r: number; c: number }>();
  const visitedOrder: { r: number; c: number }[] = [];
  const stepEvents: SearchStepEvent[] = [];

  let nodesExpanded = 0;
  let nodesDiscovered = 1;
  let maxFrontierSize = 1;
  let found = false;
  let stepCount = 0;

  const startKey = coordKey(start);
  queue.push(start);
  visited.add(startKey);

  if (recordEvents) {
    stepEvents.push({
      step: ++stepCount,
      type: 'frontier',
      coord: start,
      explanation: `Initialized BFS with start node (${start.r}, ${start.c}) in FIFO queue.`,
    });
  }

  while (queue.length > 0) {
    if (queue.length > maxFrontierSize) {
      maxFrontierSize = queue.length;
    }

    const current = queue.shift()!;
    nodesExpanded++;
    visitedOrder.push(current);

    if (recordEvents) {
      stepEvents.push({
        step: ++stepCount,
        type: 'expand',
        coord: current,
        parent: parents.get(coordKey(current)) || null,
        explanation: `Dequeued node (${current.r}, ${current.c}). Total nodes expanded: ${nodesExpanded}.`,
      });
    }

    if (coordsEqual(current, target)) {
      found = true;
      break;
    }

    const neighbors = getValidNeighbors(grid, rows, cols, current, movement);

    for (const neighbor of neighbors) {
      const nCoord = neighbor.coord;
      const nKey = coordKey(nCoord);

      if (!visited.has(nKey)) {
        visited.add(nKey);
        parents.set(nKey, current);
        queue.push(nCoord);
        nodesDiscovered++;

        if (recordEvents) {
          stepEvents.push({
            step: ++stepCount,
            type: 'frontier',
            coord: nCoord,
            parent: current,
            explanation: `Discovered unvisited neighbor (${nCoord.r}, ${nCoord.c}). Added to FIFO queue.`,
          });
        }
      }
    }
  }

  const endTime = performance.now();
  const executionTimeMs = +(endTime - startTime).toFixed(3);

  const { path, cost, geometricDistance } = found
    ? reconstructPath(parents, start, target, grid)
    : { path: [], cost: 0, geometricDistance: 0 };

  if (recordEvents && found) {
    for (const p of path) {
      stepEvents.push({
        step: ++stepCount,
        type: 'path',
        coord: p,
      });
    }
  }

  // BFS is optimal only if all edge costs are uniform 1.0 (unweighted)
  const isOptimal = false; // Generally suboptimal in weighted terrains

  return {
    metrics: {
      algorithm: 'Breadth-First Search (BFS)',
      found,
      pathCost: +cost.toFixed(3),
      pathLength: path.length,
      geometricDistance: +geometricDistance.toFixed(3),
      nodesExpanded,
      nodesDiscovered,
      maxFrontierSize,
      executionTimeMs,
      isOptimal,
    },
    path,
    visitedOrder,
    stepEvents,
  };
}

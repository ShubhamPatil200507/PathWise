import { AlgorithmRunnerOptions, PathfindingResult, SearchStepEvent } from './types';
import { BinaryHeap } from './BinaryHeap';
import { calculateHeuristic } from './heuristics';
import { coordKey, coordsEqual, getValidNeighbors, reconstructPath } from './grid';

/**
 * Greedy Best-First Search
 * Evaluation function: f(n) = h(n)
 * Optimality: NOT optimal. May find paths quickly by greedily following heuristic,
 * but frequently chooses suboptimal detours or gets trapped behind concave obstacles.
 */
export function runGreedyBestFirst(options: AlgorithmRunnerOptions): PathfindingResult {
  const {
    rows,
    cols,
    grid,
    start,
    target,
    movement,
    heuristic = movement === '8-directional' ? 'octile' : 'manhattan',
    multiCriteria,
    recordEvents = true,
  } = options;

  const startTime = performance.now();

  const openSet = new BinaryHeap<{ r: number; c: number }>();
  const parents = new Map<string, { r: number; c: number }>();
  const closedSet = new Set<string>();
  const visitedOrder: { r: number; c: number }[] = [];
  const stepEvents: SearchStepEvent[] = [];

  let nodesExpanded = 0;
  let nodesDiscovered = 1;
  let maxFrontierSize = 1;
  let found = false;
  let stepCount = 0;

  const startH = calculateHeuristic(start, target, heuristic, 1.0);
  openSet.push(start, startH);

  if (recordEvents) {
    stepEvents.push({
      step: ++stepCount,
      type: 'frontier',
      coord: start,
      h: startH,
      f: startH,
      explanation: `Initialized Greedy Best-First: Start node (${start.r}, ${start.c}) inserted with heuristic h=${startH.toFixed(2)}.`,
    });
  }

  while (!openSet.isEmpty()) {
    if (openSet.size() > maxFrontierSize) {
      maxFrontierSize = openSet.size();
    }

    const { item: current, priority: currentH } = openSet.pop()!;
    const currKey = coordKey(current);

    if (closedSet.has(currKey)) continue;

    closedSet.add(currKey);
    nodesExpanded++;
    visitedOrder.push(current);

    if (recordEvents) {
      stepEvents.push({
        step: ++stepCount,
        type: 'expand',
        coord: current,
        h: currentH,
        f: currentH,
        parent: parents.get(currKey) || null,
        explanation: `Greedily selected node (${current.r}, ${current.c}) with lowest remaining heuristic distance h=${currentH.toFixed(2)}.`,
      });
    }

    if (coordsEqual(current, target)) {
      found = true;
      break;
    }

    const neighbors = getValidNeighbors(grid, rows, cols, current, movement, multiCriteria);

    for (const neighbor of neighbors) {
      const nCoord = neighbor.coord;
      const nKey = coordKey(nCoord);

      if (!closedSet.has(nKey) && !parents.has(nKey)) {
        parents.set(nKey, current);
        const h = calculateHeuristic(nCoord, target, heuristic, 1.0);
        openSet.push(nCoord, h);
        nodesDiscovered++;

        if (recordEvents) {
          stepEvents.push({
            step: ++stepCount,
            type: 'frontier',
            coord: nCoord,
            parent: current,
            h,
            f: h,
            explanation: `Discovered neighbor (${nCoord.r}, ${nCoord.c}) with heuristic h=${h.toFixed(2)}. Added to priority queue.`,
          });
        }
      }
    }
  }

  const endTime = performance.now();
  const executionTimeMs = +(endTime - startTime).toFixed(3);

  const { path, cost, geometricDistance } = found
    ? reconstructPath(parents, start, target, grid, multiCriteria)
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

  return {
    metrics: {
      algorithm: 'Greedy Best-First Search',
      found,
      pathCost: +cost.toFixed(3),
      pathLength: path.length,
      geometricDistance: +geometricDistance.toFixed(3),
      nodesExpanded,
      nodesDiscovered,
      maxFrontierSize,
      executionTimeMs,
      isOptimal: false, // Greedy search does NOT guarantee optimal path cost!
    },
    path,
    visitedOrder,
    stepEvents,
  };
}

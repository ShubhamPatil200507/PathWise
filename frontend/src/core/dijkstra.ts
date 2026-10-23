import { AlgorithmRunnerOptions, PathfindingResult, SearchStepEvent } from './types';
import { BinaryHeap } from './BinaryHeap';
import { coordKey, coordsEqual, getValidNeighbors, reconstructPath } from './grid';

/**
 * Dijkstra's Shortest Path Algorithm
 * Time Complexity: O((V + E) log V) using Min-Heap
 * Space Complexity: O(V)
 * Optimality: Strictly optimal for all graphs with non-negative edge weights (w(e) >= 0).
 */
export function runDijkstra(options: AlgorithmRunnerOptions): PathfindingResult {
  const { rows, cols, grid, start, target, movement, multiCriteria, recordEvents = true } = options;

  const startTime = performance.now();

  const pq = new BinaryHeap<{ r: number; c: number; cost: number }>();
  const dist = new Map<string, number>();
  const parents = new Map<string, { r: number; c: number }>();
  const closedSet = new Set<string>();
  const visitedOrder: { r: number; c: number }[] = [];
  const stepEvents: SearchStepEvent[] = [];

  let nodesExpanded = 0;
  let nodesDiscovered = 1;
  let maxFrontierSize = 1;
  let found = false;
  let stepCount = 0;

  const startKey = coordKey(start);
  dist.set(startKey, 0);
  pq.push({ ...start, cost: 0 }, 0);

  if (recordEvents) {
    stepEvents.push({
      step: ++stepCount,
      type: 'frontier',
      coord: start,
      g: 0,
      f: 0,
      explanation: `Initialized Dijkstra: Start node (${start.r}, ${start.c}) with distance g=0 inserted into Min-Heap.`,
    });
  }

  while (!pq.isEmpty()) {
    if (pq.size() > maxFrontierSize) {
      maxFrontierSize = pq.size();
    }

    const { item: current, priority: currentDist } = pq.pop()!;
    const currKey = coordKey(current);

    // Stale entry check (lazy deletion)
    if (closedSet.has(currKey)) continue;
    if (currentDist > (dist.get(currKey) ?? Infinity)) continue;

    closedSet.add(currKey);
    nodesExpanded++;
    visitedOrder.push(current);

    if (recordEvents) {
      stepEvents.push({
        step: ++stepCount,
        type: 'expand',
        coord: current,
        g: currentDist,
        f: currentDist,
        parent: parents.get(currKey) || null,
        explanation: `Extracted minimum-distance node (${current.r}, ${current.c}) from Min-Heap with finalized optimal cost g=${currentDist.toFixed(2)}.`,
      });
    }

    // Target reached: Because Dijkstra extracts nodes in strictly non-decreasing order of cost,
    // the first time the target is extracted, its distance is guaranteed to be optimal!
    if (coordsEqual(current, target)) {
      found = true;
      break;
    }

    const neighbors = getValidNeighbors(grid, rows, cols, current, movement, multiCriteria);

    for (const neighbor of neighbors) {
      const nCoord = neighbor.coord;
      const nKey = coordKey(nCoord);

      if (closedSet.has(nKey)) continue;

      const altDist = currentDist + neighbor.cost;
      const prevDist = dist.get(nKey) ?? Infinity;

      if (altDist < prevDist) {
        dist.set(nKey, altDist);
        parents.set(nKey, current);
        pq.push({ ...nCoord, cost: altDist }, altDist);

        if (prevDist === Infinity) {
          nodesDiscovered++;
        }

        if (recordEvents) {
          stepEvents.push({
            step: ++stepCount,
            type: 'relax',
            coord: nCoord,
            parent: current,
            g: altDist,
            f: altDist,
            explanation: `Relaxed edge (${current.r},${current.c}) -> (${nCoord.r},${nCoord.c}): Improved distance from ${prevDist === Infinity ? '∞' : prevDist.toFixed(2)} to ${altDist.toFixed(2)}.`,
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
      algorithm: "Dijkstra's Algorithm",
      found,
      pathCost: +cost.toFixed(3),
      pathLength: path.length,
      geometricDistance: +geometricDistance.toFixed(3),
      nodesExpanded,
      nodesDiscovered,
      maxFrontierSize,
      executionTimeMs,
      isOptimal: true, // Mathematically guaranteed optimal for non-negative weights
    },
    path,
    visitedOrder,
    stepEvents,
  };
}

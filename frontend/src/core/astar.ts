import { AlgorithmRunnerOptions, PathfindingResult, SearchStepEvent } from './types';
import { BinaryHeap } from './BinaryHeap';
import { calculateHeuristic } from './heuristics';
import { coordKey, coordsEqual, getValidNeighbors, reconstructPath } from './grid';

/**
 * A* Search Algorithm
 * Evaluation function: f(n) = g(n) + h(n)
 * Time Complexity: O(b^d) where b is branching factor and d is solution depth
 * Optimality: Strictly optimal when heuristic h(n) is admissible and consistent.
 */
export function runAStar(options: AlgorithmRunnerOptions): PathfindingResult {
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

  // Find minimum terrain weight in grid to scale heuristic ensuring strict admissibility: h(n) <= h*(n)
  let minTerrainCost = 1.0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type !== 'wall' && grid[r][c].weight < minTerrainCost) {
        minTerrainCost = grid[r][c].weight;
      }
    }
  }

  const openSet = new BinaryHeap<{ r: number; c: number }>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
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
  const startH = calculateHeuristic(start, target, heuristic, minTerrainCost);

  gScore.set(startKey, 0);
  fScore.set(startKey, startH);
  // Push with primary priority f(n), tie-breaker secondary priority h(n)
  openSet.push(start, startH, startH);

  if (recordEvents) {
    stepEvents.push({
      step: ++stepCount,
      type: 'frontier',
      coord: start,
      g: 0,
      h: startH,
      f: startH,
      explanation: `Initialized A*: Start node (${start.r}, ${start.c}) placed in Open Set with g=0, h=${startH.toFixed(2)}, f=${startH.toFixed(2)}.`,
    });
  }

  while (!openSet.isEmpty()) {
    if (openSet.size() > maxFrontierSize) {
      maxFrontierSize = openSet.size();
    }

    const { item: current } = openSet.pop()!;
    const currKey = coordKey(current);

    // Stale node check: if already closed, ignore
    if (closedSet.has(currKey)) continue;

    closedSet.add(currKey);
    nodesExpanded++;
    visitedOrder.push(current);

    const currG = gScore.get(currKey) ?? Infinity;
    const currH = calculateHeuristic(current, target, heuristic, minTerrainCost);
    const currF = fScore.get(currKey) ?? (currG + currH);

    if (recordEvents) {
      stepEvents.push({
        step: ++stepCount,
        type: 'expand',
        coord: current,
        g: currG,
        h: currH,
        f: currF,
        parent: parents.get(currKey) || null,
        explanation: `Selected lowest f(n) node (${current.r}, ${current.c}): g=${currG.toFixed(2)} + h=${currH.toFixed(2)} = f=${currF.toFixed(2)}.`,
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

      if (closedSet.has(nKey)) continue;

      const tentativeG = currG + neighbor.cost;
      const prevG = gScore.get(nKey) ?? Infinity;

      if (tentativeG < prevG) {
        parents.set(nKey, current);
        gScore.set(nKey, tentativeG);
        const h = calculateHeuristic(nCoord, target, heuristic, minTerrainCost);
        const f = tentativeG + h;
        fScore.set(nKey, f);

        // Tie-breaker: lower h means closer to target
        openSet.push(nCoord, f, h);

        if (prevG === Infinity) {
          nodesDiscovered++;
        }

        if (recordEvents) {
          stepEvents.push({
            step: ++stepCount,
            type: 'relax',
            coord: nCoord,
            parent: current,
            g: tentativeG,
            h,
            f,
            explanation: `Inspected neighbor (${nCoord.r}, ${nCoord.c}): tentative g=${tentativeG.toFixed(2)} < previous ${prevG === Infinity ? '∞' : prevG.toFixed(2)}. Updated f=${f.toFixed(2)}.`,
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
      algorithm: `A* Search (${heuristic.toUpperCase()})`,
      found,
      pathCost: +cost.toFixed(3),
      pathLength: path.length,
      geometricDistance: +geometricDistance.toFixed(3),
      nodesExpanded,
      nodesDiscovered,
      maxFrontierSize,
      executionTimeMs,
      isOptimal: true, // Admissible & consistent heuristic guarantees optimality
    },
    path,
    visitedOrder,
    stepEvents,
  };
}

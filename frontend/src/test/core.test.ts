import { describe, it, expect } from 'vitest';
import { BinaryHeap } from '../core/BinaryHeap';
import { calculateHeuristic } from '../core/heuristics';
import { createEmptyGrid, getValidNeighbors, reconstructPath, coordsEqual } from '../core/grid';
import { runBFS } from '../core/bfs';
import { runDijkstra } from '../core/dijkstra';
import { runAStar } from '../core/astar';
import { runGreedyBestFirst } from '../core/greedy';
import { DStarLiteEngine } from '../core/dlite';

describe('BinaryHeap (Min Priority Queue)', () => {
  it('should pop elements in ascending priority order', () => {
    const heap = new BinaryHeap<string>();
    heap.push('item-30', 30);
    heap.push('item-10', 10);
    heap.push('item-20', 20);
    heap.push('item-5', 5);

    expect(heap.size()).toBe(4);
    expect(heap.peek()?.priority).toBe(5);

    expect(heap.pop()?.item).toBe('item-5');
    expect(heap.pop()?.item).toBe('item-10');
    expect(heap.pop()?.item).toBe('item-20');
    expect(heap.pop()?.item).toBe('item-30');
    expect(heap.isEmpty()).toBe(true);
  });

  it('should break ties using secondary priority', () => {
    const heap = new BinaryHeap<string>();
    heap.push('high-sec', 10, 50);
    heap.push('low-sec', 10, 10);

    const first = heap.pop();
    expect(first?.item).toBe('low-sec');
  });
});

describe('Heuristics & Admissibility', () => {
  const a = { r: 0, c: 0 };
  const b = { r: 3, c: 4 };

  it('calculates Manhattan distance correctly', () => {
    const h = calculateHeuristic(a, b, 'manhattan');
    expect(h).toBe(7); // 3 + 4 = 7
  });

  it('calculates Octile distance correctly', () => {
    const h = calculateHeuristic(a, b, 'octile');
    // dx=4, dy=3 -> min=3, max=4 -> 3 * sqrt(2) + 1 = 3 * 1.41421356 + 1 = 5.2426...
    expect(h).toBeCloseTo(3 * Math.SQRT2 + 1, 3);
  });

  it('returns zero for zero heuristic', () => {
    expect(calculateHeuristic(a, b, 'zero')).toBe(0);
  });
});

describe('Grid Movement & Corner-Cutting Prevention', () => {
  it('generates 4 orthogonal neighbors in center of empty grid', () => {
    const grid = createEmptyGrid(5, 5);
    const neighbors = getValidNeighbors(grid, 5, 5, { r: 2, c: 2 }, '4-directional');
    expect(neighbors.length).toBe(4);
  });

  it('strictly prevents diagonal corner-cutting through walls', () => {
    const grid = createEmptyGrid(5, 5);
    // Block both adjacent cells: (1, 2) and (2, 3)
    grid[1][2].type = 'wall';
    grid[2][3].type = 'wall';

    // Trying to move diagonally from (2, 2) to (1, 3) must be forbidden!
    const neighbors = getValidNeighbors(grid, 5, 5, { r: 2, c: 2 }, '8-directional');
    const hasDiagonalCut = neighbors.some(n => n.coord.r === 1 && n.coord.c === 3);
    expect(hasDiagonalCut).toBe(false);
  });
});

describe('Algorithm Correctness Tests', () => {
  it('BFS finds optimal edge-count path on unweighted grid', () => {
    const grid = createEmptyGrid(10, 10);
    const start = { r: 1, c: 1 };
    const target = { r: 1, c: 6 };

    const res = runBFS({
      rows: 10,
      cols: 10,
      grid,
      start,
      target,
      movement: '4-directional',
    });

    expect(res.metrics.found).toBe(true);
    expect(res.path.length).toBe(6); // 1,1 -> 1,2 -> 1,3 -> 1,4 -> 1,5 -> 1,6
    expect(res.metrics.pathCost).toBe(5);
  });

  it("Dijkstra and A* (Zero Heuristic) find identical optimal cost", () => {
    const grid = createEmptyGrid(10, 10);
    // Add terrain weights
    grid[1][2].type = 'mud';
    grid[1][2].weight = 3;
    grid[1][3].type = 'water';
    grid[1][3].weight = 5;

    const start = { r: 1, c: 1 };
    const target = { r: 1, c: 5 };

    const dijkstraRes = runDijkstra({
      rows: 10,
      cols: 10,
      grid,
      start,
      target,
      movement: '4-directional',
    });

    const astarZeroRes = runAStar({
      rows: 10,
      cols: 10,
      grid,
      start,
      target,
      movement: '4-directional',
      heuristic: 'zero',
    });

    expect(dijkstraRes.metrics.found).toBe(true);
    expect(astarZeroRes.metrics.found).toBe(true);
    expect(dijkstraRes.metrics.pathCost).toBeCloseTo(astarZeroRes.metrics.pathCost, 2);
  });

  it('A* with Manhattan heuristic expands fewer nodes than Dijkstra on open grid', () => {
    const grid = createEmptyGrid(20, 20);
    const start = { r: 2, c: 2 };
    const target = { r: 18, c: 18 };

    const dijkstraRes = runDijkstra({
      rows: 20,
      cols: 20,
      grid,
      start,
      target,
      movement: '4-directional',
    });

    const astarRes = runAStar({
      rows: 20,
      cols: 20,
      grid,
      start,
      target,
      movement: '4-directional',
      heuristic: 'manhattan',
    });

    expect(astarRes.metrics.found).toBe(true);
    expect(astarRes.metrics.pathCost).toBe(dijkstraRes.metrics.pathCost);
    // A* guided by heuristic should explore fewer nodes than Dijkstra on an open grid
    expect(astarRes.metrics.nodesExpanded).toBeLessThan(dijkstraRes.metrics.nodesExpanded);
  });

  it('Correctly detects unreachable destination when surrounded by walls', () => {
    const grid = createEmptyGrid(10, 10);
    const start = { r: 1, c: 1 };
    const target = { r: 5, c: 5 };

    // Surround target with walls
    grid[4][5].type = 'wall';
    grid[6][5].type = 'wall';
    grid[5][4].type = 'wall';
    grid[5][6].type = 'wall';

    const dijkstraRes = runDijkstra({
      rows: 10,
      cols: 10,
      grid,
      start,
      target,
      movement: '4-directional',
    });

    expect(dijkstraRes.metrics.found).toBe(false);
    expect(dijkstraRes.path.length).toBe(0);
  });

  it('Greedy Best-First Search executes and flags isOptimal as false', () => {
    const grid = createEmptyGrid(10, 10);
    const start = { r: 1, c: 1 };
    const target = { r: 8, c: 8 };

    const res = runGreedyBestFirst({
      rows: 10,
      cols: 10,
      grid,
      start,
      target,
      movement: '4-directional',
    });

    expect(res.metrics.found).toBe(true);
    expect(res.metrics.isOptimal).toBe(false);
  });

  it('D* Lite finds optimal path and replans upon obstacle insertion', () => {
    const grid = createEmptyGrid(12, 12);
    const start = { r: 2, c: 2 };
    const goal = { r: 2, c: 8 };

    const engine = new DStarLiteEngine(12, 12, grid, start, goal, '4-directional');
    const initialRes = engine.runInitialSearch();

    expect(initialRes.metrics.found).toBe(true);
    expect(initialRes.metrics.pathCost).toBe(6);

    // Now place a wall blocking cell (2, 5) which is right in the direct path!
    const replanRes = engine.replanAfterChange([
      { r: 2, c: 5, newType: 'wall' }
    ]);

    expect(replanRes.path.length).toBeGreaterThan(0);
    // Path should have diverted around the wall at (2, 5)
    const containsBlockedWall = replanRes.path.some(p => p.r === 2 && p.c === 5);
    expect(containsBlockedWall).toBe(false);
  });
});

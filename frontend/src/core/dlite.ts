import { GridCell, GridCoord, MovementMode, PathfindingResult, SearchStepEvent } from './types';
import { calculateHeuristic } from './heuristics';
import { coordKey, coordsEqual, getValidNeighbors, parseCoordKey, SQRT_2 } from './grid';

export interface KeyPair {
  k1: number;
  k2: number;
}

function compareKeys(a: KeyPair, b: KeyPair): number {
  if (Math.abs(a.k1 - b.k1) > 1e-6) {
    return a.k1 - b.k1;
  }
  return a.k2 - b.k2;
}

interface PQNode {
  coord: GridCoord;
  key: KeyPair;
}

/**
 * Priority queue for D* Lite supporting lexicographical key ordering
 * and efficient update/removal of vertices.
 */
class DStarLiteHeap {
  private heap: PQNode[] = [];
  private posMap = new Map<string, number>();

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public topKey(): KeyPair {
    if (this.heap.length === 0) return { k1: Infinity, k2: Infinity };
    return this.heap[0].key;
  }

  public peek(): PQNode | undefined {
    return this.heap[0];
  }

  public contains(coord: GridCoord): boolean {
    return this.posMap.has(coordKey(coord));
  }

  public insert(coord: GridCoord, key: KeyPair): void {
    const cKey = coordKey(coord);
    if (this.posMap.has(cKey)) {
      this.update(coord, key);
      return;
    }
    const node: PQNode = { coord, key };
    this.heap.push(node);
    const index = this.heap.length - 1;
    this.posMap.set(cKey, index);
    this.bubbleUp(index);
  }

  public remove(coord: GridCoord): void {
    const cKey = coordKey(coord);
    const idx = this.posMap.get(cKey);
    if (idx === undefined) return;

    const lastIdx = this.heap.length - 1;
    if (idx === lastIdx) {
      this.heap.pop();
      this.posMap.delete(cKey);
      return;
    }

    const removedNode = this.heap[idx];
    const lastNode = this.heap.pop()!;
    this.posMap.delete(coordKey(removedNode.coord));

    if (idx < this.heap.length) {
      this.heap[idx] = lastNode;
      this.posMap.set(coordKey(lastNode.coord), idx);
      this.bubbleUp(idx);
      this.sinkDown(idx);
    }
  }

  public update(coord: GridCoord, key: KeyPair): void {
    const cKey = coordKey(coord);
    const idx = this.posMap.get(cKey);
    if (idx === undefined) {
      this.insert(coord, key);
      return;
    }
    this.heap[idx].key = key;
    this.bubbleUp(idx);
    this.sinkDown(idx);
  }

  public pop(): PQNode | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const cKey = coordKey(top.coord);
    this.posMap.delete(cKey);

    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.posMap.set(coordKey(bottom.coord), 0);
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(idx: number): void {
    const element = this.heap[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.heap[parentIdx];
      if (compareKeys(element.key, parent.key) >= 0) break;
      this.heap[idx] = parent;
      this.posMap.set(coordKey(parent.coord), idx);
      this.heap[parentIdx] = element;
      this.posMap.set(coordKey(element.coord), parentIdx);
      idx = parentIdx;
    }
  }

  private sinkDown(idx: number): void {
    const length = this.heap.length;
    const element = this.heap[idx];

    while (true) {
      const leftChildIdx = 2 * idx + 1;
      const rightChildIdx = 2 * idx + 2;
      let swapIdx: number | null = null;

      if (leftChildIdx < length) {
        if (compareKeys(this.heap[leftChildIdx].key, element.key) < 0) {
          swapIdx = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        const target = swapIdx === null ? element : this.heap[leftChildIdx];
        if (compareKeys(this.heap[rightChildIdx].key, target.key) < 0) {
          swapIdx = rightChildIdx;
        }
      }

      if (swapIdx === null) break;

      const swapNode = this.heap[swapIdx];
      this.heap[idx] = swapNode;
      this.posMap.set(coordKey(swapNode.coord), idx);
      this.heap[swapIdx] = element;
      this.posMap.set(coordKey(element.coord), swapIdx);
      idx = swapIdx;
    }
  }
}

/**
 * Full Koenig & Likhachev D* Lite Incremental Replanning Engine.
 * Search runs backwards from Goal to Start so that dynamic environmental changes
 * only require propagating cost changes to inconsistent local vertices.
 */
export class DStarLiteEngine {
  private rows: number;
  private cols: number;
  private grid: GridCell[][];
  private start: GridCoord;
  private goal: GridCoord;
  private movement: MovementMode;
  private km = 0;
  private sLast: GridCoord;

  public g = new Map<string, number>();
  public rhs = new Map<string, number>();
  private U = new DStarLiteHeap();

  public nodesExpanded = 0;
  public nodesDiscovered = 0;
  public maxFrontierSize = 0;
  public stepEvents: SearchStepEvent[] = [];
  public visitedOrder: GridCoord[] = [];
  private stepCount = 0;

  constructor(
    rows: number,
    cols: number,
    grid: GridCell[][],
    start: GridCoord,
    goal: GridCoord,
    movement: MovementMode
  ) {
    this.rows = rows;
    this.cols = cols;
    // Clone grid
    this.grid = grid.map(row => row.map(cell => ({ ...cell })));
    this.start = { ...start };
    this.goal = { ...goal };
    this.sLast = { ...start };
    this.movement = movement;

    this.initialize();
  }

  private h(a: GridCoord, b: GridCoord): number {
    return calculateHeuristic(a, b, this.movement === '8-directional' ? 'octile' : 'manhattan', 1.0);
  }

  public getG(coord: GridCoord): number {
    return this.g.get(coordKey(coord)) ?? Infinity;
  }

  public getRhs(coord: GridCoord): number {
    return this.rhs.get(coordKey(coord)) ?? Infinity;
  }

  private setG(coord: GridCoord, val: number): void {
    this.g.set(coordKey(coord), val);
  }

  private setRhs(coord: GridCoord, val: number): void {
    this.rhs.set(coordKey(coord), val);
  }

  public calculateKey(s: GridCoord): KeyPair {
    const minVal = Math.min(this.getG(s), this.getRhs(s));
    return {
      k1: minVal + this.h(this.start, s) + this.km,
      k2: minVal,
    };
  }

  private initialize(): void {
    this.km = 0;
    this.g.clear();
    this.rhs.clear();
    this.nodesExpanded = 0;
    this.nodesDiscovered = 1;
    this.maxFrontierSize = 1;
    this.stepEvents = [];
    this.visitedOrder = [];
    this.stepCount = 0;

    // In D* Lite, search is backwards: goal is the root
    this.setRhs(this.goal, 0);
    this.U.insert(this.goal, this.calculateKey(this.goal));

    this.stepEvents.push({
      step: ++this.stepCount,
      type: 'frontier',
      coord: this.goal,
      g: Infinity,
      f: 0,
      explanation: `Initialized D* Lite: Goal node (${this.goal.r}, ${this.goal.c}) set with rhs=0, key=[${this.h(this.start, this.goal).toFixed(2)}, 0].`,
    });
  }

  private updateVertex(u: GridCoord): void {
    const uKey = coordKey(u);
    if (!coordsEqual(u, this.goal)) {
      // rhs(u) = min_{s' in Succ(u)} (c(u, s') + g(s'))
      let minRhs = Infinity;
      const neighbors = getValidNeighbors(this.grid, this.rows, this.cols, u, this.movement);
      for (const succ of neighbors) {
        const succG = this.getG(succ.coord);
        const cost = succ.cost + succG;
        if (cost < minRhs) {
          minRhs = cost;
        }
      }
      this.setRhs(u, minRhs);
    }

    if (this.U.contains(u)) {
      this.U.remove(u);
    }

    const gVal = this.getG(u);
    const rhsVal = this.getRhs(u);

    if (Math.abs(gVal - rhsVal) > 1e-6) {
      const key = this.calculateKey(u);
      this.U.insert(u, key);
      this.nodesDiscovered++;

      this.stepEvents.push({
        step: ++this.stepCount,
        type: 'relax',
        coord: u,
        g: gVal,
        explanation: `Inconsistency at (${u.r}, ${u.c}): g=${gVal === Infinity ? '∞' : gVal.toFixed(2)}, rhs=${rhsVal === Infinity ? '∞' : rhsVal.toFixed(2)}. Updated vertex in priority queue.`,
      });
    }
  }

  public computeShortestPath(): void {
    let loopLimit = this.rows * this.cols * 8; // prevent infinite loops in malformed state

    while (
      !this.U.isEmpty() &&
      (compareKeys(this.U.topKey(), this.calculateKey(this.start)) < 0 ||
        Math.abs(this.getRhs(this.start) - this.getG(this.start)) > 1e-6) &&
      loopLimit-- > 0
    ) {
      if (this.U.size() > this.maxFrontierSize) {
        this.maxFrontierSize = this.U.size();
      }

      const topNode = this.U.peek()!;
      const u = topNode.coord;
      const kOld = topNode.key;
      const kNew = this.calculateKey(u);

      if (compareKeys(kOld, kNew) < 0) {
        this.U.update(u, kNew);
      } else {
        this.U.pop();
        this.nodesExpanded++;
        this.visitedOrder.push(u);

        const gU = this.getG(u);
        const rhsU = this.getRhs(u);

        if (gU > rhsU) {
          // Overconsistent
          this.setG(u, rhsU);
          this.stepEvents.push({
            step: ++this.stepCount,
            type: 'expand',
            coord: u,
            g: rhsU,
            explanation: `Overconsistent node (${u.r}, ${u.c}): Set g = rhs = ${rhsU.toFixed(2)}. Propagating to predecessors.`,
          });

          // Predecessors of u
          const neighbors = getValidNeighbors(this.grid, this.rows, this.cols, u, this.movement);
          for (const pred of neighbors) {
            this.updateVertex(pred.coord);
          }
        } else {
          // Underconsistent
          this.setG(u, Infinity);
          this.stepEvents.push({
            step: ++this.stepCount,
            type: 'expand',
            coord: u,
            g: Infinity,
            explanation: `Underconsistent node (${u.r}, ${u.c}): Edge cost increased. Reset g = ∞. Updating neighbors.`,
          });

          this.updateVertex(u);
          const neighbors = getValidNeighbors(this.grid, this.rows, this.cols, u, this.movement);
          for (const pred of neighbors) {
            this.updateVertex(pred.coord);
          }
        }
      }
    }
  }

  /**
   * Incrementally replans when obstacles or edge costs change.
   * Modifies only the affected local vertices, increments km, and runs ComputeShortestPath().
   */
  public replanAfterChange(changedCells: { r: number; c: number; newType: GridCell['type']; newWeight?: number }[]): {
    replanningTimeMs: number;
    path: GridCoord[];
    cost: number;
  } {
    const t0 = performance.now();

    // km modifier accumulates distance traversed by start
    this.km += this.h(this.sLast, this.start);
    this.sLast = { ...this.start };

    for (const change of changedCells) {
      const cell = this.grid[change.r][change.c];
      cell.type = change.newType;
      if (change.newWeight !== undefined) {
        cell.weight = change.newWeight;
      }

      // Update the vertex itself and all its immediate neighbors
      this.updateVertex({ r: change.r, c: change.c });
      const neighbors = getValidNeighbors(this.grid, this.rows, this.cols, { r: change.r, c: change.c }, this.movement);
      for (const n of neighbors) {
        this.updateVertex(n.coord);
      }
    }

    this.computeShortestPath();

    const t1 = performance.now();
    const replanningTimeMs = +(t1 - t0).toFixed(3);

    const { path, cost } = this.extractCurrentPath();
    return { replanningTimeMs, path, cost };
  }

  public extractCurrentPath(): { path: GridCoord[]; cost: number; geometricDistance: number } {
    const path: GridCoord[] = [];
    let curr = { ...this.start };
    path.push(curr);

    let totalCost = 0;
    let geometricDist = 0;
    const maxSteps = this.rows * this.cols;
    let steps = 0;

    while (!coordsEqual(curr, this.goal) && steps++ < maxSteps) {
      const neighbors = getValidNeighbors(this.grid, this.rows, this.cols, curr, this.movement);
      if (neighbors.length === 0) break;

      // In D* Lite, next node is argmin_{s'} (c(curr, s') + g(s'))
      let bestNeighbor: GridCoord | null = null;
      let minVal = Infinity;
      let bestCost = 0;
      let bestDiag = false;

      for (const n of neighbors) {
        const val = n.cost + this.getG(n.coord);
        if (val < minVal) {
          minVal = val;
          bestNeighbor = n.coord;
          bestCost = n.cost;
          bestDiag = n.isDiagonal;
        }
      }

      if (!bestNeighbor || minVal === Infinity) {
        // Path blocked / unreachable
        return { path: [], cost: 0, geometricDistance: 0 };
      }

      curr = bestNeighbor;
      path.push(curr);
      totalCost += bestCost;
      geometricDist += bestDiag ? SQRT_2 : 1.0;
    }

    if (!coordsEqual(curr, this.goal)) {
      return { path: [], cost: 0, geometricDistance: 0 };
    }

    return { path, cost: +totalCost.toFixed(3), geometricDistance: +geometricDist.toFixed(3) };
  }

  public runInitialSearch(): PathfindingResult {
    const t0 = performance.now();
    this.computeShortestPath();
    const t1 = performance.now();
    const executionTimeMs = +(t1 - t0).toFixed(3);

    const { path, cost, geometricDistance } = this.extractCurrentPath();
    const found = path.length > 0;

    if (found) {
      for (const p of path) {
        this.stepEvents.push({
          step: ++this.stepCount,
          type: 'path',
          coord: p,
        });
      }
    }

    return {
      metrics: {
        algorithm: 'D* Lite (Incremental Replanning)',
        found,
        pathCost: cost,
        pathLength: path.length,
        geometricDistance,
        nodesExpanded: this.nodesExpanded,
        nodesDiscovered: this.nodesDiscovered,
        maxFrontierSize: this.maxFrontierSize,
        executionTimeMs,
        isOptimal: true,
      },
      path,
      visitedOrder: this.visitedOrder,
      stepEvents: this.stepEvents,
    };
  }
}

export type CellType = 'empty' | 'wall' | 'mud' | 'sand' | 'water' | 'zone';

export interface GridCoord {
  r: number;
  c: number;
}

export interface GridCell {
  r: number;
  c: number;
  type: CellType;
  weight: number; // 1 for normal, 2 sand, 3 mud, 5 water, 10 zone
  // Multi-criteria attributes
  risk: number;      // 0 to 1
  energyFactor: number; // energy multiplier
}

export type MovementMode = '4-directional' | '8-directional';

export type HeuristicType = 'manhattan' | 'octile' | 'euclidean' | 'chebyshev' | 'zero';

export interface MultiCriteriaWeights {
  alpha: number; // Distance
  beta: number;  // Travel time
  gamma: number; // Energy
  delta: number; // Risk
}

export interface SearchStepEvent {
  step: number;
  type: 'frontier' | 'expand' | 'relax' | 'path';
  coord: GridCoord;
  parent?: GridCoord | null;
  g?: number;
  h?: number;
  f?: number;
  explanation?: string;
}

export interface AlgorithmMetrics {
  algorithm: string;
  found: boolean;
  pathCost: number;
  pathLength: number; // count of nodes in path
  geometricDistance: number;
  nodesExpanded: number; // nodes pulled from priority queue/queue
  nodesDiscovered: number; // nodes ever added to frontier
  maxFrontierSize: number;
  executionTimeMs: number; // high-resolution runtime (excluding animation)
  isOptimal: boolean;
  replanningTimeMs?: number;
}

export interface PathfindingResult {
  metrics: AlgorithmMetrics;
  path: GridCoord[];
  visitedOrder: GridCoord[];
  stepEvents: SearchStepEvent[];
}

export interface AlgorithmRunnerOptions {
  rows: number;
  cols: number;
  grid: GridCell[][];
  start: GridCoord;
  target: GridCoord;
  movement: MovementMode;
  heuristic?: HeuristicType;
  multiCriteria?: MultiCriteriaWeights;
  recordEvents?: boolean; // whether to record granular step events for visualization
}

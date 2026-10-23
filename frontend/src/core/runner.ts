import { AlgorithmRunnerOptions, PathfindingResult } from './types';
import { runBFS } from './bfs';
import { runDijkstra } from './dijkstra';
import { runAStar } from './astar';
import { runGreedyBestFirst } from './greedy';
import { DStarLiteEngine } from './dlite';

export type AlgorithmId = 'bfs' | 'dijkstra' | 'astar' | 'greedy' | 'dlite';

export interface AlgorithmInfo {
  id: AlgorithmId;
  name: string;
  category: 'uninformed' | 'weighted' | 'heuristic' | 'replanning';
  guaranteesOptimality: boolean;
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
}

export const ALGORITHM_REGISTRY: Record<AlgorithmId, AlgorithmInfo> = {
  bfs: {
    id: 'bfs',
    name: 'Breadth-First Search (BFS)',
    category: 'uninformed',
    guaranteesOptimality: false, // only optimal for unweighted
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Level-by-level search using a FIFO queue. Optimal in edge-count for unweighted graphs, but ignores terrain weights.',
  },
  dijkstra: {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    category: 'weighted',
    guaranteesOptimality: true,
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    description: 'Finds optimal minimum-cost paths in graphs with non-negative edge weights using a Min-Priority Queue.',
  },
  astar: {
    id: 'astar',
    name: 'A* Heuristic Search',
    category: 'heuristic',
    guaranteesOptimality: true,
    timeComplexity: 'O(b^d)',
    spaceComplexity: 'O(b^d)',
    description: 'Evaluates f(n) = g(n) + h(n). Uses an admissible heuristic to guide search directly towards the target, expanding significantly fewer nodes.',
  },
  greedy: {
    id: 'greedy',
    name: 'Greedy Best-First Search',
    category: 'heuristic',
    guaranteesOptimality: false,
    timeComplexity: 'O(b^d)',
    spaceComplexity: 'O(b^d)',
    description: 'Evaluates f(n) = h(n). Greedily pursues proximity to the goal. Fast but does not guarantee lowest-cost path.',
  },
  dlite: {
    id: 'dlite',
    name: 'D* Lite Incremental Replanning',
    category: 'replanning',
    guaranteesOptimality: true,
    timeComplexity: 'O((V + E) log V) initial, sub-linear replanning',
    spaceComplexity: 'O(V)',
    description: 'Incremental heuristic replanning. Reuses previous search trees to rapidly recompute paths when obstacles or terrain costs change.',
  },
};

export function runAlgorithm(id: AlgorithmId, options: AlgorithmRunnerOptions): PathfindingResult {
  switch (id) {
    case 'bfs':
      return runBFS(options);
    case 'dijkstra':
      return runDijkstra(options);
    case 'astar':
      return runAStar(options);
    case 'greedy':
      return runGreedyBestFirst(options);
    case 'dlite': {
      const engine = new DStarLiteEngine(
        options.rows,
        options.cols,
        options.grid,
        options.start,
        options.target,
        options.movement
      );
      return engine.runInitialSearch();
    }
    default:
      return runAStar(options);
  }
}

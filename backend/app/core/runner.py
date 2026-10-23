from typing import List, Optional, Literal
from .types import (
    GridCell, GridCoord, MovementMode, HeuristicType,
    MultiCriteriaWeights, PathfindingResult
)
from .bfs import run_bfs
from .dijkstra import run_dijkstra
from .astar import run_astar
from .greedy import run_greedy
from .dlite import DStarLitePythonEngine

AlgorithmId = Literal['bfs', 'dijkstra', 'astar', 'greedy', 'dlite']

def run_algorithm_python(
    algorithm: AlgorithmId,
    grid: List[List[GridCell]],
    rows: int,
    cols: int,
    start: GridCoord,
    target: GridCoord,
    movement: MovementMode,
    heuristic: HeuristicType = 'manhattan',
    weights: Optional[MultiCriteriaWeights] = None,
    record_events: bool = True
) -> PathfindingResult:
    if algorithm == 'bfs':
        return run_bfs(grid, rows, cols, start, target, movement, record_events)
    elif algorithm == 'dijkstra':
        return run_dijkstra(grid, rows, cols, start, target, movement, weights, record_events)
    elif algorithm == 'astar':
        return run_astar(grid, rows, cols, start, target, movement, heuristic, weights, record_events)
    elif algorithm == 'greedy':
        return run_greedy(grid, rows, cols, start, target, movement, heuristic, weights, record_events)
    elif algorithm == 'dlite':
        engine = DStarLitePythonEngine(grid, rows, cols, start, target, movement)
        return engine.run_initial_search()
    else:
        return run_astar(grid, rows, cols, start, target, movement, heuristic, weights, record_events)

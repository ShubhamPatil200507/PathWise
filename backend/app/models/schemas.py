from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field
from ..core.types import (
    GridCoord, GridCell, MovementMode, HeuristicType,
    MultiCriteriaWeights, AlgorithmMetrics, PathfindingResult
)

class ScenarioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = ""
    rows: int = Field(default=25, ge=5, le=100)
    cols: int = Field(default=35, ge=5, le=100)
    start: GridCoord
    target: GridCoord
    movement: MovementMode = '4-directional'
    grid: List[List[GridCell]]

class ScenarioResponse(ScenarioCreate):
    id: int
    created_at: str
    updated_at: str

class PathfindingRunRequest(BaseModel):
    algorithm: str = Field(default='astar')
    rows: int = Field(default=25, ge=5, le=100)
    cols: int = Field(default=35, ge=5, le=100)
    start: GridCoord
    target: GridCoord
    movement: MovementMode = '4-directional'
    heuristic: HeuristicType = 'manhattan'
    weights: Optional[MultiCriteriaWeights] = None
    grid: List[List[GridCell]]
    record_events: bool = True

class PathfindingCompareRequest(BaseModel):
    algorithms: List[str] = Field(default=['bfs', 'dijkstra', 'astar', 'greedy'])
    rows: int = Field(default=25, ge=5, le=100)
    cols: int = Field(default=35, ge=5, le=100)
    start: GridCoord
    target: GridCoord
    movement: MovementMode = '4-directional'
    heuristic: HeuristicType = 'manhattan'
    weights: Optional[MultiCriteriaWeights] = None
    grid: List[List[GridCell]]

class CellChange(BaseModel):
    r: int
    c: int
    new_type: str = 'wall'

class PathfindingReplanRequest(BaseModel):
    rows: int = Field(default=25, ge=5, le=100)
    cols: int = Field(default=35, ge=5, le=100)
    start: GridCoord
    target: GridCoord
    movement: MovementMode = '4-directional'
    grid: List[List[GridCell]]
    changed_cells: List[CellChange]

class BenchmarkRunRequest(BaseModel):
    algorithms: List[str] = Field(default=['dijkstra', 'astar', 'greedy'])
    grid_sizes: List[int] = Field(default=[15, 25, 35])
    obstacle_densities: List[float] = Field(default=[0.1, 0.25, 0.35])
    repetitions: int = Field(default=3, ge=1, le=10)
    movement: MovementMode = '4-directional'

class BenchmarkItemResult(BaseModel):
    algorithm: str
    grid_size: int
    obstacle_density: float
    repetition: int
    found: bool
    path_cost: float
    nodes_expanded: int
    nodes_discovered: int
    max_frontier_size: int
    execution_time_ms: float

class BenchmarkResponse(BaseModel):
    id: int
    created_at: str
    total_runs: int
    results: List[BenchmarkItemResult]
    summary_by_algorithm: Dict[str, Dict[str, float]]

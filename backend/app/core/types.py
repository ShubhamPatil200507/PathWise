from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

CellType = Literal['empty', 'wall', 'mud', 'sand', 'water', 'zone']
MovementMode = Literal['4-directional', '8-directional']
HeuristicType = Literal['manhattan', 'octile', 'euclidean', 'chebyshev', 'zero']

class GridCoord(BaseModel):
    r: int
    c: int

class GridCell(BaseModel):
    r: int
    c: int
    type: CellType = 'empty'
    weight: float = 1.0
    risk: float = 0.05
    energy_factor: float = 1.0

class MultiCriteriaWeights(BaseModel):
    alpha: float = 1.0  # Distance
    beta: float = 1.0   # Travel time
    gamma: float = 1.0  # Energy
    delta: float = 1.0  # Risk

class SearchStepEvent(BaseModel):
    step: int
    type: Literal['frontier', 'expand', 'relax', 'path']
    coord: GridCoord
    parent: Optional[GridCoord] = None
    g: Optional[float] = None
    h: Optional[float] = None
    f: Optional[float] = None
    explanation: Optional[str] = None

class AlgorithmMetrics(BaseModel):
    algorithm: str
    found: bool
    path_cost: float
    path_length: int
    geometric_distance: float
    nodes_expanded: int
    nodes_discovered: int
    max_frontier_size: int
    execution_time_ms: float
    is_optimal: bool
    replanning_time_ms: Optional[float] = None

class PathfindingResult(BaseModel):
    metrics: AlgorithmMetrics
    path: List[GridCoord]
    visited_order: List[GridCoord]
    step_events: List[SearchStepEvent] = []

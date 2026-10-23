import math
from typing import Tuple
from .types import GridCoord, HeuristicType

SQRT_2 = math.sqrt(2.0)

def calculate_heuristic(
    a: GridCoord,
    b: GridCoord,
    heuristic_type: HeuristicType,
    min_terrain_cost: float = 1.0
) -> float:
    if heuristic_type == 'zero':
        return 0.0

    dx = abs(a.c - b.c)
    dy = abs(a.r - b.r)

    if heuristic_type == 'manhattan':
        raw = float(dx + dy)
    elif heuristic_type == 'octile':
        raw = min(dx, dy) * SQRT_2 + abs(dx - dy)
    elif heuristic_type == 'chebyshev':
        raw = float(max(dx, dy))
    elif heuristic_type == 'euclidean':
        raw = math.hypot(dx, dy)
    else:
        raw = float(dx + dy)

    # Scale by min_terrain_cost to preserve admissibility h(n) <= h*(n)
    return raw * min_terrain_cost

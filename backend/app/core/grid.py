import math
from typing import List, Tuple, Dict, Optional
from .types import GridCell, GridCoord, MovementMode, MultiCriteriaWeights, CellType

SQRT_2 = math.sqrt(2.0)

def get_terrain_attributes(cell_type: CellType):
    if cell_type == 'empty':
        return {'weight': 1.0, 'risk': 0.05, 'energy_factor': 1.0, 'speed_factor': 1.0}
    elif cell_type == 'sand':
        return {'weight': 2.0, 'risk': 0.20, 'energy_factor': 1.8, 'speed_factor': 0.6}
    elif cell_type == 'mud':
        return {'weight': 3.0, 'risk': 0.35, 'energy_factor': 2.5, 'speed_factor': 0.4}
    elif cell_type == 'water':
        return {'weight': 5.0, 'risk': 0.60, 'energy_factor': 4.5, 'speed_factor': 0.25}
    elif cell_type == 'zone':
        return {'weight': 10.0, 'risk': 0.85, 'energy_factor': 3.0, 'speed_factor': 0.2}
    else:  # wall
        return {'weight': float('inf'), 'risk': 1.0, 'energy_factor': float('inf'), 'speed_factor': 0.0}

def calculate_edge_cost(
    from_cell: GridCell,
    to_cell: GridCell,
    is_diagonal: bool,
    weights: Optional[MultiCriteriaWeights] = None
) -> float:
    base_dist = SQRT_2 if is_diagonal else 1.0
    if to_cell.type == 'wall':
        return float('inf')

    attr = get_terrain_attributes(to_cell.type)

    if weights is None:
        return base_dist * attr['weight']

    travel_time = base_dist / attr['speed_factor']
    energy = base_dist * attr['energy_factor']
    risk = base_dist * attr['risk'] * 10.0

    total_cost = (
        weights.alpha * base_dist +
        weights.beta * travel_time +
        weights.gamma * energy +
        weights.delta * risk
    )
    return max(0.001, total_cost)

def get_valid_neighbors(
    grid: List[List[GridCell]],
    rows: int,
    cols: int,
    coord: GridCoord,
    movement: MovementMode,
    weights: Optional[MultiCriteriaWeights] = None
) -> List[Tuple[GridCoord, float, float, bool]]:
    r, c = coord.r, coord.c
    neighbors: List[Tuple[GridCoord, float, float, bool]] = []

    # Orthogonal directions (N, S, E, W)
    orth_dirs = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    for dr, dc in orth_dirs:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            target_cell = grid[nr][nc]
            if target_cell.type != 'wall':
                cost = calculate_edge_cost(grid[r][c], target_cell, False, weights)
                neighbors.append((GridCoord(r=nr, c=nc), cost, 1.0, False))

    # Diagonal directions with corner-cutting prevention
    if movement == '8-directional':
        diag_dirs = [(-1, 1), (-1, -1), (1, 1), (1, -1)]
        for dr, dc in diag_dirs:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                # Disallow corner-cutting through blocked cells!
                if grid[nr][c].type != 'wall' and grid[r][nc].type != 'wall':
                    target_cell = grid[nr][nc]
                    if target_cell.type != 'wall':
                        cost = calculate_edge_cost(grid[r][c], target_cell, True, weights)
                        neighbors.append((GridCoord(r=nr, c=nc), cost, SQRT_2, True))

    return neighbors

def reconstruct_path(
    parents: Dict[Tuple[int, int], GridCoord],
    start: GridCoord,
    target: GridCoord,
    grid: List[List[GridCell]],
    weights: Optional[MultiCriteriaWeights] = None
) -> Tuple[List[GridCoord], float, float]:
    path: List[GridCoord] = []
    curr: Optional[GridCoord] = target
    start_tuple = (start.r, start.c)

    while curr is not None:
        path.append(curr)
        if (curr.r, curr.c) == start_tuple:
            break
        curr = parents.get((curr.r, curr.c))

    path.reverse()

    if not path or (path[0].r, path[0].c) != start_tuple:
        return [], 0.0, 0.0

    total_cost = 0.0
    geometric_dist = 0.0

    for i in range(len(path) - 1):
        u = path[i]
        v = path[i + 1]
        is_diag = (u.r != v.r) and (u.c != v.c)
        base_d = SQRT_2 if is_diag else 1.0
        geometric_dist += base_d
        step_cost = calculate_edge_cost(grid[u.r][u.c], grid[v.r][v.c], is_diag, weights)
        total_cost += step_cost

    return path, round(total_cost, 3), round(geometric_dist, 3)

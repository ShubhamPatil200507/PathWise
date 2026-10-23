import time
from typing import List, Optional
from .types import GridCell, GridCoord, MovementMode, HeuristicType, MultiCriteriaWeights, PathfindingResult, AlgorithmMetrics, SearchStepEvent
from .heap import BinaryHeap
from .heuristics import calculate_heuristic
from .grid import get_valid_neighbors, reconstruct_path

def run_astar(
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
    start_time = time.perf_counter()

    # Determine minimum terrain weight for heuristic admissibility scaling
    min_terrain_cost = 1.0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c].type != 'wall' and grid[r][c].weight < min_terrain_cost:
                min_terrain_cost = grid[r][c].weight

    open_set = BinaryHeap[GridCoord]()
    g_score = {}
    f_score = {}
    parents = {}
    closed_set = set()
    visited_order: List[GridCoord] = []
    step_events: List[SearchStepEvent] = []

    nodes_expanded = 0
    nodes_discovered = 1
    max_frontier_size = 1
    found = False
    step_count = 0

    start_tuple = (start.r, start.c)
    target_tuple = (target.r, target.c)

    start_h = calculate_heuristic(start, target, heuristic, min_terrain_cost)
    g_score[start_tuple] = 0.0
    f_score[start_tuple] = start_h
    open_set.push(start, start_h, start_h)

    if record_events:
        step_events.append(SearchStepEvent(
            step=1,
            type='frontier',
            coord=start,
            g=0.0,
            h=start_h,
            f=start_h,
            explanation=f"Initialized A*: Start node ({start.r}, {start.c}) in Open Set with g=0, h={start_h:.2f}, f={start_h:.2f}."
        ))
        step_count = 1

    while not open_set.is_empty():
        if len(open_set) > max_frontier_size:
            max_frontier_size = len(open_set)

        top = open_set.pop()
        if not top:
            break
        curr_f, curr_h, curr = top
        curr_tuple = (curr.r, curr.c)

        if curr_tuple in closed_set:
            continue

        closed_set.add(curr_tuple)
        nodes_expanded += 1
        visited_order.append(curr)

        curr_g = g_score.get(curr_tuple, float('inf'))

        if record_events:
            step_count += 1
            step_events.append(SearchStepEvent(
                step=step_count,
                type='expand',
                coord=curr,
                g=curr_g,
                h=curr_h,
                f=curr_f,
                parent=parents.get(curr_tuple),
                explanation=f"Selected lowest f(n) node ({curr.r}, {curr.c}): g={curr_g:.2f} + h={curr_h:.2f} = f={curr_f:.2f}."
            ))

        if curr_tuple == target_tuple:
            found = True
            break

        neighbors = get_valid_neighbors(grid, rows, cols, curr, movement, weights)
        for n_coord, cost, base_d, is_diag in neighbors:
            n_tuple = (n_coord.r, n_coord.c)
            if n_tuple in closed_set:
                continue

            tentative_g = curr_g + cost
            prev_g = g_score.get(n_tuple, float('inf'))

            if tentative_g < prev_g:
                parents[n_tuple] = curr
                g_score[n_tuple] = tentative_g
                h = calculate_heuristic(n_coord, target, heuristic, min_terrain_cost)
                f = tentative_g + h
                f_score[n_tuple] = f

                open_set.push(n_coord, f, h)

                if prev_g == float('inf'):
                    nodes_discovered += 1

                if record_events:
                    step_count += 1
                    step_events.append(SearchStepEvent(
                        step=step_count,
                        type='relax',
                        coord=n_coord,
                        parent=curr,
                        g=tentative_g,
                        h=h,
                        f=f,
                        explanation=f"Relaxed neighbor ({n_coord.r}, {n_coord.c}): new f={f:.2f} (g={tentative_g:.2f}, h={h:.2f})."
                    ))

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 3)

    path, cost, geom_dist = reconstruct_path(parents, start, target, grid, weights) if found else ([], 0.0, 0.0)

    if record_events and found:
        for p in path:
            step_count += 1
            step_events.append(SearchStepEvent(
                step=step_count,
                type='path',
                coord=p
            ))

    return PathfindingResult(
        metrics=AlgorithmMetrics(
            algorithm=f"A* Search ({heuristic.upper()})",
            found=found,
            path_cost=cost,
            path_length=len(path),
            geometric_distance=geom_dist,
            nodes_expanded=nodes_expanded,
            nodes_discovered=nodes_discovered,
            max_frontier_size=max_frontier_size,
            execution_time_ms=elapsed_ms,
            is_optimal=True
        ),
        path=path,
        visited_order=visited_order,
        step_events=step_events
    )

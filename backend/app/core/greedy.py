import time
from typing import List, Optional
from .types import GridCell, GridCoord, MovementMode, HeuristicType, MultiCriteriaWeights, PathfindingResult, AlgorithmMetrics, SearchStepEvent
from .heap import BinaryHeap
from .heuristics import calculate_heuristic
from .grid import get_valid_neighbors, reconstruct_path

def run_greedy(
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

    open_set = BinaryHeap[GridCoord]()
    parents = {}
    closed_set = set()
    visited_order: List[GridCoord] = []
    step_events: List[SearchStepEvent] = []

    nodes_expanded = 0
    nodes_discovered = 1
    max_frontier_size = 1
    found = False
    step_count = 0

    target_tuple = (target.r, target.c)
    start_h = calculate_heuristic(start, target, heuristic, 1.0)
    open_set.push(start, start_h)

    if record_events:
        step_events.append(SearchStepEvent(
            step=1,
            type='frontier',
            coord=start,
            h=start_h,
            f=start_h,
            explanation=f"Initialized Greedy Best-First: Start node ({start.r}, {start.c}) with heuristic h={start_h:.2f}."
        ))
        step_count = 1

    while not open_set.is_empty():
        if len(open_set) > max_frontier_size:
            max_frontier_size = len(open_set)

        top = open_set.pop()
        if not top:
            break
        curr_h, _, curr = top
        curr_tuple = (curr.r, curr.c)

        if curr_tuple in closed_set:
            continue

        closed_set.add(curr_tuple)
        nodes_expanded += 1
        visited_order.append(curr)

        if record_events:
            step_count += 1
            step_events.append(SearchStepEvent(
                step=step_count,
                type='expand',
                coord=curr,
                h=curr_h,
                f=curr_h,
                parent=parents.get(curr_tuple),
                explanation=f"Greedily selected node ({curr.r}, {curr.c}) with lowest remaining h={curr_h:.2f}."
            ))

        if curr_tuple == target_tuple:
            found = True
            break

        neighbors = get_valid_neighbors(grid, rows, cols, curr, movement, weights)
        for n_coord, cost, base_d, is_diag in neighbors:
            n_tuple = (n_coord.r, n_coord.c)
            if n_tuple not in closed_set and n_tuple not in parents:
                parents[n_tuple] = curr
                h = calculate_heuristic(n_coord, target, heuristic, 1.0)
                open_set.push(n_coord, h)
                nodes_discovered += 1

                if record_events:
                    step_count += 1
                    step_events.append(SearchStepEvent(
                        step=step_count,
                        type='frontier',
                        coord=n_coord,
                        parent=curr,
                        h=h,
                        f=h,
                        explanation=f"Discovered neighbor ({n_coord.r}, {n_coord.c}) with heuristic h={h:.2f}."
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
            algorithm="Greedy Best-First Search",
            found=found,
            path_cost=cost,
            path_length=len(path),
            geometric_distance=geom_dist,
            nodes_expanded=nodes_expanded,
            nodes_discovered=nodes_discovered,
            max_frontier_size=max_frontier_size,
            execution_time_ms=elapsed_ms,
            is_optimal=False
        ),
        path=path,
        visited_order=visited_order,
        step_events=step_events
    )

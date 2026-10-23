import time
from typing import List, Optional
from .types import GridCell, GridCoord, MovementMode, MultiCriteriaWeights, PathfindingResult, AlgorithmMetrics, SearchStepEvent
from .heap import BinaryHeap
from .grid import get_valid_neighbors, reconstruct_path

def run_dijkstra(
    grid: List[List[GridCell]],
    rows: int,
    cols: int,
    start: GridCoord,
    target: GridCoord,
    movement: MovementMode,
    weights: Optional[MultiCriteriaWeights] = None,
    record_events: bool = True
) -> PathfindingResult:
    start_time = time.perf_counter()

    pq = BinaryHeap[GridCoord]()
    dist = {}
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
    dist[start_tuple] = 0.0
    pq.push(start, 0.0)

    if record_events:
        step_events.append(SearchStepEvent(
            step=1,
            type='frontier',
            coord=start,
            g=0.0,
            f=0.0,
            explanation=f"Initialized Dijkstra: Start node ({start.r}, {start.c}) with distance g=0 inserted into Min-Heap."
        ))
        step_count = 1

    target_tuple = (target.r, target.c)

    while not pq.is_empty():
        if len(pq) > max_frontier_size:
            max_frontier_size = len(pq)

        top = pq.pop()
        if not top:
            break
        current_dist, _, curr = top
        curr_tuple = (curr.r, curr.c)

        if curr_tuple in closed_set or current_dist > dist.get(curr_tuple, float('inf')):
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
                g=current_dist,
                f=current_dist,
                parent=parents.get(curr_tuple),
                explanation=f"Extracted minimum node ({curr.r}, {curr.c}) with finalized optimal cost g={current_dist:.2f}."
            ))

        if curr_tuple == target_tuple:
            found = True
            break

        neighbors = get_valid_neighbors(grid, rows, cols, curr, movement, weights)
        for n_coord, cost, base_d, is_diag in neighbors:
            n_tuple = (n_coord.r, n_coord.c)
            if n_tuple in closed_set:
                continue

            alt_dist = current_dist + cost
            prev_dist = dist.get(n_tuple, float('inf'))

            if alt_dist < prev_dist:
                dist[n_tuple] = alt_dist
                parents[n_tuple] = curr
                pq.push(n_coord, alt_dist)

                if prev_dist == float('inf'):
                    nodes_discovered += 1

                if record_events:
                    step_count += 1
                    step_events.append(SearchStepEvent(
                        step=step_count,
                        type='relax',
                        coord=n_coord,
                        parent=curr,
                        g=alt_dist,
                        f=alt_dist,
                        explanation=f"Relaxed edge ({curr.r}, {curr.c}) -> ({n_coord.r}, {n_coord.c}): improved distance from {prev_dist:.2f} to {alt_dist:.2f}."
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
            algorithm="Dijkstra's Algorithm",
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

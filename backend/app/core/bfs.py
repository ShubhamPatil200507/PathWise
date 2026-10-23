import time
from collections import deque
from typing import List, Optional
from .types import GridCell, GridCoord, MovementMode, PathfindingResult, AlgorithmMetrics, SearchStepEvent
from .grid import get_valid_neighbors, reconstruct_path

def run_bfs(
    grid: List[List[GridCell]],
    rows: int,
    cols: int,
    start: GridCoord,
    target: GridCoord,
    movement: MovementMode,
    record_events: bool = True
) -> PathfindingResult:
    start_time = time.perf_counter()

    queue = deque([start])
    visited = {(start.r, start.c)}
    parents = {}
    visited_order: List[GridCoord] = []
    step_events: List[SearchStepEvent] = []

    nodes_expanded = 0
    nodes_discovered = 1
    max_frontier_size = 1
    found = False
    step_count = 0

    if record_events:
        step_events.append(SearchStepEvent(
            step=1,
            type='frontier',
            coord=start,
            explanation=f"Initialized BFS with start node ({start.r}, {start.c}) in FIFO queue."
        ))
        step_count = 1

    target_tuple = (target.r, target.c)

    while queue:
        if len(queue) > max_frontier_size:
            max_frontier_size = len(queue)

        curr = queue.popleft()
        nodes_expanded += 1
        visited_order.append(curr)

        if record_events:
            step_count += 1
            step_events.append(SearchStepEvent(
                step=step_count,
                type='expand',
                coord=curr,
                parent=parents.get((curr.r, curr.c)),
                explanation=f"Dequeued node ({curr.r}, {curr.c}). Total nodes expanded: {nodes_expanded}."
            ))

        if (curr.r, curr.c) == target_tuple:
            found = True
            break

        neighbors = get_valid_neighbors(grid, rows, cols, curr, movement)
        for n_coord, cost, base_d, is_diag in neighbors:
            n_tuple = (n_coord.r, n_coord.c)
            if n_tuple not in visited:
                visited.add(n_tuple)
                parents[n_tuple] = curr
                queue.append(n_coord)
                nodes_discovered += 1

                if record_events:
                    step_count += 1
                    step_events.append(SearchStepEvent(
                        step=step_count,
                        type='frontier',
                        coord=n_coord,
                        parent=curr,
                        explanation=f"Discovered unvisited neighbor ({n_coord.r}, {n_coord.c}). Added to FIFO queue."
                    ))

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 3)

    path, cost, geom_dist = reconstruct_path(parents, start, target, grid) if found else ([], 0.0, 0.0)

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
            algorithm="Breadth-First Search (BFS)",
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

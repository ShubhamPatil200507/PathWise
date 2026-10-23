import time
import math
from typing import List, Tuple, Dict, Optional
from .types import GridCell, GridCoord, MovementMode, PathfindingResult, AlgorithmMetrics, SearchStepEvent
from .heuristics import calculate_heuristic
from .grid import get_valid_neighbors

SQRT_2 = math.sqrt(2.0)

class DStarLitePythonEngine:
    def __init__(
        self,
        grid: List[List[GridCell]],
        rows: int,
        cols: int,
        start: GridCoord,
        goal: GridCoord,
        movement: MovementMode
    ):
        self.rows = rows
        self.cols = cols
        self.grid = [[GridCell(**cell.model_dump()) for cell in row] for row in grid]
        self.start = start
        self.goal = goal
        self.movement = movement
        self.s_last = start
        self.km = 0.0

        self.g: Dict[Tuple[int, int], float] = {}
        self.rhs: Dict[Tuple[int, int], float] = {}
        # U is a dict mapping (r, c) -> (k1, k2)
        self.U: Dict[Tuple[int, int], Tuple[float, float]] = {}

        self.nodes_expanded = 0
        self.nodes_discovered = 1
        self.max_frontier_size = 1
        self.visited_order: List[GridCoord] = []
        self.step_events: List[SearchStepEvent] = []
        self.step_count = 0

        self.initialize()

    def h(self, a: GridCoord, b: GridCoord) -> float:
        return calculate_heuristic(a, b, 'octile' if self.movement == '8-directional' else 'manhattan', 1.0)

    def get_g(self, coord: Tuple[int, int]) -> float:
        return self.g.get(coord, float('inf'))

    def get_rhs(self, coord: Tuple[int, int]) -> float:
        return self.rhs.get(coord, float('inf'))

    def calculate_key(self, s: Tuple[int, int]) -> Tuple[float, float]:
        min_val = min(self.get_g(s), self.get_rhs(s))
        s_coord = GridCoord(r=s[0], c=s[1])
        return (min_val + self.h(self.start, s_coord) + self.km, min_val)

    def initialize(self) -> None:
        self.km = 0.0
        self.g.clear()
        self.rhs.clear()
        self.U.clear()

        goal_tuple = (self.goal.r, self.goal.c)
        self.rhs[goal_tuple] = 0.0
        self.U[goal_tuple] = self.calculate_key(goal_tuple)

    def update_vertex(self, u: Tuple[int, int]) -> None:
        goal_tuple = (self.goal.r, self.goal.c)
        u_coord = GridCoord(r=u[0], c=u[1])

        if u != goal_tuple:
            min_rhs = float('inf')
            neighbors = get_valid_neighbors(self.grid, self.rows, self.cols, u_coord, self.movement)
            for n_coord, cost, _, _ in neighbors:
                n_tuple = (n_coord.r, n_coord.c)
                val = cost + self.get_g(n_tuple)
                if val < min_rhs:
                    min_rhs = val
            self.rhs[u] = min_rhs

        if u in self.U:
            del self.U[u]

        g_val = self.get_g(u)
        rhs_val = self.get_rhs(u)

        if abs(g_val - rhs_val) > 1e-6:
            self.U[u] = self.calculate_key(u)
            self.nodes_discovered += 1

    def top_key(self) -> Tuple[float, float]:
        if not self.U:
            return (float('inf'), float('inf'))
        return min(self.U.values())

    def pop_top(self) -> Tuple[Tuple[int, int], Tuple[float, float]]:
        # Find entry with minimum key lexicographically
        best_u = min(self.U.keys(), key=lambda k: self.U[k])
        key = self.U.pop(best_u)
        return best_u, key

    def compute_shortest_path(self) -> None:
        start_tuple = (self.start.r, self.start.c)
        loop_limit = self.rows * self.cols * 8

        while self.U and loop_limit > 0:
            loop_limit -= 1
            if len(self.U) > self.max_frontier_size:
                self.max_frontier_size = len(self.U)

            if not (self.top_key() < self.calculate_key(start_tuple) or
                    abs(self.get_rhs(start_tuple) - self.get_g(start_tuple)) > 1e-6):
                break

            u, k_old = self.pop_top()
            k_new = self.calculate_key(u)

            if k_old < k_new:
                self.U[u] = k_new
            else:
                self.nodes_expanded += 1
                self.visited_order.append(GridCoord(r=u[0], c=u[1]))
                g_u = self.get_g(u)
                rhs_u = self.get_rhs(u)

                u_coord = GridCoord(r=u[0], c=u[1])
                neighbors = get_valid_neighbors(self.grid, self.rows, self.cols, u_coord, self.movement)

                if g_u > rhs_u:
                    self.g[u] = rhs_u
                    for n_coord, _, _, _ in neighbors:
                        self.update_vertex((n_coord.r, n_coord.c))
                else:
                    self.g[u] = float('inf')
                    self.update_vertex(u)
                    for n_coord, _, _, _ in neighbors:
                        self.update_vertex((n_coord.r, n_coord.c))

    def extract_path(self) -> Tuple[List[GridCoord], float, float]:
        path = [self.start]
        curr = (self.start.r, self.start.c)
        goal_tuple = (self.goal.r, self.goal.c)
        total_cost = 0.0
        geom_dist = 0.0
        steps = 0
        max_steps = self.rows * self.cols

        while curr != goal_tuple and steps < max_steps:
            steps += 1
            curr_coord = GridCoord(r=curr[0], c=curr[1])
            neighbors = get_valid_neighbors(self.grid, self.rows, self.cols, curr_coord, self.movement)
            if not neighbors:
                break

            best_neighbor = None
            min_val = float('inf')
            best_cost = 0.0
            best_diag = False

            for n_coord, cost, _, is_diag in neighbors:
                n_tuple = (n_coord.r, n_coord.c)
                val = cost + self.get_g(n_tuple)
                if val < min_val:
                    min_val = val
                    best_neighbor = n_tuple
                    best_cost = cost
                    best_diag = is_diag

            if best_neighbor is None or min_val == float('inf'):
                return [], 0.0, 0.0

            curr = best_neighbor
            path.append(GridCoord(r=curr[0], c=curr[1]))
            total_cost += best_cost
            geom_dist += SQRT_2 if best_diag else 1.0

        if curr != goal_tuple:
            return [], 0.0, 0.0

        return path, round(total_cost, 3), round(geom_dist, 3)

    def replan_after_changes(self, changed_cells: List[Tuple[int, int, str]]) -> Tuple[float, List[GridCoord], float]:
        t0 = time.perf_counter()
        self.km += self.h(self.s_last, self.start)
        self.s_last = self.start

        for r, c, new_type in changed_cells:
            self.grid[r][c].type = new_type
            self.update_vertex((r, c))
            neighbors = get_valid_neighbors(self.grid, self.rows, self.cols, GridCoord(r=r, c=c), self.movement)
            for n_coord, _, _, _ in neighbors:
                self.update_vertex((n_coord.r, n_coord.c))

        self.compute_shortest_path()
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 3)
        path, cost, _ = self.extract_path()
        return elapsed_ms, path, cost

    def run_initial_search(self) -> PathfindingResult:
        t0 = time.perf_counter()
        self.compute_shortest_path()
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 3)
        path, cost, geom_dist = self.extract_path()

        return PathfindingResult(
            metrics=AlgorithmMetrics(
                algorithm="D* Lite (Incremental Replanning)",
                found=len(path) > 0,
                path_cost=cost,
                path_length=len(path),
                geometric_distance=geom_dist,
                nodes_expanded=self.nodes_expanded,
                nodes_discovered=self.nodes_discovered,
                max_frontier_size=self.max_frontier_size,
                execution_time_ms=elapsed_ms,
                is_optimal=True
            ),
            path=path,
            visited_order=self.visited_order,
            step_events=self.step_events
        )

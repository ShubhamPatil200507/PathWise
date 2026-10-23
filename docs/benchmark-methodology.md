# Benchmark Methodology & Experimental Framework

## 1. Experimental Methodology
To answer the core research question scientifically, PathWise incorporates a headless Monte-Carlo benchmark suite. Benchmark measurements are executed under controlled, reproducible conditions without visual animation overhead.

### Controlled Variables:
- **Grid Dimensions**: $15 \times 15$, $25 \times 25$, $35 \times 35$, $50 \times 50$.
- **Obstacle Densities**: 10%, 25%, 35%, 45%.
- **Movement Model**: 4-directional orthogonal vs 8-directional diagonal.
- **Start and Goal Coordinates**: Fixed relative to grid bounds ($(1, 1)$ to $(N-2, N-2)$).
- **Repetitions**: 3 to 5 independent trials per parameter combination.
- **Random Seeds**: Deterministically seeded per repetition to ensure all algorithms are evaluated on identical map topologies.

---

## 2. Metrics Collected
1. **Execution Runtime (ms)**: Measured using high-resolution microsecond timers (`performance.now()` in browser, `time.perf_counter()` in Python). Excludes all UI rendering and animation frames.
2. **Nodes Expanded**: Total vertices extracted from priority queues and evaluated.
3. **Nodes Discovered**: Total unique vertices pushed to open sets.
4. **Peak Frontier Size**: Maximum concurrent elements held in the priority queue (space consumption proxy).
5. **Path Cost**: Exact scalar path cost accumulated along the final path.
6. **Replanning Time (ms)**: Time taken to recover an optimal route after graph changes.

---

## 3. Data Integrity & CSV Export
PathWise strictly forbids fabricated or hardcoded benchmark figures. The Benchmark Studio executes the full algorithm suite dynamically and offers raw data export in CSV format:

```csv
benchmark_id,created_at,algorithm,grid_size,obstacle_density,repetition,found,path_cost,nodes_expanded,nodes_discovered,max_frontier_size,execution_time_ms
1,2026-10-23T22:00:00,A* Search (MANHATTAN),25,0.25,1,True,42.0,84,112,28,0.482
1,2026-10-23T22:00:00,Dijkstra's Algorithm,25,0.25,1,True,42.0,312,389,77,1.894
```

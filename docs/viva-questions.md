# Comprehensive Major Project Viva Voce Preparation & Examiner Defense

## Section 1: Graph Theory & Data Structures

### Q1: Why did you implement a custom Binary Min-Heap rather than using built-in array sort or external libraries?
**Answer:** In graph algorithms like Dijkstra and A*, priority queues are queried frequently ($\mathcal{O}((V + E) \log V)$ operations). Using a flat array sorted on each insertion yields $\mathcal{O}(V^2)$ time complexity, leading to severe latency on grids exceeding $30 \times 30$. Our custom array-backed Binary Min-Heap achieves $\mathcal{O}(\log V)$ bubble-up insertions and sink-down extractions, accompanied by secondary priority tie-breaking to favor nodes closest to the goal.

### Q2: What is the formal time and space complexity of Dijkstra's algorithm with a Min-Heap?
**Answer:** 
- **Time Complexity**: $\mathcal{O}((V + E) \log V)$, where $V$ is the number of traversable cells and $E$ is the number of valid directed transitions (up to $4V$ in 4-way, $8V$ in 8-way).
- **Space Complexity**: $\mathcal{O}(V)$, required to store distance maps, predecessor pointers, and up to $V$ entries in the priority queue.

---

## Section 2: Heuristic Search & Optimality

### Q3: What is the difference between an Admissible and a Consistent (Monotonic) Heuristic?
**Answer:**
1. **Admissibility**: $h(n) \le h^*(n)$ for all $n$, where $h^*(n)$ is the true shortest cost from $n$ to the goal. An admissible heuristic never overestimates the remaining cost.
2. **Consistency (Monotonicity)**: $h(n) \le c(n, n') + h(n')$ for all edges $(n, n')$, obeying the triangle inequality.
- Consistency is a stronger condition than admissibility. A consistent heuristic guarantees that the first time a node is extracted from the open set, its accumulated cost $g(n)$ is already optimal. Thus, no node needs to be reopened or re-expanded.

### Q4: How did you ensure heuristic admissibility on weighted terrain where cells have weights $\ge 1$?
**Answer:** If we used unscaled Manhattan distance on a grid where a detour through clear ground costs $1.0$ while a mud cell costs $3.0$, raw geometric distance might overestimate remaining cost if edge weights could drop below $1.0$. To strictly guarantee admissibility ($h(n) \le h^*(n)$), we scale the raw geometric distance by $\min_{v \in V} (W_v)$ (the minimum edge weight in the graph). If minimum weight is 1.0, raw distance is preserved; if all terrain costs are elevated, the heuristic scales proportionally.

### Q5: What happens when the heuristic in A* is set to $h(n) = 0$?
**Answer:** Setting $h(n) = 0$ reduces the evaluation function to $f(n) = g(n) + 0 = g(n)$. Under this condition, A* expands nodes in non-decreasing order of accumulated cost from the start, which is mathematically identical to Dijkstra's algorithm. Our automated tests verify that Dijkstra and A* ($h=0$) yield identical optimal path costs on weighted maps.

---

## Section 3: Incremental Replanning & D* Lite

### Q6: How does D* Lite achieve sub-linear replanning when an obstacle is added?
**Answer:** Standard A* discards all search tree information and restarts node expansion from the start node. D* Lite (Koenig & Likhachev) maintains two estimates per node: $g(s)$ and one-step lookahead $rhs(s)$. Searching backwards from the goal to the start, D* Lite maintains local consistency ($g(s) = rhs(s)$). When an edge is blocked, only the immediate endpoints and their predecessors become inconsistent ($g(u) \neq rhs(u)$). D* Lite pushes only these inconsistent nodes into a priority queue and propagates cost updates locally using key modifier $k_m$, recovering the new optimal path in $\mathcal{O}(k)$ time where $k \ll V$.

### Q7: What are overconsistent and underconsistent vertices in D* Lite?
**Answer:**
- **Overconsistent ($g(u) > rhs(u)$)**: Occurs when an edge cost decreases or a wall is removed. The vertex can simply set $g(u) = rhs(u)$ and propagate lower costs to predecessors.
- **Underconsistent ($g(u) < rhs(u)$)**: Occurs when an edge cost increases or a wall is placed. The current $g(u)$ is invalidly low. D* Lite resets $g(u) = \infty$, forcing the node and its neighbors to re-evaluate their lookahead costs from other available paths.

---

## Section 4: Engineering & Physics Realism

### Q8: How did you prevent corner-cutting in 8-directional movement?
**Answer:** In discrete 8-directional grids, moving diagonally from $(r, c)$ to $(r+dr, c+dc)$ passes between two adjacent orthogonal cells: $(r+dr, c)$ and $(r, c+dc)$. If either orthogonal cell is a solid wall, an agent cutting diagonally would collide with the wall's corner. In PathWise, `getValidNeighbors` validates that both orthogonal adjacent cells are free before allowing diagonal transitions, guaranteeing physically plausible collision-free navigation.

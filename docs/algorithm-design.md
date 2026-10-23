# Algorithm Design, Analysis & Mathematical Proofs

## 1. Custom Min-Binary-Heap (Priority Queue)
To avoid reliance on third-party libraries, PathWise implements an explicit array-backed Min-Binary-Heap.
- **Operations**:
  - `push(item, priority, secondaryPriority)`: $\mathcal{O}(\log V)$ via bubble-up.
  - `pop()`: $\mathcal{O}(\log V)$ via sink-down.
  - `peek()`: $\mathcal{O}(1)$.
- **Secondary Priority**: Used as a tie-breaker in A* (nodes with equal $f(n)$ break ties in favor of smaller $h(n)$, prioritizing exploration directly toward the target).

---

## 2. Breadth-First Search (BFS)
- **Data Structures**: FIFO Queue (`deque`), visited `Set`, parent `Map`.
- **Time Complexity**: $\mathcal{O}(V + E)$
- **Space Complexity**: $\mathcal{O}(V)$
- **Optimality Analysis**: BFS is optimal **if and only if** all edge weights are uniform (unweighted graphs). On weighted graphs (e.g., mud=3, water=5), BFS minimizes edge count rather than accumulated scalar cost, resulting in suboptimal routes.

---

## 3. Dijkstra's Shortest Path Algorithm
- **Data Structures**: Min-Binary-Heap, distance map $d(v)$, predecessor map, closed set.
- **Time Complexity**: $\mathcal{O}((V + E) \log V)$
- **Space Complexity**: $\mathcal{O}(V)$
- **Optimality Proof Sketch**:
  Let $u$ be the vertex extracted with minimum distance $d(u)$. Suppose a shorter path to $u$ exists via some path $P = s \dots x \to y \dots u$ where $y$ is the first unvisited vertex. Then:
  $$d(y) = d(x) + w(x, y) \ge d(x)$$
  Since all edge weights $w \ge 0$, and $y$ is in the queue, $d(y) \ge d(u)$. Thus, no extension through $y$ can yield a strictly smaller path cost than $d(u)$. Hence, $d(u)$ is finalized and optimal.

---

## 4. A* Heuristic Search
- **Evaluation Function**:
  $$f(n) = g(n) + h(n)$$
- **Admissibility & Consistency**:
  - Manhattan Distance (4-directional):
    $$h(n) = (|r_n - r_t| + |c_n - c_t|) \times \min(W)$$
  - Octile Distance (8-directional with diagonal $\sqrt{2}$):
    $$dx = |r_n - r_t|, \quad dy = |c_n - c_t|$$
    $$h(n) = \left( \min(dx, dy) \cdot \sqrt{2} + |dx - dy| \right) \times \min(W)$$
- **Terrain Scaling Factor**:
  Scaling $h(n)$ by the minimum edge weight $\min(W)$ across the entire graph ensures $h(n) \le h^*(n)$ even in the presence of expensive terrain cells.
- **Zero Heuristic ($h=0$)**:
  When $h(n) = 0$, $f(n) = g(n)$, and A* behaves identically to Dijkstra's algorithm.

---

## 5. Greedy Best-First Search
- **Evaluation Function**:
  $$f(n) = h(n)$$
- **Behavior**: Purely pursues estimated distance to the target. It operates rapidly on open fields but lacks an accumulated cost term $g(n)$, making it prone to concave wall traps and suboptimal detours.

---

## 6. D* Lite Incremental Replanning (Koenig & Likhachev)
- **Data Structures**: Priority Queue ordered lexicographically by $[k_1, k_2]$, $g$-values, and one-step lookahead $rhs$-values:
  $$rhs(u) = \begin{cases} 0 & \text{if } u = s_{\text{goal}} \\ \min_{s' \in \text{Succ}(u)} (c(u, s') + g(s')) & \text{otherwise} \end{cases}$$
- **Key Formulation**:
  $$k(u) = \left[ \min(g(u), rhs(u)) + h(s_{\text{start}}, u) + k_m, \; \min(g(u), rhs(u)) \right]$$
- **Consistency Properties**:
  - Consistent: $g(u) = rhs(u)$
  - Overconsistent: $g(u) > rhs(u)$ (decreased edge cost)
  - Underconsistent: $g(u) < rhs(u)$ (increased edge cost / obstacle added)
- **Incremental Efficiency**: When an obstacle is inserted along an active path, only affected local vertices become inconsistent. D* Lite updates these vertices and computes the new shortest path in $\mathcal{O}(k)$ time without resetting the entire search tree.

---

## 7. Multi-Criteria Route Optimization
Scalarized objective function:
$$C(e) = \alpha \cdot \text{Distance}(e) + \beta \cdot \text{Time}(e) + \gamma \cdot \text{Energy}(e) + \delta \cdot \text{Risk}(e)$$
where:
- $\text{Time}(e) = \text{base\_dist} / \text{speed\_factor}$
- $\text{Energy}(e) = \text{base\_dist} \times \text{energy\_factor}$
- $\text{Risk}(e) = \text{base\_dist} \times \text{risk\_factor}$
- All coefficients $\alpha, \beta, \gamma, \delta \ge 0$.
The problem is transformed into a standard shortest-path query over non-negative scalar weights.

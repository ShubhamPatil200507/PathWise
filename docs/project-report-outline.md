# PathWise College Major Project Formal Report Outline

## 1. Abstract
Comprehensive 250-word synthesis of problem statement, algorithmic implementations (BFS, Dijkstra, A*, Greedy, D* Lite), full-stack architecture, experimental benchmark findings, and major project conclusions.

## 2. Introduction & Background
- Historical evolution of graph search algorithms.
- Industry relevance in autonomous robotics, automated guided vehicles (AGV), game AI, and logistics routing.
- Problem scope and research hypotheses.

## 3. Literature Review
- Dijkstra (1959): Note on two problems in connexion with graphs.
- Hart, Nilsson, Raphael (1968): Formal basis for heuristic determination of minimum cost paths.
- Koenig & Likhachev (2002): D* Lite formulation and incremental search trees.
- Multi-criteria decision making in path planning.
- Comparative survey of existing pathfinding visualizers and their academic limitations.

## 4. Requirements Specification
- Functional requirements (Environment builder, Algorithm engine, Dynamic replanner, Benchmark suite, Persistence).
- Non-functional requirements (Rendering throughput, Sub-millisecond execution, Admissibility preservation, Accessibility).

## 5. System Design & Architecture
- High-level block diagram.
- Dual-engine design rationale (Frontend canvas vs Backend headless runner).
- Database schema (Scenarios and Benchmark runs).
- RESTful API design.

## 6. Algorithm Design & Mathematical Formulation
- Custom Binary Min-Heap Priority Queue with secondary tie-breaking.
- Breadth-First Search (BFS) and proof of suboptimality on weighted graphs.
- Dijkstra's Algorithm and relaxation invariant proof.
- A* Heuristic Search, Admissibility, Consistency, and Octile distance.
- Greedy Best-First Search and concave barrier failure modes.
- D* Lite formulation, $g$ and $rhs$ values, and key modifier $k_m$.
- Multi-criteria scalarization model: $C(P) = \alpha D + \beta T + \gamma E + \delta R$.

## 7. Implementation Details
- Interactive Hi-DPI HTML5 Canvas grid engine.
- Decoupled generator-based step event stream.
- FastAPI asynchronous endpoints and Pydantic validation.
- Planar graph and road-network module.

## 8. Verification & Testing
- Unit testing methodology and test matrices.
- Algorithmic correctness assertions (Dijkstra vs A* $h=0$, unreachable target).
- Corner-cutting prevention verification.
- Backend API integration tests.

## 9. Experimental Benchmark Results & Discussion
- Quantitative analysis across grid dimensions ($15 \times 15$ to $50 \times 50$) and obstacle densities (10% to 45%).
- Exploration effort (nodes expanded vs discovered).
- Incremental replanning speedup analysis ($D^*$ Lite vs Scratch $A^*$).
- Multi-criteria trade-off findings.

## 10. Conclusion & Future Work
- Summary of verified outcomes against research hypotheses.
- Future research directions: Hierarchical Pathfinding (HPA*), Multi-Objective Pareto front generation, and continuous-space Any-Angle algorithms (Theta*).

## 11. References
- List of academic papers, peer-reviewed textbooks, and technical references.

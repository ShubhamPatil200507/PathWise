# PathWise C++ Algorithmic Engine & Benchmark Suite

This directory contains the standalone, high-performance C++ implementation of all pathfinding algorithms, custom data structures, incremental replanning engines, planar road networks, and Monte-Carlo benchmark suites for **PathWise**.

---

## 1. Algorithms & Data Structures Implemented in C++

All algorithms and data structures are implemented from scratch in modern, standard C++ (C++14/C++17) without third-party pathfinding libraries:

1. **Templated Binary Min-Heap Priority Queue (`include/pathwise/BinaryHeap.hpp`)**:
   - $\mathcal{O}(\log V)$ bubble-up insertion and sink-down extraction.
   - Secondary priority tie-breaking (favoring nodes with lower remaining heuristic $h(n)$ to target).
2. **Grid & Physics Representation (`include/pathwise/Grid.hpp`)**:
   - 4-directional and 8-directional neighbor generation.
   - **Strict corner-cutting prevention** across diagonal obstacle cells.
   - Weighted terrain support (Sand $2\times$, Mud $3\times$, Water $5\times$, Hazard Zone $10\times$).
3. **Breadth-First Search (BFS) (`include/pathwise/BFS.hpp`)**:
   - FIFO queue level-by-level traversal.
   - Optimal edge-hop count on unweighted graphs; suboptimal on weighted terrain.
4. **Dijkstra's Algorithm (`include/pathwise/Dijkstra.hpp`)**:
   - Non-negative edge weight relaxation.
   - Guaranteed minimum scalar path cost with $\mathcal{O}((V + E) \log V)$ complexity.
5. **A* Heuristic Search (`include/pathwise/AStar.hpp`)**:
   - $f(n) = g(n) + h(n)$ with Manhattan, Octile, Euclidean, Chebyshev, and Zero heuristics.
   - Admissibility preserved on weighted terrain through minimum weight scaling factor:
     $$h_{\text{scaled}}(n) = h_{\text{raw}}(n) \times \min_{v \in V} (W_v)$$
6. **Greedy Best-First Search (`include/pathwise/Greedy.hpp`)**:
   - Rapid node expansion prioritizing $h(n)$ alone.
7. **D* Lite Incremental Replanning (`include/pathwise/DStarLite.hpp`)**:
   - Koenig & Likhachev formulation with $g$ and $rhs$ values, key modifier $k_m$, and localized inconsistency updates.
   - Re-evaluates only affected vertices rather than restarting search from scratch.
8. **Planar Road Network Graph Engine (`include/pathwise/RoadNetwork.hpp`)**:
   - Planar road networks with named intersections and weighted road segments.
   - Dijkstra and A* routing on arbitrary graphs.
9. **Monte-Carlo Benchmark Suite (`include/pathwise/Benchmarks.hpp`)**:
   - Automated evaluation across grid sizes ($15 \times 15$ to $50 \times 50$) and obstacle densities (10% to 45%).
   - Direct CSV export of all trial runs.

---

## 2. Compilation and Execution

### Prerequisites
- Any standard C++ compiler: GCC (g++ 5+), Clang, or MSVC.
- (Optional) CMake 3.10+

### Option A: Direct Compilation with g++

#### 1. Run the Test Suite:
```bash
cd cpp/tests
g++ -std=c++14 -O2 test_algorithms.cpp -o test_algorithms.exe
./test_algorithms.exe
```

#### 2. Run the Interactive CLI Application:
```bash
cd cpp/src
g++ -std=c++14 -O2 main.cpp -o pathwise_cli.exe
./pathwise_cli.exe
```

### Option B: Using CMake
```bash
cd cpp
mkdir build && cd build
cmake ..
cmake --build .
ctest --verbose
./pathwise_cli
```

---

## 3. Verified Test Suite Output

```
==========================================================
   PathWise C++ Algorithmic Verification Test Suite
==========================================================
[RUNNING] testBinaryHeap...                         -> PASSED
[RUNNING] testHeuristics...                         -> PASSED
[RUNNING] testCornerCuttingPrevention...            -> PASSED
[RUNNING] testBFSOptimality...                      -> PASSED
[RUNNING] testDijkstraAStarZeroEquivalence...       -> PASSED
[RUNNING] testAStarExpansionEfficiency...           -> PASSED
[RUNNING] testUnreachableDestination...             -> PASSED
[RUNNING] testDStarLiteReplanning...                -> PASSED
[RUNNING] testRoadNetwork...                        -> PASSED

>>> ALL 9 C++ ALGORITHM TEST SUITES PASSED CLEANLY! <<<
```

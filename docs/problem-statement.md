# Problem Statement & Research Objectives

## 1. Problem Statement
Shortest pathfinding and route optimization are central challenges across computer science, robotics, logistics, network routing, and geographic information systems (GIS). While standard textbook treatments focus on simple, unweighted static grid search, real-world navigation occurs within dynamic, uncertain, and heterogeneous environments with varying terrain traversal resistance, localized obstacles, multiple competing optimization criteria, and real-time environmental changes.

Existing interactive educational visualizers suffer from several critical shortcomings:
1. **Unweighted Assumptions**: Many platforms treat all cells identically, obscuring how terrain costs alter optimal paths.
2. **Disconnected Algorithms**: Implementations frequently evaluate algorithms on differing random graphs or topologies, invalidating direct head-to-head performance comparisons.
3. **Absence of Incremental Replanning**: When obstacles appear along a designated trajectory, existing tools rerun search from scratch rather than demonstrating incremental replanning algorithms (e.g., D* Lite).
4. **Superficial Metrics**: Visualizers often report arbitrary animation frames or artificial delays as "execution time," fabricating performance metrics rather than measuring genuine CPU runtimes and memory allocations.

## 2. Core Research Question
> **"How do uninformed search (BFS), weighted shortest-path search (Dijkstra), heuristic-guided search (A*, Greedy Best-First), and incremental replanning algorithms (D* Lite) differ in path quality, exploration effort (nodes expanded vs discovered), execution runtime, and responsiveness across environments of varying dimensions (15x15 to 100x100), obstacle densities (0% to 50%), and terrain resistance?"**

## 3. Project Objectives
1. **Algorithmic Rigor**: Implement BFS, Dijkstra, A*, Greedy Best-First, and D* Lite from scratch without external pathfinding libraries.
2. **Fair Comparative Evaluation**: Subject all algorithms to identical start/goal nodes, movement rules (4-way vs 8-way with corner-cutting prevention), and terrain cost models.
3. **Live State Inspection**: Render real-time mathematical breakdowns of $g(n)$, $h(n)$, and $f(n)$ during exploration.
4. **Dynamic Environmental Invalidation**: Enable live obstacle insertion and measure the speedup of D* Lite's incremental tree re-use over recomputing from scratch.
5. **Multi-Criteria Scalarization**: Support balancing distance, travel time, energy consumption, and risk under user-defined weights.
6. **Reproducible Benchmarking**: Execute statistical multi-run experiments with standard deviation tracking and raw CSV export.

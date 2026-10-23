# PathWise — Interactive Pathfinding & Route Optimization

> 🌐 **Live Website**: [https://shubhampatil200507.github.io/PathWise/](https://shubhampatil200507.github.io/PathWise/)

An interactive visualizer and benchmarking tool for graph search and pathfinding algorithms. Designed and built from scratch without external pathfinding libraries, featuring implementations in **C++**, **TypeScript**, and **Python**.

---

## What is PathWise?

PathWise allows you to construct custom maps, draw obstacles, paint terrain with different movement costs (like water and mud), and watch pathfinding algorithms search for the target step by step.

### Key Features

1. **Interactive Visualizer**
   - Click and drag to draw walls or terrain (Water, Mud, Sand).
   - Real-time step-by-step animation with pause, resume, step, and instant solve.
   - Live inspector explaining each step in plain English (showing distance from start $g$, estimated distance to goal $h$, and total score $f$).

2. **Side-by-Side Algorithm Comparison (All 5 Algorithms)**
   - Run all 5 algorithms (A*, Dijkstra, BFS, Greedy, D* Lite) on the exact same map simultaneously.
   - Compare cells explored, final path cost, and execution time with clear bar charts.
   - Plain-English takeaways explaining why one algorithm performed better on that specific map.

3. **Live Map Navigation & Routing**
   - Navigate real city road networks across Mumbai, New York, and London.
   - Street, dark, and satellite tile views with turn-by-turn landmark directions.
   - Test dynamic replanning by closing roads directly on the map to trigger D* Lite rerouting.

4. **Speed & Efficiency Test (All 5 Algorithms)**
   - Benchmark A*, Dijkstra, BFS, Greedy, and D* Lite across different map sizes and densities.
   - Interactive runtime and cell expansion charts with instant CSV download.

5. **Save & Load Custom Maps**
   - Save your custom mazes locally or export/import them as JSON files.

---

## Algorithms Implemented

All algorithms are implemented from scratch with custom min-heaps:

| Algorithm | Type | Finds Shortest Path? | Good For |
|---|---|---|---|
| **A\* Search** | Heuristic Guided | Yes (with admissible heuristic) | Fast and optimal pathfinding |
| **Dijkstra** | Uniform Cost | Yes (always guaranteed) | Weighted terrain where edge costs vary |
| **Breadth-First Search (BFS)** | Uninformed | Only on unweighted grids | Fewest hops (ignores terrain costs) |
| **Greedy Best-First** | Heuristic Only | No | Extremely fast exploration when obstacles are sparse |
| **D\* Lite** | Incremental Replanning | Yes | Repairing existing paths when new walls appear |

---

## Project Structure

```
pathwise/
├── cpp/                  # C++14/C++17 pathfinding engine & tests
│   ├── include/pathwise/ # Core headers: binary_heap, grid, astar, dijkstra, etc.
│   └── tests/            # Native C++ test suite
├── frontend/             # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/components/   # Clean, focused UI components
│   ├── src/core/         # TypeScript algorithm engine & binary heap
│   └── src/test/         # Vitest unit test suite
└── backend/              # Python FastAPI REST service
    ├── app/core/         # Python algorithm engine
    └── tests/            # Pytest test suite
```

---

## Quickstart

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Backend (Python FastAPI) - Optional
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
API runs at [http://localhost:8000](http://localhost:8000).

### C++ Engine
```bash
cd cpp
mkdir build && cd build
cmake ..
cmake --build .
ctest --output-on-failure
```

---

## Running Tests

- **Frontend tests** (13 Vitest tests):
  ```bash
  cd frontend && npm test
  ```
- **Backend tests** (8 Pytest tests):
  ```bash
  cd backend && python -m pytest tests/ -v
  ```
- **C++ tests** (9 test cases):
  ```bash
  g++ -std=c++17 -Icpp/include cpp/tests/test_algorithms.cpp -o cpp_tests && ./cpp_tests
  ```

---

## License

MIT License. Built by [Shubham Patil](https://github.com/ShubhamPatil200507).

# Testing & Quality Assurance Strategy

## 1. Overview
PathWise enforces strict automated testing across both the frontend TypeScript engine and the backend Python FastAPI service. Every algorithmic invariant is empirically verified by automated test assertions.

---

## 2. Unit Testing Suite

### Frontend Vitest Suite (`frontend/src/test/core.test.ts`)
1. **BinaryHeap Correctness**:
   - Extraction of minimum priority elements in ascending order.
   - Secondary priority tie-breaking.
   - Dynamic size tracking and empty-queue state handling.
2. **Heuristics & Admissibility**:
   - Manhattan distance computation ($L_1$ norm).
   - Octile distance computation for 8-way diagonal steps.
   - Zero heuristic invariance ($h(n) = 0$).
3. **Corner-Cutting Prevention**:
   - Verification that diagonal movements across two adjacent solid walls are strictly blocked.
4. **Algorithm Invariants**:
   - BFS optimality on unweighted grid topology.
   - Dijkstra vs A* zero-heuristic strict equality on weighted maps.
   - A* search expanding fewer nodes than Dijkstra on open terrain.
   - Complete detection of unreachable destinations without infinite looping.
   - Greedy Best-First execution and flagging of `isOptimal: false`.
   - D* Lite incremental replanning upon dynamic obstacle insertion.

### Backend Pytest Suite (`backend/tests/test_backend.py`)
1. **Python BinaryHeap Implementation**:
   - FIFO/Priority ordering and heap property maintenance.
2. **Python Heuristics**:
   - Admissibility scaling by minimum terrain cost.
3. **Python Corner-Cutting**:
   - Enforcing collision-free diagonal physics.
4. **Python Dijkstra vs A* ($h=0$) Equivalence**:
   - Numerical match within $10^{-4}$ tolerance.
5. **Python D* Lite Engine**:
   - Replanning and diversion around blocked path midpoints.
6. **API Integration Tests**:
   - `GET /api/health` response verification.
   - `POST /api/pathfinding/run` payload parsing and metric computation.
   - `POST /api/scenarios`, `GET /api/scenarios/{id}`, `DELETE /api/scenarios/{id}` full CRUD lifecycle.

---

## 3. Test Execution Commands

### Running Frontend Tests
```bash
cd frontend
npm test
```

### Running Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.heap import BinaryHeap
from app.core.heuristics import calculate_heuristic
from app.core.grid import get_valid_neighbors
from app.core.types import GridCell, GridCoord
from app.core.bfs import run_bfs
from app.core.dijkstra import run_dijkstra
from app.core.astar import run_astar
from app.core.greedy import run_greedy
from app.core.dlite import DStarLitePythonEngine

client = TestClient(app)

def test_binary_heap():
    pq = BinaryHeap[str]()
    pq.push("c", 30.0)
    pq.push("a", 10.0)
    pq.push("b", 20.0)
    assert len(pq) == 3
    assert pq.pop()[2] == "a"
    assert pq.pop()[2] == "b"
    assert pq.pop()[2] == "c"
    assert pq.is_empty()

def test_heuristics():
    a = GridCoord(r=0, c=0)
    b = GridCoord(r=3, c=4)
    assert calculate_heuristic(a, b, 'manhattan') == 7.0
    assert calculate_heuristic(a, b, 'zero') == 0.0

def test_corner_cutting_prevention():
    rows, cols = 5, 5
    grid = [[GridCell(r=r, c=c) for c in range(cols)] for r in range(rows)]
    grid[1][2].type = 'wall'
    grid[2][3].type = 'wall'

    # (2,2) to (1,3) diagonally should be blocked by corner cutting rule
    neighbors = get_valid_neighbors(grid, rows, cols, GridCoord(r=2, c=2), '8-directional')
    coords = [(n[0].r, n[0].c) for n in neighbors]
    assert (1, 3) not in coords

def test_dijkstra_astar_zero_heuristic_equivalence():
    rows, cols = 8, 8
    grid = [[GridCell(r=r, c=c) for c in range(cols)] for r in range(rows)]
    grid[1][2].type = 'mud'
    grid[1][2].weight = 3.0
    grid[1][3].type = 'water'
    grid[1][3].weight = 5.0

    start = GridCoord(r=1, c=1)
    target = GridCoord(r=1, c=5)

    d_res = run_dijkstra(grid, rows, cols, start, target, '4-directional')
    a_res = run_astar(grid, rows, cols, start, target, '4-directional', heuristic='zero')

    assert d_res.metrics.found is True
    assert a_res.metrics.found is True
    assert abs(d_res.metrics.path_cost - a_res.metrics.path_cost) < 1e-4

def test_dlite_python_replanning():
    rows, cols = 10, 10
    grid = [[GridCell(r=r, c=c) for c in range(cols)] for r in range(rows)]
    start = GridCoord(r=2, c=2)
    goal = GridCoord(r=2, c=7)

    engine = DStarLitePythonEngine(grid, rows, cols, start, goal, '4-directional')
    initial = engine.run_initial_search()
    assert initial.metrics.found is True
    assert initial.metrics.path_cost == 5.0

    # Block path
    replan_ms, path, cost = engine.replan_after_changes([(2, 4, 'wall')])
    assert len(path) > 0
    assert (2, 4) not in [(p.r, p.c) for p in path]

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "astar" in data["algorithms"]

def test_api_pathfinding_run():
    rows, cols = 6, 6
    grid = [[{"r": r, "c": c, "type": "empty", "weight": 1.0, "risk": 0.05, "energy_factor": 1.0} for c in range(cols)] for r in range(rows)]
    payload = {
        "algorithm": "astar",
        "rows": rows,
        "cols": cols,
        "start": {"r": 1, "c": 1},
        "target": {"r": 4, "c": 4},
        "movement": "4-directional",
        "heuristic": "manhattan",
        "grid": grid,
        "record_events": True
    }
    res = client.post("/api/pathfinding/run", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["metrics"]["found"] is True
    assert len(data["path"]) > 0

def test_api_scenario_crud():
    rows, cols = 5, 5
    grid = [[{"r": r, "c": c, "type": "empty", "weight": 1.0, "risk": 0.05, "energy_factor": 1.0} for c in range(cols)] for r in range(rows)]
    payload = {
        "name": "Test Scenario Alpha",
        "description": "Integration test scenario",
        "rows": rows,
        "cols": cols,
        "start": {"r": 0, "c": 0},
        "target": {"r": 4, "c": 4},
        "movement": "4-directional",
        "grid": grid
    }
    # Create
    create_res = client.post("/api/scenarios", json=payload)
    assert create_res.status_code == 201
    scen_id = create_res.json()["id"]

    # Read
    get_res = client.get(f"/api/scenarios/{scen_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Test Scenario Alpha"

    # Delete
    del_res = client.delete(f"/api/scenarios/{scen_id}")
    assert del_res.status_code == 200

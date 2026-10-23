from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from ..models.schemas import PathfindingRunRequest, PathfindingCompareRequest, PathfindingReplanRequest
from ..core.runner import run_algorithm_python
from ..core.dlite import DStarLitePythonEngine
from ..core.types import PathfindingResult, AlgorithmMetrics

router = APIRouter(prefix="/api/pathfinding", tags=["Pathfinding"])

@router.post("/run", response_model=PathfindingResult)
def execute_pathfinding(req: PathfindingRunRequest):
    try:
        result = run_algorithm_python(
            algorithm=req.algorithm,
            grid=req.grid,
            rows=req.rows,
            cols=req.cols,
            start=req.start,
            target=req.target,
            movement=req.movement,
            heuristic=req.heuristic,
            weights=req.weights,
            record_events=req.record_events
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Pathfinding execution error: {str(e)}")

@router.post("/compare")
def compare_pathfinding(req: PathfindingCompareRequest) -> Dict[str, Any]:
    try:
        results = {}
        for algo in req.algorithms:
            res = run_algorithm_python(
                algorithm=algo,
                grid=req.grid,
                rows=req.rows,
                cols=req.cols,
                start=req.start,
                target=req.target,
                movement=req.movement,
                heuristic=req.heuristic,
                weights=req.weights,
                record_events=False
            )
            results[algo] = {
                "metrics": res.metrics.model_dump(),
                "path_length": len(res.path),
                "path_cost": res.metrics.path_cost,
                "found": res.metrics.found,
                "execution_time_ms": res.metrics.execution_time_ms,
                "nodes_expanded": res.metrics.nodes_expanded,
                "nodes_discovered": res.metrics.nodes_discovered,
                "max_frontier_size": res.metrics.max_frontier_size,
            }
        return {"comparison": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Comparison execution error: {str(e)}")

@router.post("/replan")
def replan_pathfinding(req: PathfindingReplanRequest) -> Dict[str, Any]:
    try:
        # Initialize D* Lite
        dlite = DStarLitePythonEngine(
            grid=req.grid,
            rows=req.rows,
            cols=req.cols,
            start=req.start,
            goal=req.target,
            movement=req.movement
        )
        initial_res = dlite.run_initial_search()

        changes = [(c.r, c.c, c.new_type) for c in req.changed_cells]
        replan_time_ms, replanned_path, replanned_cost = dlite.replan_after_changes(changes)

        # For experimental comparison, also measure scratch A* replan time on modified grid
        modified_grid = [[cell for cell in row] for row in req.grid]
        for c in req.changed_cells:
            modified_grid[c.r][c].type = c.new_type

        scratch_res = run_algorithm_python(
            algorithm='astar',
            grid=modified_grid,
            rows=req.rows,
            cols=req.cols,
            start=req.start,
            target=req.target,
            movement=req.movement,
            record_events=False
        )

        return {
            "dlite": {
                "initial_cost": initial_res.metrics.path_cost,
                "replanned_cost": replanned_cost,
                "replanning_time_ms": replan_time_ms,
                "path": [p.model_dump() for p in replanned_path],
                "nodes_expanded": dlite.nodes_expanded,
            },
            "scratch_astar": {
                "execution_time_ms": scratch_res.metrics.execution_time_ms,
                "cost": scratch_res.metrics.path_cost,
                "nodes_expanded": scratch_res.metrics.nodes_expanded,
            },
            "speedup_factor": round(scratch_res.metrics.execution_time_ms / max(0.001, replan_time_ms), 2)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Replanning error: {str(e)}")

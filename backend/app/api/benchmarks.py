import json
import random
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..db.session import get_db
from ..models.database import BenchmarkRunModel
from ..models.schemas import BenchmarkRunRequest, BenchmarkResponse, BenchmarkItemResult
from ..core.types import GridCell, GridCoord
from ..core.runner import run_algorithm_python

router = APIRouter(prefix="/api/benchmarks", tags=["Benchmarks"])

def generate_benchmark_grid(size: int, density: float, start: GridCoord, target: GridCoord) -> List[List[GridCell]]:
    grid = []
    for r in range(size):
        row = []
        for c in range(size):
            if (r == start.r and c == start.c) or (r == target.r and c == target.c):
                cell_type = 'empty'
                weight = 1.0
            else:
                rand = random.random()
                if rand < density:
                    cell_type = 'wall'
                    weight = float('inf')
                elif rand < density + 0.15:
                    cell_type = 'mud'
                    weight = 3.0
                else:
                    cell_type = 'empty'
                    weight = 1.0
            row.append(GridCell(r=r, c=c, type=cell_type, weight=weight))
        grid.append(row)
    return grid

@router.post("/run", response_model=BenchmarkResponse)
def execute_benchmark(req: BenchmarkRunRequest, db: Session = Depends(get_db)):
    results: List[BenchmarkItemResult] = []

    for size in req.grid_sizes:
        start = GridCoord(r=1, c=1)
        target = GridCoord(r=size - 2, c=size - 2)

        for density in req.obstacle_densities:
            for rep in range(1, req.repetitions + 1):
                # Deterministic seed per repetition to guarantee identical graph across all algorithms!
                random.seed(42 + rep * 100 + size * 10 + int(density * 100))
                grid = generate_benchmark_grid(size, density, start, target)

                for algo in req.algorithms:
                    res = run_algorithm_python(
                        algorithm=algo,
                        grid=grid,
                        rows=size,
                        cols=size,
                        start=start,
                        target=target,
                        movement=req.movement,
                        record_events=False
                    )

                    results.append(BenchmarkItemResult(
                        algorithm=algo,
                        grid_size=size,
                        obstacle_density=density,
                        repetition=rep,
                        found=res.metrics.found,
                        path_cost=res.metrics.path_cost,
                        nodes_expanded=res.metrics.nodes_expanded,
                        nodes_discovered=res.metrics.nodes_discovered,
                        max_frontier_size=res.metrics.max_frontier_size,
                        execution_time_ms=res.metrics.execution_time_ms
                    ))

    # Calculate empirical summary by algorithm
    summary: Dict[str, Dict[str, float]] = {}
    for algo in req.algorithms:
        algo_runs = [r for r in results if r.algorithm == algo]
        if algo_runs:
            avg_time = sum(r.execution_time_ms for r in algo_runs) / len(algo_runs)
            avg_expanded = sum(r.nodes_expanded for r in algo_runs) / len(algo_runs)
            avg_cost = sum(r.path_cost for r in algo_runs if r.found) / max(1, len([r for r in algo_runs if r.found]))
            success_rate = (len([r for r in algo_runs if r.found]) / len(algo_runs)) * 100.0

            summary[algo] = {
                "avg_execution_time_ms": round(avg_time, 3),
                "avg_nodes_expanded": round(avg_expanded, 1),
                "avg_path_cost": round(avg_cost, 2),
                "success_rate_percent": round(success_rate, 1)
            }

    # Persist in DB
    record = BenchmarkRunModel(
        total_runs=len(results),
        results_json=json.dumps([r.model_dump() for r in results]),
        summary_json=json.dumps(summary)
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return BenchmarkResponse(
        id=record.id,
        created_at=record.created_at.isoformat(),
        total_runs=record.total_runs,
        results=results,
        summary_by_algorithm=summary
    )

@router.get("", response_model=List[Dict[str, Any]])
def list_benchmarks(db: Session = Depends(get_db)):
    records = db.query(BenchmarkRunModel).order_by(BenchmarkRunModel.id.desc()).all()
    out = []
    for r in records:
        out.append({
            "id": r.id,
            "created_at": r.created_at.isoformat() if r.created_at else "",
            "total_runs": r.total_runs,
            "summary": json.loads(r.summary_json)
        })
    return out

@router.get("/{benchmark_id}", response_model=BenchmarkResponse)
def get_benchmark(benchmark_id: int, db: Session = Depends(get_db)):
    record = db.query(BenchmarkRunModel).filter(BenchmarkRunModel.id == benchmark_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Benchmark record not found")

    raw_results = json.loads(record.results_json)
    results = [BenchmarkItemResult(**r) for r in raw_results]
    summary = json.loads(record.summary_json)

    return BenchmarkResponse(
        id=record.id,
        created_at=record.created_at.isoformat() if record.created_at else "",
        total_runs=record.total_runs,
        results=results,
        summary_by_algorithm=summary
    )

@router.get("/export/csv")
def export_benchmarks_csv(db: Session = Depends(get_db)):
    records = db.query(BenchmarkRunModel).order_by(BenchmarkRunModel.id.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "benchmark_id", "created_at", "algorithm", "grid_size",
        "obstacle_density", "repetition", "found", "path_cost",
        "nodes_expanded", "nodes_discovered", "max_frontier_size", "execution_time_ms"
    ])

    for r in records:
        items = json.loads(r.results_json)
        for it in items:
            writer.writerow([
                r.id,
                r.created_at.isoformat() if r.created_at else "",
                it.get("algorithm"),
                it.get("grid_size"),
                it.get("obstacle_density"),
                it.get("repetition"),
                it.get("found"),
                it.get("path_cost"),
                it.get("nodes_expanded"),
                it.get("nodes_discovered"),
                it.get("max_frontier_size"),
                it.get("execution_time_ms")
            ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pathwise_benchmarks.csv"}
    )

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.session import init_db
from .api.pathfinding import router as pathfinding_router
from .api.scenarios import router as scenarios_router
from .api.benchmarks import router as benchmarks_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

# Also initialize database on import to ensure test clients and scripts have tables ready
init_db()

app = FastAPI(
    title="PathWise — Intelligent Pathfinding & Route Optimization Platform API",
    description="High-performance backend API for graph-search algorithm execution, benchmark suites, and scenario persistence.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "PathWise API Engine",
        "version": "1.0.0",
        "algorithms": ["bfs", "dijkstra", "astar", "greedy", "dlite"]
    }

app.include_router(pathfinding_router)
app.include_router(scenarios_router)
app.include_router(benchmarks_router)

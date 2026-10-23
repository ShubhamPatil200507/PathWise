import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db.session import get_db
from ..models.database import ScenarioModel
from ..models.schemas import ScenarioCreate, ScenarioResponse
from ..core.types import GridCell, GridCoord

router = APIRouter(prefix="/api/scenarios", tags=["Scenarios"])

def model_to_response(item: ScenarioModel) -> ScenarioResponse:
    start_dict = json.loads(item.start_json)
    target_dict = json.loads(item.target_json)
    grid_raw = json.loads(item.grid_json)
    grid = [[GridCell(**cell) for cell in row] for row in grid_raw]

    return ScenarioResponse(
        id=item.id,
        name=item.name,
        description=item.description or "",
        rows=item.rows,
        cols=item.cols,
        start=GridCoord(**start_dict),
        target=GridCoord(**target_dict),
        movement=item.movement,
        grid=grid,
        created_at=item.created_at.isoformat() if item.created_at else "",
        updated_at=item.updated_at.isoformat() if item.updated_at else ""
    )

@router.get("", response_model=List[ScenarioResponse])
def list_scenarios(db: Session = Depends(get_db)):
    items = db.query(ScenarioModel).order_by(ScenarioModel.id.desc()).all()
    return [model_to_response(item) for item in items]

@router.post("", response_model=ScenarioResponse, status_code=201)
def create_scenario(req: ScenarioCreate, db: Session = Depends(get_db)):
    grid_serialized = [[cell.model_dump() for cell in row] for row in req.grid]
    item = ScenarioModel(
        name=req.name,
        description=req.description or "",
        rows=req.rows,
        cols=req.cols,
        start_json=json.dumps(req.start.model_dump()),
        target_json=json.dumps(req.target.model_dump()),
        movement=req.movement,
        grid_json=json.dumps(grid_serialized)
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return model_to_response(item)

@router.get("/{scenario_id}", response_model=ScenarioResponse)
def get_scenario(scenario_id: int, db: Session = Depends(get_db)):
    item = db.query(ScenarioModel).filter(ScenarioModel.id == scenario_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return model_to_response(item)

@router.put("/{scenario_id}", response_model=ScenarioResponse)
def update_scenario(scenario_id: int, req: ScenarioCreate, db: Session = Depends(get_db)):
    item = db.query(ScenarioModel).filter(ScenarioModel.id == scenario_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Scenario not found")

    item.name = req.name
    item.description = req.description or ""
    item.rows = req.rows
    item.cols = req.cols
    item.start_json = json.dumps(req.start.model_dump())
    item.target_json = json.dumps(req.target.model_dump())
    item.movement = req.movement
    item.grid_json = json.dumps([[c.model_dump() for c in r] for r in req.grid])

    db.commit()
    db.refresh(item)
    return model_to_response(item)

@router.delete("/{scenario_id}")
def delete_scenario(scenario_id: int, db: Session = Depends(get_db)):
    item = db.query(ScenarioModel).filter(ScenarioModel.id == scenario_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Scenario not found")
    db.delete(item)
    db.commit()
    return {"status": "deleted", "id": scenario_id}

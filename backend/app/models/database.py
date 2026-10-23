import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class ScenarioModel(Base):
    __tablename__ = 'scenarios'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, default="")
    rows = Column(Integer, default=25)
    cols = Column(Integer, default=35)
    start_json = Column(Text, nullable=False)
    target_json = Column(Text, nullable=False)
    movement = Column(String(30), default='4-directional')
    grid_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BenchmarkRunModel(Base):
    __tablename__ = 'benchmarks'

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    total_runs = Column(Integer, default=0)
    results_json = Column(Text, nullable=False)
    summary_json = Column(Text, nullable=False)

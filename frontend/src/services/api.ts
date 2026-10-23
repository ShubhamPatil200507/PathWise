import { GridCell, GridCoord, MovementMode, HeuristicType, MultiCriteriaWeights, PathfindingResult } from '../core/types';

const API_BASE = '/api';

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  algorithms: string[];
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

export async function runPathfindingApi(params: {
  algorithm: string;
  rows: number;
  cols: number;
  start: GridCoord;
  target: GridCoord;
  movement: MovementMode;
  heuristic: HeuristicType;
  weights?: MultiCriteriaWeights;
  grid: GridCell[][];
  recordEvents?: boolean;
}): Promise<PathfindingResult> {
  const res = await fetch(`${API_BASE}/pathfinding/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(err.detail || 'Pathfinding API request failed');
  }
  return res.json();
}

export async function comparePathfindingApi(params: {
  algorithms: string[];
  rows: number;
  cols: number;
  start: GridCoord;
  target: GridCoord;
  movement: MovementMode;
  heuristic: HeuristicType;
  weights?: MultiCriteriaWeights;
  grid: GridCell[][];
}) {
  const res = await fetch(`${API_BASE}/pathfinding/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error('Comparison API request failed');
  }
  return res.json();
}

export async function replanPathfindingApi(params: {
  rows: number;
  cols: number;
  start: GridCoord;
  target: GridCoord;
  movement: MovementMode;
  grid: GridCell[][];
  changed_cells: { r: number; c: number; new_type: string }[];
}) {
  const res = await fetch(`${API_BASE}/pathfinding/replan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error('Replanning API request failed');
  }
  return res.json();
}

export async function fetchScenariosApi() {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}

export async function saveScenarioApi(scenario: any) {
  const res = await fetch(`${API_BASE}/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario),
  });
  if (!res.ok) throw new Error('Failed to save scenario');
  return res.json();
}

export async function deleteScenarioApi(id: number) {
  const res = await fetch(`${API_BASE}/scenarios/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete scenario');
  return res.json();
}

export async function runBenchmarkApi(params: {
  algorithms: string[];
  grid_sizes: number[];
  obstacle_densities: number[];
  repetitions: number;
  movement: MovementMode;
}) {
  const res = await fetch(`${API_BASE}/benchmarks/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to run benchmark');
  return res.json();
}

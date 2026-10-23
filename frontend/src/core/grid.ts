import { CellType, GridCell, GridCoord, MovementMode, MultiCriteriaWeights } from './types';

export const SQRT_2 = Math.SQRT2;

export interface EdgeNeighbor {
  coord: GridCoord;
  cost: number;
  baseDistance: number;
  isDiagonal: boolean;
}

export function createEmptyGrid(rows: number, cols: number): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        r,
        c,
        type: 'empty',
        weight: 1,
        risk: 0.05,
        energyFactor: 1.0,
      });
    }
    grid.push(row);
  }
  return grid;
}

export function coordsEqual(a: GridCoord, b: GridCoord): boolean {
  return a.r === b.r && a.c === b.c;
}

export function coordKey(coord: GridCoord): string {
  return `${coord.r},${coord.c}`;
}

export function parseCoordKey(key: string): GridCoord {
  const parts = key.split(',');
  return { r: parseInt(parts[0], 10), c: parseInt(parts[1], 10) };
}

export function getTerrainAttributes(type: CellType) {
  switch (type) {
    case 'empty':
      return { weight: 1, risk: 0.05, energyFactor: 1.0, speedFactor: 1.0 };
    case 'sand':
      return { weight: 2, risk: 0.20, energyFactor: 1.8, speedFactor: 0.6 };
    case 'mud':
      return { weight: 3, risk: 0.35, energyFactor: 2.5, speedFactor: 0.4 };
    case 'water':
      return { weight: 5, risk: 0.60, energyFactor: 4.5, speedFactor: 0.25 };
    case 'zone':
      return { weight: 10, risk: 0.85, energyFactor: 3.0, speedFactor: 0.2 };
    case 'wall':
      return { weight: Infinity, risk: 1.0, energyFactor: Infinity, speedFactor: 0 };
  }
}

/**
 * Calculates transition cost between node u and neighbor v.
 * Incorporates multi-criteria weights if provided:
 * Cost = alpha*Distance + beta*Time + gamma*Energy + delta*Risk
 */
export function calculateEdgeCost(
  _fromCell: GridCell,
  toCell: GridCell,
  isDiagonal: boolean,
  weights?: MultiCriteriaWeights
): number {
  const baseDist = isDiagonal ? SQRT_2 : 1.0;
  if (toCell.type === 'wall') return Infinity;

  const attr = getTerrainAttributes(toCell.type);

  if (!weights) {
    // Standard weighted terrain: base distance * cell weight
    return baseDist * attr.weight;
  }

  // Multi-criteria cost model
  // Time = distance / speed
  const travelTime = baseDist / attr.speedFactor;
  // Energy = distance * energyFactor
  const energy = baseDist * attr.energyFactor;
  // Risk = distance * risk
  const risk = baseDist * attr.risk * 10; // scaled for balance

  const totalCost =
    weights.alpha * baseDist +
    weights.beta * travelTime +
    weights.gamma * energy +
    weights.delta * risk;

  return Math.max(0.001, totalCost);
}

/**
 * Generates valid walkable neighbors for cell (r, c).
 * Strictly forbids corner-cutting through walls on diagonal moves!
 */
export function getValidNeighbors(
  grid: GridCell[][],
  rows: number,
  cols: number,
  coord: GridCoord,
  movement: MovementMode,
  multiCriteria?: MultiCriteriaWeights
): EdgeNeighbor[] {
  const { r, c } = coord;
  const neighbors: EdgeNeighbor[] = [];

  // Orthogonal directions (N, S, E, W)
  const orthogonalDirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  for (const dir of orthogonalDirs) {
    const nr = r + dir.dr;
    const nc = c + dir.dc;

    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      const neighborCell = grid[nr][nc];
      if (neighborCell.type !== 'wall') {
        const cost = calculateEdgeCost(grid[r][c], neighborCell, false, multiCriteria);
        neighbors.push({
          coord: { r: nr, c: nc },
          cost,
          baseDistance: 1.0,
          isDiagonal: false,
        });
      }
    }
  }

  // Diagonal directions (NE, NW, SE, SW) with corner-cutting prevention
  if (movement === '8-directional') {
    const diagonalDirs = [
      { dr: -1, dc: 1 },  // NE
      { dr: -1, dc: -1 }, // NW
      { dr: 1, dc: 1 },   // SE
      { dr: 1, dc: -1 },  // SW
    ];

    for (const dir of diagonalDirs) {
      const nr = r + dir.dr;
      const nc = c + dir.dc;

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        // Prevent corner-cutting: both adjacent orthogonal cells cannot be walls!
        // To safely traverse diagonally to (r+dr, c+dc), (r+dr, c) and (r, c+dc) must not be walls
        const orth1Blocked = grid[nr][c].type === 'wall';
        const orth2Blocked = grid[r][nc].type === 'wall';

        if (!orth1Blocked && !orth2Blocked) {
          const neighborCell = grid[nr][nc];
          if (neighborCell.type !== 'wall') {
            const cost = calculateEdgeCost(grid[r][c], neighborCell, true, multiCriteria);
            neighbors.push({
              coord: { r: nr, c: nc },
              cost,
              baseDistance: SQRT_2,
              isDiagonal: true,
            });
          }
        }
      }
    }
  }

  return neighbors;
}

/**
 * Reconstructs path backwards from target to start using parent pointers.
 * Independently recalculates actual accumulated path cost and geometric length.
 */
export function reconstructPath(
  parents: Map<string, GridCoord>,
  start: GridCoord,
  target: GridCoord,
  grid: GridCell[][],
  multiCriteria?: MultiCriteriaWeights
): { path: GridCoord[]; cost: number; geometricDistance: number } {
  const path: GridCoord[] = [];
  let curr: GridCoord | undefined = target;
  const startKey = coordKey(start);

  while (curr) {
    path.push(curr);
    if (coordKey(curr) === startKey) break;
    curr = parents.get(coordKey(curr));
  }

  // Reverse so path goes from start to target
  path.reverse();

  if (path.length === 0 || coordKey(path[0]) !== startKey) {
    return { path: [], cost: 0, geometricDistance: 0 };
  }

  // Independently recalculate true path cost & distance
  let totalCost = 0;
  let geometricDist = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const isDiag = u.r !== v.r && u.c !== v.c;
    const baseDist = isDiag ? SQRT_2 : 1.0;
    geometricDist += baseDist;
    const stepCost = calculateEdgeCost(grid[u.r][u.c], grid[v.r][v.c], isDiag, multiCriteria);
    totalCost += stepCost;
  }

  return { path, cost: totalCost, geometricDistance: geometricDist };
}

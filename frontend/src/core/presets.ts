import { CellType, GridCell, GridCoord } from './types';
import { createEmptyGrid } from './grid';

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  rows: number;
  cols: number;
  start: GridCoord;
  target: GridCoord;
  generate: () => GridCell[][];
}

export function generateRandomMap(
  rows: number,
  cols: number,
  obstacleDensity: number = 0.25,
  terrainDensity: number = 0.15,
  start: GridCoord = { r: Math.floor(rows / 2), c: 2 },
  target: GridCoord = { r: Math.floor(rows / 2), c: cols - 3 }
): GridCell[][] {
  const grid = createEmptyGrid(rows, cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r === start.r && c === start.c) || (r === target.r && c === target.c)) {
        continue;
      }
      const rand = Math.random();
      if (rand < obstacleDensity) {
        grid[r][c].type = 'wall';
        grid[r][c].weight = Infinity;
      } else if (rand < obstacleDensity + terrainDensity) {
        // distribute mud, sand, water, zone
        const sub = Math.random();
        if (sub < 0.35) {
          grid[r][c].type = 'mud';
          grid[r][c].weight = 3;
        } else if (sub < 0.65) {
          grid[r][c].type = 'sand';
          grid[r][c].weight = 2;
        } else if (sub < 0.85) {
          grid[r][c].type = 'water';
          grid[r][c].weight = 5;
        } else {
          grid[r][c].type = 'zone';
          grid[r][c].weight = 10;
        }
      }
    }
  }

  return grid;
}

/**
 * Generates an academically rigorous Recursive Division Maze.
 */
export function generateRecursiveDivisionMaze(rows: number, cols: number): GridCell[][] {
  const grid = createEmptyGrid(rows, cols);

  // Outer border
  for (let r = 0; r < rows; r++) {
    grid[r][0].type = 'wall';
    grid[r][cols - 1].type = 'wall';
  }
  for (let c = 0; c < cols; c++) {
    grid[0][c].type = 'wall';
    grid[rows - 1][c].type = 'wall';
  }

  function divide(r1: number, r2: number, c1: number, c2: number) {
    if (r2 - r1 < 2 || c2 - c1 < 2) return;

    const horizontal = r2 - r1 > c2 - c1;

    if (horizontal) {
      // Horizontal wall
      const wallR = Math.floor(Math.random() * (r2 - r1 - 1)) + r1 + 1;
      const passageC = Math.floor(Math.random() * (c2 - c1 + 1)) + c1;

      for (let c = c1; c <= c2; c++) {
        if (c !== passageC) {
          grid[wallR][c].type = 'wall';
        }
      }

      divide(r1, wallR - 1, c1, c2);
      divide(wallR + 1, r2, c1, c2);
    } else {
      // Vertical wall
      const wallC = Math.floor(Math.random() * (c2 - c1 - 1)) + c1 + 1;
      const passageR = Math.floor(Math.random() * (r2 - r1 + 1)) + r1;

      for (let r = r1; r <= r2; r++) {
        if (r !== passageR) {
          grid[r][wallC].type = 'wall';
        }
      }

      divide(r1, r2, c1, wallC - 1);
      divide(r1, r2, wallC + 1, c2);
    }
  }

  divide(1, rows - 2, 1, cols - 2);

  // Clear corners
  grid[1][1].type = 'empty';
  grid[rows - 2][cols - 2].type = 'empty';

  return grid;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'empty-grid',
    name: '1. Empty Grid Baseline',
    description: 'Clean uniform open environment for baseline path cost and heuristic behavior testing.',
    rows: 25,
    cols: 35,
    start: { r: 12, c: 4 },
    target: { r: 12, c: 30 },
    generate: () => createEmptyGrid(25, 35),
  },
  {
    id: 'recursive-maze',
    name: '2. Recursive Division Maze',
    description: 'Complex recursive maze structure with dead ends to test A* and Dijkstra exploration pruning.',
    rows: 25,
    cols: 35,
    start: { r: 1, c: 1 },
    target: { r: 23, c: 33 },
    generate: () => generateRecursiveDivisionMaze(25, 35),
  },
  {
    id: 'narrow-corridor',
    name: '3. Narrow Corridor Bottleneck',
    description: 'A forced bottleneck corridor flanked by solid walls demonstrating congestion & single-passage routing.',
    rows: 25,
    cols: 35,
    start: { r: 12, c: 4 },
    target: { r: 12, c: 30 },
    generate: () => {
      const g = createEmptyGrid(25, 35);
      const midC = 17;
      for (let r = 0; r < 25; r++) {
        if (r !== 12 && r !== 13) {
          g[r][midC].type = 'wall';
        }
      }
      return g;
    },
  },
  {
    id: 'dense-obstacles',
    name: '4. Dense Obstacle Field (35%)',
    description: 'High-density randomized obstacles testing algorithm resilience against dead ends.',
    rows: 25,
    cols: 35,
    start: { r: 3, c: 3 },
    target: { r: 21, c: 31 },
    generate: () => generateRandomMap(25, 35, 0.35, 0.0, { r: 3, c: 3 }, { r: 21, c: 31 }),
  },
  {
    id: 'weighted-terrain',
    name: '5. Multi-Terrain Biome',
    description: 'Patches of Sand (2x), Mud (3x), Water (5x) and Hazard Zones (10x). Highlights Dijkstra/A* vs BFS.',
    rows: 25,
    cols: 35,
    start: { r: 12, c: 3 },
    target: { r: 12, c: 31 },
    generate: () => {
      const g = createEmptyGrid(25, 35);
      // Create a vertical river of water
      for (let r = 0; r < 25; r++) {
        g[r][16].type = 'water';
        g[r][16].weight = 5;
        g[r][17].type = 'water';
        g[r][17].weight = 5;
      }
      // Shallow sand bridge at bottom
      g[22][16].type = 'sand';
      g[22][16].weight = 2;
      g[22][17].type = 'sand';
      g[22][17].weight = 2;

      // Mud swamp in top center
      for (let r = 2; r < 10; r++) {
        for (let c = 8; c < 15; c++) {
          g[r][c].type = 'mud';
          g[r][c].weight = 3;
        }
      }

      // High hazard zone in center
      for (let r = 9; r < 16; r++) {
        for (let c = 12; c < 16; c++) {
          g[r][c].type = 'zone';
          g[r][c].weight = 10;
        }
      }
      return g;
    },
  },
  {
    id: 'multiple-routes',
    name: '6. Competing Routes (Cost vs Distance)',
    description: 'Direct route is short but filled with expensive water; detour is longer geometrically but zero terrain cost.',
    rows: 25,
    cols: 35,
    start: { r: 12, c: 4 },
    target: { r: 12, c: 30 },
    generate: () => {
      const g = createEmptyGrid(25, 35);
      // Wall barrier splitting top and bottom
      for (let c = 10; c <= 24; c++) {
        g[8][c].type = 'wall';
        g[16][c].type = 'wall';
      }
      // Center route filled with high cost water (weight 5)
      for (let r = 9; r <= 15; r++) {
        for (let c = 12; c <= 22; c++) {
          g[r][c].type = 'water';
          g[r][c].weight = 5;
        }
      }
      return g;
    },
  },
  {
    id: 'unreachable-destination',
    name: '7. Unreachable Enclosed Destination',
    description: 'Target surrounded completely by solid walls. Verifies robust failure handling without infinite loops.',
    rows: 25,
    cols: 35,
    start: { r: 12, c: 4 },
    target: { r: 12, c: 28 },
    generate: () => {
      const g = createEmptyGrid(25, 35);
      const tr = 12;
      const tc = 28;
      // Enclose target with walls
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (Math.abs(dr) === 2 || Math.abs(dc) === 2) {
            g[tr + dr][tc + dc].type = 'wall';
          }
        }
      }
      return g;
    },
  },
  {
    id: 'dynamic-obstacle',
    name: '8. Dynamic Replanning Corridor',
    description: 'Corridor with dynamic choke point designed to demonstrate D* Lite instantaneous rerouting.',
    rows: 25,
    cols: 35,
    start: { r: 12, c: 4 },
    target: { r: 12, c: 30 },
    generate: () => {
      const g = createEmptyGrid(25, 35);
      for (let c = 8; c <= 26; c++) {
        g[10][c].type = 'wall';
        g[14][c].type = 'wall';
      }
      return g;
    },
  },
  {
    id: 'large-grid-benchmark',
    name: '9. Large Benchmark Grid (40x60)',
    description: 'Expanded grid for measuring execution time and node expansion differences under larger search space.',
    rows: 40,
    cols: 60,
    start: { r: 5, c: 5 },
    target: { r: 35, c: 55 },
    generate: () => generateRandomMap(40, 60, 0.20, 0.15, { r: 5, c: 5 }, { r: 35, c: 55 }),
  },
  {
    id: 'warehouse-aisle',
    name: '10. Warehouse Logistics Grid',
    description: 'Simulates automated guided vehicles (AGV) navigating long parallel shelving racks with cross-aisles.',
    rows: 25,
    cols: 35,
    start: { r: 1, c: 1 },
    target: { r: 23, c: 33 },
    generate: () => {
      const g = createEmptyGrid(25, 35);
      // Shelving aisles
      for (let r = 3; r <= 21; r += 4) {
        for (let c = 3; c <= 31; c++) {
          // Cross-aisles at c=10, 20
          if (c !== 10 && c !== 20 && c !== 11 && c !== 21) {
            g[r][c].type = 'wall';
            g[r + 1][c].type = 'wall';
          }
        }
      }
      return g;
    },
  },
];

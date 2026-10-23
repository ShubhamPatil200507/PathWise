import { GridCoord, HeuristicType } from './types';

const SQRT_2 = Math.SQRT2; // ~1.41421356

/**
 * Calculates admissible heuristic estimates between two grid coordinates.
 * To guarantee admissibility in weighted graphs, the raw geometric distance
 * is scaled by minTerrainCost (the minimum edge weight in the graph).
 */
export function calculateHeuristic(
  a: GridCoord,
  b: GridCoord,
  type: HeuristicType,
  minTerrainCost: number = 1.0
): number {
  if (type === 'zero') return 0;

  const dx = Math.abs(a.c - b.c);
  const dy = Math.abs(a.r - b.r);

  let rawDistance = 0;

  switch (type) {
    case 'manhattan':
      // Admissible for 4-directional grid
      rawDistance = dx + dy;
      break;

    case 'octile':
      // Exact admissible distance for 8-directional grid with orthogonal=1, diagonal=sqrt(2)
      rawDistance = Math.min(dx, dy) * SQRT_2 + Math.abs(dx - dy);
      break;

    case 'chebyshev':
      // Admissible if diagonal movement has cost 1 (unit king move)
      rawDistance = Math.max(dx, dy);
      break;

    case 'euclidean':
      // Strict straight-line Euclidean distance
      rawDistance = Math.hypot(dx, dy);
      break;

    default:
      rawDistance = dx + dy;
  }

  // Multiply by minimum terrain weight to guarantee admissibility h(n) <= h*(n)
  return rawDistance * minTerrainCost;
}

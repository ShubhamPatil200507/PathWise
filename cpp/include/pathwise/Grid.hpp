#pragma once

#include <vector>
#include <unordered_map>
#include <algorithm>
#include <limits>
#include "Types.hpp"
#include "Heuristics.hpp"

namespace pathwise {

struct TerrainAttr {
    double weight;
    double risk;
    double energyFactor;
    double speedFactor;
};

inline TerrainAttr getTerrainAttributes(CellType type) {
    switch (type) {
        case CellType::EMPTY:
            return { 1.0, 0.05, 1.0, 1.0 };
        case CellType::SAND:
            return { 2.0, 0.20, 1.8, 0.6 };
        case CellType::MUD:
            return { 3.0, 0.35, 2.5, 0.4 };
        case CellType::WATER:
            return { 5.0, 0.60, 4.5, 0.25 };
        case CellType::ZONE:
            return { 10.0, 0.85, 3.0, 0.2 };
        case CellType::WALL:
        default:
            return { std::numeric_limits<double>::infinity(), 1.0, std::numeric_limits<double>::infinity(), 0.0 };
    }
}

inline std::vector<std::vector<GridCell>> createEmptyGrid(int rows, int cols) {
    std::vector<std::vector<GridCell>> grid;
    grid.reserve(rows);
    for (int r = 0; r < rows; ++r) {
        std::vector<GridCell> row;
        row.reserve(cols);
        for (int c = 0; c < cols; ++c) {
            row.emplace_back(r, c, CellType::EMPTY, 1.0);
        }
        grid.push_back(std::move(row));
    }
    return grid;
}

inline double calculateEdgeCost(
    const GridCell& /*fromCell*/,
    const GridCell& toCell,
    bool isDiagonal,
    const MultiCriteriaWeights* weights = nullptr
) {
    double baseDist = isDiagonal ? SQRT_2 : 1.0;
    if (toCell.type == CellType::WALL) {
        return std::numeric_limits<double>::infinity();
    }

    TerrainAttr attr = getTerrainAttributes(toCell.type);

    if (!weights) {
        return baseDist * attr.weight;
    }

    double travelTime = baseDist / attr.speedFactor;
    double energy = baseDist * attr.energyFactor;
    double risk = baseDist * attr.risk * 10.0;

    double totalCost = weights->alpha * baseDist +
                       weights->beta * travelTime +
                       weights->gamma * energy +
                       weights->delta * risk;

    return std::max(0.001, totalCost);
}

struct NeighborEdge {
    GridCoord coord;
    double cost;
    double baseDistance;
    bool isDiagonal;
};

inline std::vector<NeighborEdge> getValidNeighbors(
    const std::vector<std::vector<GridCell>>& grid,
    int rows,
    int cols,
    const GridCoord& coord,
    MovementMode movement,
    const MultiCriteriaWeights* weights = nullptr
) {
    std::vector<NeighborEdge> neighbors;
    neighbors.reserve(movement == MovementMode::EIGHT_DIRECTIONAL ? 8 : 4);

    int r = coord.r;
    int c = coord.c;

    // 4 Orthogonal Directions: N, S, E, W
    const int orthDirs[4][2] = { {-1, 0}, {1, 0}, {0, -1}, {0, 1} };
    for (int i = 0; i < 4; ++i) {
        int nr = r + orthDirs[i][0];
        int nc = c + orthDirs[i][1];

        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const GridCell& targetCell = grid[nr][nc];
            if (targetCell.type != CellType::WALL) {
                double cost = calculateEdgeCost(grid[r][c], targetCell, false, weights);
                neighbors.push_back({ GridCoord(nr, nc), cost, 1.0, false });
            }
        }
    }

    // 8-Directional Diagonal Movement with Corner-Cutting Prevention
    if (movement == MovementMode::EIGHT_DIRECTIONAL) {
        const int diagDirs[4][2] = { {-1, 1}, {-1, -1}, {1, 1}, {1, -1} };
        for (int i = 0; i < 4; ++i) {
            int nr = r + diagDirs[i][0];
            int nc = c + diagDirs[i][1];

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                // Diagonal transition between (r, c) and (nr, nc) is blocked if
                // either adjacent orthogonal cell (nr, c) or (r, nc) is a wall!
                bool orth1Blocked = grid[nr][c].type == CellType::WALL;
                bool orth2Blocked = grid[r][nc].type == CellType::WALL;

                if (!orth1Blocked && !orth2Blocked) {
                    const GridCell& targetCell = grid[nr][nc];
                    if (targetCell.type != CellType::WALL) {
                        double cost = calculateEdgeCost(grid[r][c], targetCell, true, weights);
                        neighbors.push_back({ GridCoord(nr, nc), cost, SQRT_2, true });
                    }
                }
            }
        }
    }

    return neighbors;
}

inline void reconstructPath(
    const std::unordered_map<GridCoord, GridCoord, GridCoordHash>& parents,
    const GridCoord& start,
    const GridCoord& target,
    const std::vector<std::vector<GridCell>>& grid,
    std::vector<GridCoord>& outPath,
    double& outCost,
    double& outGeometricDist,
    const MultiCriteriaWeights* weights = nullptr
) {
    outPath.clear();
    outCost = 0.0;
    outGeometricDist = 0.0;

    GridCoord curr = target;
    bool foundStart = false;

    while (true) {
        outPath.push_back(curr);
        if (curr == start) {
            foundStart = true;
            break;
        }
        auto it = parents.find(curr);
        if (it == parents.end()) {
            break;
        }
        curr = it->second;
    }

    if (!foundStart || outPath.empty()) {
        outPath.clear();
        return;
    }

    std::reverse(outPath.begin(), outPath.end());

    // Recalculate true path cost & distance
    for (std::size_t i = 0; i < outPath.size() - 1; ++i) {
        const GridCoord& u = outPath[i];
        const GridCoord& v = outPath[i + 1];
        bool isDiag = (u.r != v.r) && (u.c != v.c);
        double baseD = isDiag ? SQRT_2 : 1.0;
        outGeometricDist += baseD;
        double stepCost = calculateEdgeCost(grid[u.r][u.c], grid[v.r][v.c], isDiag, weights);
        outCost += stepCost;
    }
}

} // namespace pathwise

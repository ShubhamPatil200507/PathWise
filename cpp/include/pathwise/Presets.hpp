#pragma once

#include <vector>
#include <random>
#include "Types.hpp"
#include "Grid.hpp"

namespace pathwise {

inline std::vector<std::vector<GridCell>> generateRandomMapCpp(
    int rows,
    int cols,
    double obstacleDensity,
    double terrainDensity,
    const GridCoord& start,
    const GridCoord& target,
    unsigned int seed = 42
) {
    auto grid = createEmptyGrid(rows, cols);
    std::mt19937 rng(seed);
    std::uniform_real_distribution<double> dist(0.0, 1.0);

    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            GridCoord curr(r, c);
            if (curr == start || curr == target) continue;

            double randVal = dist(rng);
            if (randVal < obstacleDensity) {
                grid[r][c].type = CellType::WALL;
                grid[r][c].weight = std::numeric_limits<double>::infinity();
            } else if (randVal < obstacleDensity + terrainDensity) {
                double sub = dist(rng);
                if (sub < 0.35) {
                    grid[r][c].type = CellType::MUD;
                    grid[r][c].weight = 3.0;
                } else if (sub < 0.65) {
                    grid[r][c].type = CellType::SAND;
                    grid[r][c].weight = 2.0;
                } else if (sub < 0.85) {
                    grid[r][c].type = CellType::WATER;
                    grid[r][c].weight = 5.0;
                } else {
                    grid[r][c].type = CellType::ZONE;
                    grid[r][c].weight = 10.0;
                }
            }
        }
    }
    return grid;
}

inline void divideMaze(
    std::vector<std::vector<GridCell>>& grid,
    int r1, int r2, int c1, int c2,
    std::mt19937& rng
) {
    if (r2 - r1 < 2 || c2 - c1 < 2) return;

    bool horizontal = (r2 - r1) > (c2 - c1);

    if (horizontal) {
        std::uniform_int_distribution<int> wallDist(r1 + 1, r2 - 1);
        std::uniform_int_distribution<int> passDist(c1, c2);

        int wallR = wallDist(rng);
        int passC = passDist(rng);

        for (int c = c1; c <= c2; ++c) {
            if (c != passC) {
                grid[wallR][c].type = CellType::WALL;
                grid[wallR][c].weight = std::numeric_limits<double>::infinity();
            }
        }

        divideMaze(grid, r1, wallR - 1, c1, c2, rng);
        divideMaze(grid, wallR + 1, r2, c1, c2, rng);
    } else {
        std::uniform_int_distribution<int> wallDist(c1 + 1, c2 - 1);
        std::uniform_int_distribution<int> passDist(r1, r2);

        int wallC = wallDist(rng);
        int passR = passDist(rng);

        for (int r = r1; r <= r2; ++r) {
            if (r != passR) {
                grid[r][wallC].type = CellType::WALL;
                grid[r][wallC].weight = std::numeric_limits<double>::infinity();
            }
        }

        divideMaze(grid, r1, r2, c1, wallC - 1, rng);
        divideMaze(grid, r1, r2, wallC + 1, c2, rng);
    }
}

inline std::vector<std::vector<GridCell>> generateRecursiveMazeCpp(int rows, int cols, unsigned int seed = 42) {
    auto grid = createEmptyGrid(rows, cols);

    // Border walls
    for (int r = 0; r < rows; ++r) {
        grid[r][0].type = CellType::WALL;
        grid[r][cols - 1].type = CellType::WALL;
    }
    for (int c = 0; c < cols; ++c) {
        grid[0][c].type = CellType::WALL;
        grid[rows - 1][c].type = CellType::WALL;
    }

    std::mt19937 rng(seed);
    divideMaze(grid, 1, rows - 2, 1, cols - 2, rng);

    grid[1][1].type = CellType::EMPTY;
    grid[rows - 2][cols - 2].type = CellType::EMPTY;

    return grid;
}

} // namespace pathwise

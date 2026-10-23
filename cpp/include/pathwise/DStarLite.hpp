#pragma once

#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <chrono>
#include <limits>
#include <algorithm>
#include "Types.hpp"
#include "Heuristics.hpp"
#include "Grid.hpp"

namespace pathwise {

struct KeyPair {
    double k1;
    double k2;

    KeyPair(double first = std::numeric_limits<double>::infinity(), double second = std::numeric_limits<double>::infinity())
        : k1(first), k2(second) {}

    bool operator<(const KeyPair& other) const {
        if (std::abs(k1 - other.k1) > 1e-6) {
            return k1 < other.k1;
        }
        return k2 < other.k2;
    }

    bool operator==(const KeyPair& other) const {
        return std::abs(k1 - other.k1) <= 1e-6 && std::abs(k2 - other.k2) <= 1e-6;
    }
};

class DStarLiteEngine {
private:
    int rows;
    int cols;
    std::vector<std::vector<GridCell>> grid;
    GridCoord start;
    GridCoord goal;
    MovementMode movement;
    double km;
    GridCoord sLast;

    std::unordered_map<GridCoord, double, GridCoordHash> g;
    std::unordered_map<GridCoord, double, GridCoordHash> rhs;
    // Map storing coordinate -> KeyPair in queue U
    std::unordered_map<GridCoord, KeyPair, GridCoordHash> U;

    int nodesExpanded;
    int nodesDiscovered;
    int maxFrontierSize;

    double h(const GridCoord& a, const GridCoord& b) const {
        return calculateHeuristic(a, b, movement == MovementMode::EIGHT_DIRECTIONAL ? HeuristicType::OCTILE : HeuristicType::MANHATTAN, 1.0);
    }

    double getG(const GridCoord& u) const {
        auto it = g.find(u);
        return it != g.end() ? it->second : std::numeric_limits<double>::infinity();
    }

    double getRhs(const GridCoord& u) const {
        auto it = rhs.find(u);
        return it != rhs.end() ? it->second : std::numeric_limits<double>::infinity();
    }

    KeyPair calculateKey(const GridCoord& s) const {
        double minVal = std::min(getG(s), getRhs(s));
        return KeyPair(minVal + h(start, s) + km, minVal);
    }

    KeyPair topKey() const {
        if (U.empty()) {
            return KeyPair();
        }
        KeyPair minKey;
        for (const auto& pair : U) {
            if (pair.second < minKey) {
                minKey = pair.second;
            }
        }
        return minKey;
    }

    GridCoord popTop() {
        auto bestIt = U.begin();
        for (auto it = U.begin(); it != U.end(); ++it) {
            if (it->second < bestIt->second) {
                bestIt = it;
            }
        }
        GridCoord u = bestIt->first;
        U.erase(bestIt);
        return u;
    }

    void updateVertex(const GridCoord& u) {
        if (u != goal) {
            double minRhs = std::numeric_limits<double>::infinity();
            auto neighbors = getValidNeighbors(grid, rows, cols, u, movement);
            for (const auto& edge : neighbors) {
                double val = edge.cost + getG(edge.coord);
                if (val < minRhs) {
                    minRhs = val;
                }
            }
            rhs[u] = minRhs;
        }

        U.erase(u);

        double gVal = getG(u);
        double rhsVal = getRhs(u);

        if (std::abs(gVal - rhsVal) > 1e-6) {
            U[u] = calculateKey(u);
            nodesDiscovered++;
        }
    }

public:
    DStarLiteEngine(
        int r,
        int c,
        const std::vector<std::vector<GridCell>>& inGrid,
        const GridCoord& s,
        const GridCoord& targetGoal,
        MovementMode m
    ) : rows(r), cols(c), grid(inGrid), start(s), goal(targetGoal), movement(m),
        km(0.0), sLast(s), nodesExpanded(0), nodesDiscovered(1), maxFrontierSize(1) {
        initialize();
    }

    void initialize() {
        km = 0.0;
        g.clear();
        rhs.clear();
        U.clear();
        nodesExpanded = 0;
        nodesDiscovered = 1;
        maxFrontierSize = 1;

        // D* Lite searches backwards: goal is the root
        rhs[goal] = 0.0;
        U[goal] = calculateKey(goal);
    }

    void computeShortestPath() {
        int loopLimit = rows * cols * 8;

        while (!U.empty() && loopLimit-- > 0) {
            if (static_cast<int>(U.size()) > maxFrontierSize) {
                maxFrontierSize = static_cast<int>(U.size());
            }

            if (!(topKey() < calculateKey(start) || std::abs(getRhs(start) - getG(start)) > 1e-6)) {
                break;
            }

            // Peek at minimum
            auto bestIt = U.begin();
            for (auto it = U.begin(); it != U.end(); ++it) {
                if (it->second < bestIt->second) {
                    bestIt = it;
                }
            }
            GridCoord u = bestIt->first;
            KeyPair kOld = bestIt->second;
            KeyPair kNew = calculateKey(u);

            if (kOld < kNew) {
                U[u] = kNew;
            } else {
                U.erase(u);
                nodesExpanded++;

                double gU = getG(u);
                double rhsU = getRhs(u);

                auto neighbors = getValidNeighbors(grid, rows, cols, u, movement);

                if (gU > rhsU) {
                    // Overconsistent
                    g[u] = rhsU;
                    for (const auto& pred : neighbors) {
                        updateVertex(pred.coord);
                    }
                } else {
                    // Underconsistent
                    g[u] = std::numeric_limits<double>::infinity();
                    updateVertex(u);
                    for (const auto& pred : neighbors) {
                        updateVertex(pred.coord);
                    }
                }
            }
        }
    }

    struct ReplanResult {
        double replanningTimeMs;
        std::vector<GridCoord> path;
        double cost;
    };

    ReplanResult replanAfterChange(const std::vector<std::pair<GridCoord, CellType>>& changedCells) {
        auto t0 = std::chrono::high_resolution_clock::now();

        km += h(sLast, start);
        sLast = start;

        for (const auto& change : changedCells) {
            int r = change.first.r;
            int c = change.first.c;
            grid[r][c].type = change.second;
            grid[r][c].weight = (change.second == CellType::WALL) ? std::numeric_limits<double>::infinity() : 1.0;

            updateVertex(change.first);
            auto neighbors = getValidNeighbors(grid, rows, cols, change.first, movement);
            for (const auto& n : neighbors) {
                updateVertex(n.coord);
            }
        }

        computeShortestPath();

        auto t1 = std::chrono::high_resolution_clock::now();
        double elapsedMs = std::chrono::duration<double, std::milli>(t1 - t0).count();

        std::vector<GridCoord> path;
        double cost = 0.0;
        double geomDist = 0.0;
        extractPath(path, cost, geomDist);

        return { elapsedMs, path, cost };
    }

    void extractPath(std::vector<GridCoord>& outPath, double& outCost, double& outGeomDist) const {
        outPath.clear();
        outCost = 0.0;
        outGeomDist = 0.0;

        GridCoord curr = start;
        outPath.push_back(curr);
        int steps = 0;
        int maxSteps = rows * cols;

        while (curr != goal && steps++ < maxSteps) {
            auto neighbors = getValidNeighbors(grid, rows, cols, curr, movement);
            if (neighbors.empty()) break;

            GridCoord bestNeighbor;
            double minVal = std::numeric_limits<double>::infinity();
            double bestCost = 0.0;
            bool bestDiag = false;
            bool foundNext = false;

            for (const auto& edge : neighbors) {
                double val = edge.cost + getG(edge.coord);
                if (val < minVal) {
                    minVal = val;
                    bestNeighbor = edge.coord;
                    bestCost = edge.cost;
                    bestDiag = edge.isDiagonal;
                    foundNext = true;
                }
            }

            if (!foundNext || minVal == std::numeric_limits<double>::infinity()) {
                outPath.clear();
                return;
            }

            curr = bestNeighbor;
            outPath.push_back(curr);
            outCost += bestCost;
            outGeomDist += bestDiag ? SQRT_2 : 1.0;
        }

        if (curr != goal) {
            outPath.clear();
            outCost = 0.0;
            outGeomDist = 0.0;
        }
    }

    PathfindingResult runInitialSearch() {
        auto t0 = std::chrono::high_resolution_clock::now();
        computeShortestPath();
        auto t1 = std::chrono::high_resolution_clock::now();
        double elapsedMs = std::chrono::duration<double, std::milli>(t1 - t0).count();

        std::vector<GridCoord> path;
        double cost = 0.0;
        double geomDist = 0.0;
        extractPath(path, cost, geomDist);

        PathfindingResult res;
        res.metrics.algorithm = "D* Lite (Incremental Replanning)";
        res.metrics.found = !path.empty();
        res.metrics.pathCost = cost;
        res.metrics.pathLength = static_cast<int>(path.size());
        res.metrics.geometricDistance = geomDist;
        res.metrics.nodesExpanded = nodesExpanded;
        res.metrics.nodesDiscovered = nodesDiscovered;
        res.metrics.maxFrontierSize = maxFrontierSize;
        res.metrics.executionTimeMs = elapsedMs;
        res.metrics.isOptimal = true;
        res.path = std::move(path);

        return res;
    }

    int getNodesExpanded() const { return nodesExpanded; }
};

} // namespace pathwise

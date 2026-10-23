#pragma once

#include <unordered_set>
#include <unordered_map>
#include <chrono>
#include "Types.hpp"
#include "BinaryHeap.hpp"
#include "Heuristics.hpp"
#include "Grid.hpp"

namespace pathwise {

inline PathfindingResult runAStar(
    const std::vector<std::vector<GridCell>>& grid,
    int rows,
    int cols,
    const GridCoord& start,
    const GridCoord& target,
    MovementMode movement,
    HeuristicType heuristic = HeuristicType::MANHATTAN,
    const MultiCriteriaWeights* weights = nullptr,
    bool recordEvents = true
) {
    auto t0 = std::chrono::high_resolution_clock::now();

    // Scale heuristic by minimum terrain weight to guarantee strict admissibility
    double minTerrainCost = 1.0;
    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (grid[r][c].type != CellType::WALL && grid[r][c].weight < minTerrainCost) {
                minTerrainCost = grid[r][c].weight;
            }
        }
    }

    BinaryHeap<GridCoord> openSet;
    std::unordered_map<GridCoord, double, GridCoordHash> gScore;
    std::unordered_map<GridCoord, double, GridCoordHash> fScore;
    std::unordered_map<GridCoord, GridCoord, GridCoordHash> parents;
    std::unordered_set<GridCoord, GridCoordHash> closedSet;
    std::vector<GridCoord> visitedOrder;
    std::vector<SearchStepEvent> stepEvents;

    int nodesExpanded = 0;
    int nodesDiscovered = 1;
    int maxFrontierSize = 1;
    bool found = false;
    int stepCount = 0;

    double startH = calculateHeuristic(start, target, heuristic, minTerrainCost);
    gScore[start] = 0.0;
    fScore[start] = startH;
    // Primary priority: f(n), Secondary priority (tie-breaker): h(n)
    openSet.push(start, startH, startH);

    if (recordEvents) {
        SearchStepEvent evt;
        evt.step = ++stepCount;
        evt.type = "frontier";
        evt.coord = start;
        evt.g = 0.0;
        evt.h = startH;
        evt.f = startH;
        evt.explanation = "Initialized A*: Start placed in Open Set with f = g + h.";
        stepEvents.push_back(evt);
    }

    while (!openSet.isEmpty()) {
        if (static_cast<int>(openSet.size()) > maxFrontierSize) {
            maxFrontierSize = static_cast<int>(openSet.size());
        }

        HeapNode<GridCoord> top = openSet.pop();
        GridCoord curr = top.item;

        if (closedSet.find(curr) != closedSet.end()) continue;

        closedSet.insert(curr);
        nodesExpanded++;
        visitedOrder.push_back(curr);

        double currG = gScore[curr];
        double currH = calculateHeuristic(curr, target, heuristic, minTerrainCost);
        double currF = top.priority;

        if (recordEvents) {
            SearchStepEvent evt;
            evt.step = ++stepCount;
            evt.type = "expand";
            evt.coord = curr;
            evt.g = currG;
            evt.h = currH;
            evt.f = currF;
            auto pit = parents.find(curr);
            if (pit != parents.end()) {
                evt.parent = pit->second;
                evt.hasParent = true;
            }
            evt.explanation = "Extracted lowest f(n) node from Open Set.";
            stepEvents.push_back(evt);
        }

        if (curr == target) {
            found = true;
            break;
        }

        auto neighbors = getValidNeighbors(grid, rows, cols, curr, movement, weights);
        for (const auto& edge : neighbors) {
            if (closedSet.find(edge.coord) != closedSet.end()) continue;

            double tentativeG = currG + edge.cost;
            auto git = gScore.find(edge.coord);
            double prevG = (git != gScore.end()) ? git->second : std::numeric_limits<double>::infinity();

            if (tentativeG < prevG) {
                parents[edge.coord] = curr;
                gScore[edge.coord] = tentativeG;
                double h = calculateHeuristic(edge.coord, target, heuristic, minTerrainCost);
                double f = tentativeG + h;
                fScore[edge.coord] = f;

                openSet.push(edge.coord, f, h);

                if (prevG == std::numeric_limits<double>::infinity()) {
                    nodesDiscovered++;
                }

                if (recordEvents) {
                    SearchStepEvent evt;
                    evt.step = ++stepCount;
                    evt.type = "relax";
                    evt.coord = edge.coord;
                    evt.parent = curr;
                    evt.hasParent = true;
                    evt.g = tentativeG;
                    evt.h = h;
                    evt.f = f;
                    evt.explanation = "Relaxed neighbor: Updated lower f(n) in Open Set.";
                    stepEvents.push_back(evt);
                }
            }
        }
    }

    auto t1 = std::chrono::high_resolution_clock::now();
    double elapsedMs = std::chrono::duration<double, std::milli>(t1 - t0).count();

    std::vector<GridCoord> path;
    double cost = 0.0;
    double geomDist = 0.0;

    if (found) {
        reconstructPath(parents, start, target, grid, path, cost, geomDist, weights);
    }

    if (recordEvents && found) {
        for (const auto& p : path) {
            SearchStepEvent evt;
            evt.step = ++stepCount;
            evt.type = "path";
            evt.coord = p;
            stepEvents.push_back(evt);
        }
    }

    PathfindingResult result;
    result.metrics.algorithm = "A* Search";
    result.metrics.found = found;
    result.metrics.pathCost = cost;
    result.metrics.pathLength = static_cast<int>(path.size());
    result.metrics.geometricDistance = geomDist;
    result.metrics.nodesExpanded = nodesExpanded;
    result.metrics.nodesDiscovered = nodesDiscovered;
    result.metrics.maxFrontierSize = maxFrontierSize;
    result.metrics.executionTimeMs = elapsedMs;
    result.metrics.isOptimal = true; // Admissible and consistent heuristic
    result.path = std::move(path);
    result.visitedOrder = std::move(visitedOrder);
    result.stepEvents = std::move(stepEvents);

    return result;
}

} // namespace pathwise

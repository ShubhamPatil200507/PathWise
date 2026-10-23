#pragma once

#include <unordered_set>
#include <unordered_map>
#include <chrono>
#include "Types.hpp"
#include "BinaryHeap.hpp"
#include "Heuristics.hpp"
#include "Grid.hpp"

namespace pathwise {

inline PathfindingResult runGreedyBestFirst(
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

    BinaryHeap<GridCoord> openSet;
    std::unordered_map<GridCoord, GridCoord, GridCoordHash> parents;
    std::unordered_set<GridCoord, GridCoordHash> closedSet;
    std::vector<GridCoord> visitedOrder;
    std::vector<SearchStepEvent> stepEvents;

    int nodesExpanded = 0;
    int nodesDiscovered = 1;
    int maxFrontierSize = 1;
    bool found = false;
    int stepCount = 0;

    double startH = calculateHeuristic(start, target, heuristic, 1.0);
    openSet.push(start, startH);

    if (recordEvents) {
        SearchStepEvent evt;
        evt.step = ++stepCount;
        evt.type = "frontier";
        evt.coord = start;
        evt.h = startH;
        evt.f = startH;
        evt.explanation = "Initialized Greedy Best-First: Node prioritized solely by h(n).";
        stepEvents.push_back(evt);
    }

    while (!openSet.isEmpty()) {
        if (static_cast<int>(openSet.size()) > maxFrontierSize) {
            maxFrontierSize = static_cast<int>(openSet.size());
        }

        HeapNode<GridCoord> top = openSet.pop();
        GridCoord curr = top.item;
        double currH = top.priority;

        if (closedSet.find(curr) != closedSet.end()) continue;

        closedSet.insert(curr);
        nodesExpanded++;
        visitedOrder.push_back(curr);

        if (recordEvents) {
            SearchStepEvent evt;
            evt.step = ++stepCount;
            evt.type = "expand";
            evt.coord = curr;
            evt.h = currH;
            evt.f = currH;
            auto pit = parents.find(curr);
            if (pit != parents.end()) {
                evt.parent = pit->second;
                evt.hasParent = true;
            }
            evt.explanation = "Greedily extracted node with lowest heuristic to goal.";
            stepEvents.push_back(evt);
        }

        if (curr == target) {
            found = true;
            break;
        }

        auto neighbors = getValidNeighbors(grid, rows, cols, curr, movement, weights);
        for (const auto& edge : neighbors) {
            if (closedSet.find(edge.coord) == closedSet.end() && parents.find(edge.coord) == parents.end()) {
                parents[edge.coord] = curr;
                double h = calculateHeuristic(edge.coord, target, heuristic, 1.0);
                openSet.push(edge.coord, h);
                nodesDiscovered++;

                if (recordEvents) {
                    SearchStepEvent evt;
                    evt.step = ++stepCount;
                    evt.type = "frontier";
                    evt.coord = edge.coord;
                    evt.parent = curr;
                    evt.hasParent = true;
                    evt.h = h;
                    evt.f = h;
                    evt.explanation = "Discovered neighbor with heuristic value.";
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
    result.metrics.algorithm = "Greedy Best-First Search";
    result.metrics.found = found;
    result.metrics.pathCost = cost;
    result.metrics.pathLength = static_cast<int>(path.size());
    result.metrics.geometricDistance = geomDist;
    result.metrics.nodesExpanded = nodesExpanded;
    result.metrics.nodesDiscovered = nodesDiscovered;
    result.metrics.maxFrontierSize = maxFrontierSize;
    result.metrics.executionTimeMs = elapsedMs;
    result.metrics.isOptimal = false; // Greedy search does NOT guarantee optimal cost
    result.path = std::move(path);
    result.visitedOrder = std::move(visitedOrder);
    result.stepEvents = std::move(stepEvents);

    return result;
}

} // namespace pathwise

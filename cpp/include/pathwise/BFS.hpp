#pragma once

#include <queue>
#include <unordered_set>
#include <unordered_map>
#include <chrono>
#include "Types.hpp"
#include "Grid.hpp"

namespace pathwise {

inline PathfindingResult runBFS(
    const std::vector<std::vector<GridCell>>& grid,
    int rows,
    int cols,
    const GridCoord& start,
    const GridCoord& target,
    MovementMode movement,
    bool recordEvents = true
) {
    auto t0 = std::chrono::high_resolution_clock::now();

    std::queue<GridCoord> q;
    std::unordered_set<GridCoord, GridCoordHash> visited;
    std::unordered_map<GridCoord, GridCoord, GridCoordHash> parents;
    std::vector<GridCoord> visitedOrder;
    std::vector<SearchStepEvent> stepEvents;

    int nodesExpanded = 0;
    int nodesDiscovered = 1;
    int maxFrontierSize = 1;
    bool found = false;
    int stepCount = 0;

    q.push(start);
    visited.insert(start);

    if (recordEvents) {
        SearchStepEvent evt;
        evt.step = ++stepCount;
        evt.type = "frontier";
        evt.coord = start;
        evt.explanation = "Initialized BFS with start node in FIFO queue.";
        stepEvents.push_back(evt);
    }

    while (!q.empty()) {
        if (static_cast<int>(q.size()) > maxFrontierSize) {
            maxFrontierSize = static_cast<int>(q.size());
        }

        GridCoord curr = q.front();
        q.pop();
        nodesExpanded++;
        visitedOrder.push_back(curr);

        if (recordEvents) {
            SearchStepEvent evt;
            evt.step = ++stepCount;
            evt.type = "expand";
            evt.coord = curr;
            auto pit = parents.find(curr);
            if (pit != parents.end()) {
                evt.parent = pit->second;
                evt.hasParent = true;
            }
            evt.explanation = "Dequeued node from FIFO queue.";
            stepEvents.push_back(evt);
        }

        if (curr == target) {
            found = true;
            break;
        }

        auto neighbors = getValidNeighbors(grid, rows, cols, curr, movement);
        for (const auto& edge : neighbors) {
            if (visited.find(edge.coord) == visited.end()) {
                visited.insert(edge.coord);
                parents[edge.coord] = curr;
                q.push(edge.coord);
                nodesDiscovered++;

                if (recordEvents) {
                    SearchStepEvent evt;
                    evt.step = ++stepCount;
                    evt.type = "frontier";
                    evt.coord = edge.coord;
                    evt.parent = curr;
                    evt.hasParent = true;
                    evt.explanation = "Discovered neighbor. Added to FIFO queue.";
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
        reconstructPath(parents, start, target, grid, path, cost, geomDist);
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
    result.metrics.algorithm = "Breadth-First Search (BFS)";
    result.metrics.found = found;
    result.metrics.pathCost = cost;
    result.metrics.pathLength = static_cast<int>(path.size());
    result.metrics.geometricDistance = geomDist;
    result.metrics.nodesExpanded = nodesExpanded;
    result.metrics.nodesDiscovered = nodesDiscovered;
    result.metrics.maxFrontierSize = maxFrontierSize;
    result.metrics.executionTimeMs = elapsedMs;
    result.metrics.isOptimal = false; // Only optimal in unweighted graphs
    result.path = std::move(path);
    result.visitedOrder = std::move(visitedOrder);
    result.stepEvents = std::move(stepEvents);

    return result;
}

} // namespace pathwise

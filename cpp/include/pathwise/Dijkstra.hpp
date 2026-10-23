#pragma once

#include <unordered_set>
#include <unordered_map>
#include <chrono>
#include "Types.hpp"
#include "BinaryHeap.hpp"
#include "Grid.hpp"

namespace pathwise {

inline PathfindingResult runDijkstra(
    const std::vector<std::vector<GridCell>>& grid,
    int rows,
    int cols,
    const GridCoord& start,
    const GridCoord& target,
    MovementMode movement,
    const MultiCriteriaWeights* weights = nullptr,
    bool recordEvents = true
) {
    auto t0 = std::chrono::high_resolution_clock::now();

    BinaryHeap<GridCoord> pq;
    std::unordered_map<GridCoord, double, GridCoordHash> dist;
    std::unordered_map<GridCoord, GridCoord, GridCoordHash> parents;
    std::unordered_set<GridCoord, GridCoordHash> closedSet;
    std::vector<GridCoord> visitedOrder;
    std::vector<SearchStepEvent> stepEvents;

    int nodesExpanded = 0;
    int nodesDiscovered = 1;
    int maxFrontierSize = 1;
    bool found = false;
    int stepCount = 0;

    dist[start] = 0.0;
    pq.push(start, 0.0);

    if (recordEvents) {
        SearchStepEvent evt;
        evt.step = ++stepCount;
        evt.type = "frontier";
        evt.coord = start;
        evt.g = 0.0;
        evt.f = 0.0;
        evt.explanation = "Initialized Dijkstra: Start node placed in Min-Heap with distance g=0.";
        stepEvents.push_back(evt);
    }

    while (!pq.isEmpty()) {
        if (static_cast<int>(pq.size()) > maxFrontierSize) {
            maxFrontierSize = static_cast<int>(pq.size());
        }

        HeapNode<GridCoord> top = pq.pop();
        GridCoord curr = top.item;
        double currentDist = top.priority;

        // Lazy deletion / stale entry check
        if (closedSet.find(curr) != closedSet.end()) continue;
        auto dit = dist.find(curr);
        if (dit != dist.end() && currentDist > dit->second) continue;

        closedSet.insert(curr);
        nodesExpanded++;
        visitedOrder.push_back(curr);

        if (recordEvents) {
            SearchStepEvent evt;
            evt.step = ++stepCount;
            evt.type = "expand";
            evt.coord = curr;
            evt.g = currentDist;
            evt.f = currentDist;
            auto pit = parents.find(curr);
            if (pit != parents.end()) {
                evt.parent = pit->second;
                evt.hasParent = true;
            }
            evt.explanation = "Extracted node with minimum distance from Min-Heap.";
            stepEvents.push_back(evt);
        }

        if (curr == target) {
            found = true;
            break;
        }

        auto neighbors = getValidNeighbors(grid, rows, cols, curr, movement, weights);
        for (const auto& edge : neighbors) {
            if (closedSet.find(edge.coord) != closedSet.end()) continue;

            double altDist = currentDist + edge.cost;
            auto prevIt = dist.find(edge.coord);
            double prevDist = (prevIt != dist.end()) ? prevIt->second : std::numeric_limits<double>::infinity();

            if (altDist < prevDist) {
                dist[edge.coord] = altDist;
                parents[edge.coord] = curr;
                pq.push(edge.coord, altDist);

                if (prevDist == std::numeric_limits<double>::infinity()) {
                    nodesDiscovered++;
                }

                if (recordEvents) {
                    SearchStepEvent evt;
                    evt.step = ++stepCount;
                    evt.type = "relax";
                    evt.coord = edge.coord;
                    evt.parent = curr;
                    evt.hasParent = true;
                    evt.g = altDist;
                    evt.f = altDist;
                    evt.explanation = "Relaxed edge: Updated distance to neighbor in Min-Heap.";
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
    result.metrics.algorithm = "Dijkstra's Algorithm";
    result.metrics.found = found;
    result.metrics.pathCost = cost;
    result.metrics.pathLength = static_cast<int>(path.size());
    result.metrics.geometricDistance = geomDist;
    result.metrics.nodesExpanded = nodesExpanded;
    result.metrics.nodesDiscovered = nodesDiscovered;
    result.metrics.maxFrontierSize = maxFrontierSize;
    result.metrics.executionTimeMs = elapsedMs;
    result.metrics.isOptimal = true; // Guaranteed optimal for non-negative weights
    result.path = std::move(path);
    result.visitedOrder = std::move(visitedOrder);
    result.stepEvents = std::move(stepEvents);

    return result;
}

} // namespace pathwise

#pragma once

#include <vector>
#include <string>
#include <fstream>
#include <iomanip>
#include <iostream>
#include "Types.hpp"
#include "BFS.hpp"
#include "Dijkstra.hpp"
#include "AStar.hpp"
#include "Greedy.hpp"
#include "Presets.hpp"

namespace pathwise {

struct BenchmarkRecord {
    std::string algorithm;
    int gridSize;
    double density;
    int repetition;
    bool found;
    double pathCost;
    int nodesExpanded;
    int nodesDiscovered;
    int maxFrontierSize;
    double executionTimeMs;
};

class BenchmarkSuite {
public:
    static std::vector<BenchmarkRecord> run(
        const std::vector<std::string>& algorithms,
        const std::vector<int>& gridSizes,
        const std::vector<double>& densities,
        int repetitions,
        MovementMode movement = MovementMode::FOUR_DIRECTIONAL
    ) {
        std::vector<BenchmarkRecord> records;

        for (int size : gridSizes) {
            GridCoord start(1, 1);
            GridCoord target(size - 2, size - 2);

            for (double density : densities) {
                for (int rep = 1; rep <= repetitions; ++rep) {
                    unsigned int seed = 42 + rep * 100 + size * 10 + static_cast<int>(density * 100);
                    auto grid = generateRandomMapCpp(size, size, density, 0.1, start, target, seed);

                    for (const auto& algo : algorithms) {
                        PathfindingResult res;

                        if (algo == "bfs") {
                            res = runBFS(grid, size, size, start, target, movement, false);
                        } else if (algo == "dijkstra") {
                            res = runDijkstra(grid, size, size, start, target, movement, nullptr, false);
                        } else if (algo == "astar") {
                            res = runAStar(grid, size, size, start, target, movement, HeuristicType::MANHATTAN, nullptr, false);
                        } else if (algo == "greedy") {
                            res = runGreedyBestFirst(grid, size, size, start, target, movement, HeuristicType::MANHATTAN, nullptr, false);
                        }

                        records.push_back({
                            res.metrics.algorithm,
                            size,
                            density,
                            rep,
                            res.metrics.found,
                            res.metrics.pathCost,
                            res.metrics.nodesExpanded,
                            res.metrics.nodesDiscovered,
                            res.metrics.maxFrontierSize,
                            res.metrics.executionTimeMs
                        });
                    }
                }
            }
        }

        return records;
    }

    static bool exportToCSV(const std::vector<BenchmarkRecord>& records, const std::string& filename) {
        std::ofstream file(filename);
        if (!file.is_open()) return false;

        file << "algorithm,grid_size,obstacle_density,repetition,found,path_cost,nodes_expanded,nodes_discovered,max_frontier_size,execution_time_ms\n";

        for (const auto& r : records) {
            file << "\"" << r.algorithm << "\","
                 << r.gridSize << ","
                 << r.density << ","
                 << r.repetition << ","
                 << (r.found ? "true" : "false") << ","
                 << std::fixed << std::setprecision(3) << r.pathCost << ","
                 << r.nodesExpanded << ","
                 << r.nodesDiscovered << ","
                 << r.maxFrontierSize << ","
                 << r.executionTimeMs << "\n";
        }

        file.close();
        return true;
    }
};

} // namespace pathwise

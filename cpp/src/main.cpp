#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include "../include/pathwise/Types.hpp"
#include "../include/pathwise/Grid.hpp"
#include "../include/pathwise/BFS.hpp"
#include "../include/pathwise/Dijkstra.hpp"
#include "../include/pathwise/AStar.hpp"
#include "../include/pathwise/Greedy.hpp"
#include "../include/pathwise/DStarLite.hpp"
#include "../include/pathwise/RoadNetwork.hpp"
#include "../include/pathwise/Presets.hpp"
#include "../include/pathwise/Benchmarks.hpp"

using namespace pathwise;

void renderAsciiGrid(
    const std::vector<std::vector<GridCell>>& grid,
    int rows,
    int cols,
    const GridCoord& start,
    const GridCoord& target,
    const std::vector<GridCoord>& path
) {
    std::unordered_set<GridCoord, GridCoordHash> pathSet(path.begin(), path.end());

    std::cout << "\n+";
    for (int c = 0; c < cols; ++c) std::cout << "-";
    std::cout << "+\n";

    for (int r = 0; r < rows; ++r) {
        std::cout << "|";
        for (int c = 0; c < cols; ++c) {
            GridCoord coord(r, c);
            if (coord == start) {
                std::cout << "S";
            } else if (coord == target) {
                std::cout << "T";
            } else if (pathSet.find(coord) != pathSet.end()) {
                std::cout << "*";
            } else if (grid[r][c].type == CellType::WALL) {
                std::cout << "#";
            } else if (grid[r][c].type == CellType::WATER) {
                std::cout << "~";
            } else if (grid[r][c].type == CellType::MUD) {
                std::cout << "m";
            } else if (grid[r][c].type == CellType::SAND) {
                std::cout << "s";
            } else if (grid[r][c].type == CellType::ZONE) {
                std::cout << "!";
            } else {
                std::cout << ".";
            }
        }
        std::cout << "|\n";
    }

    std::cout << "+";
    for (int c = 0; c < cols; ++c) std::cout << "-";
    std::cout << "+\n";
    std::cout << "Legend: S=Start, T=Target, *=Discovered Route, #=Wall, m=Mud(3x), ~=Water(5x), .=Open\n\n";
}

void printMetricsTable(const std::vector<AlgorithmMetrics>& metricsList) {
    std::cout << "\n====================================================================================================\n";
    std::cout << std::left << std::setw(28) << "Algorithm"
              << std::setw(10) << "Found"
              << std::setw(14) << "Path Cost"
              << std::setw(14) << "Path Length"
              << std::setw(16) << "Nodes Expanded"
              << std::setw(18) << "Execution (ms)"
              << std::setw(10) << "Optimal" << "\n";
    std::cout << "----------------------------------------------------------------------------------------------------\n";

    for (const auto& m : metricsList) {
        std::cout << std::left << std::setw(28) << m.algorithm
                  << std::setw(10) << (m.found ? "YES" : "NO")
                  << std::fixed << std::setprecision(2) << std::setw(14) << m.pathCost
                  << std::setw(14) << m.pathLength
                  << std::setw(16) << m.nodesExpanded
                  << std::setprecision(3) << std::setw(18) << m.executionTimeMs
                  << std::setw(10) << (m.isOptimal ? "TRUE" : "FALSE") << "\n";
    }
    std::cout << "====================================================================================================\n\n";
}

int main(int argc, char** argv) {
    std::cout << "===================================================================\n";
    std::cout << "   PathWise C++: Interactive Pathfinding & Route Optimization   \n";
    std::cout << "===================================================================\n";

    int rows = 20;
    int cols = 40;
    GridCoord start(2, 2);
    GridCoord target(17, 37);

    // Generate Biome Map with River and Mud
    auto grid = createEmptyGrid(rows, cols);

    // River in the middle (water cost 5.0)
    for (int r = 0; r < rows; ++r) {
        grid[r][20].type = CellType::WATER;
        grid[r][20].weight = 5.0;
        grid[r][21].type = CellType::WATER;
        grid[r][21].weight = 5.0;
    }
    // Bridge at bottom (sand cost 2.0)
    grid[17][20].type = CellType::SAND;
    grid[17][20].weight = 2.0;
    grid[17][21].type = CellType::SAND;
    grid[17][21].weight = 2.0;

    // Obstacle barrier
    for (int r = 4; r < 14; ++r) {
        grid[r][10].type = CellType::WALL;
        grid[r][10].weight = std::numeric_limits<double>::infinity();
    }

    std::cout << "\n[1] Running BFS on Multi-Terrain Grid..." << std::endl;
    auto bfsRes = runBFS(grid, rows, cols, start, target, MovementMode::FOUR_DIRECTIONAL);

    std::cout << "[2] Running Dijkstra's Algorithm..." << std::endl;
    auto dijkstraRes = runDijkstra(grid, rows, cols, start, target, MovementMode::FOUR_DIRECTIONAL);

    std::cout << "[3] Running A* Heuristic Search (Manhattan)..." << std::endl;
    auto astarRes = runAStar(grid, rows, cols, start, target, MovementMode::FOUR_DIRECTIONAL, HeuristicType::MANHATTAN);

    std::cout << "[4] Running Greedy Best-First Search..." << std::endl;
    auto greedyRes = runGreedyBestFirst(grid, rows, cols, start, target, MovementMode::FOUR_DIRECTIONAL, HeuristicType::MANHATTAN);

    std::cout << "[5] Running D* Lite Incremental Initial Search..." << std::endl;
    DStarLiteEngine dlite(rows, cols, grid, start, target, MovementMode::FOUR_DIRECTIONAL);
    auto dliteRes = dlite.runInitialSearch();

    // Render A* Discovered Route
    std::cout << "\nVisualizing A* Optimal Path on 20x40 Multi-Terrain Map:";
    renderAsciiGrid(grid, rows, cols, start, target, astarRes.path);

    // Print Comparative Performance Matrix
    std::vector<AlgorithmMetrics> metrics = {
        bfsRes.metrics,
        dijkstraRes.metrics,
        astarRes.metrics,
        greedyRes.metrics,
        dliteRes.metrics
    };
    printMetricsTable(metrics);

    // Test Dynamic Replanning with D* Lite
    std::cout << ">>> Dynamic Replanning Test (Blocking Bridge on Active Route) <<<" << std::endl;
    std::vector<std::pair<GridCoord, CellType>> dynamicChanges = {
        { GridCoord(17, 20), CellType::WALL },
        { GridCoord(17, 21), CellType::WALL }
    };
    auto replan = dlite.replanAfterChange(dynamicChanges);
    std::cout << "D* Lite successfully replanned alternate route around blocked bridge in "
              << replan.replanningTimeMs << " ms! New Path Cost: " << replan.cost << "\n" << std::endl;

    // Test Planar Road Network Routing
    std::cout << ">>> Planar Road Network Routing Test <<<" << std::endl;
    auto roadGraph = createDowntownMetropolisGraph();
    auto roadRoute = roadGraph.findShortestPath("N1", "N11", true);
    std::cout << "Shortest Road Route (West Station -> Airport Parkway): Total Distance = "
              << roadRoute.totalCost << " km (" << roadRoute.path.size() << " hops, expanded "
              << roadRoute.nodesExpanded << " intersections in " << roadRoute.runtimeMs << " ms)\n" << std::endl;

    // Run Automated Monte-Carlo Benchmark and Export CSV
    std::cout << ">>> Running Monte-Carlo Benchmark Suite & Generating CSV Export <<<" << std::endl;
    std::vector<std::string> benchAlgos = { "dijkstra", "astar", "greedy" };
    std::vector<int> sizes = { 15, 25, 35 };
    std::vector<double> densities = { 0.1, 0.25, 0.35 };
    int reps = 3;

    auto benchRecords = BenchmarkSuite::run(benchAlgos, sizes, densities, reps);
    std::string csvPath = "benchmark_results_cpp.csv";
    if (BenchmarkSuite::exportToCSV(benchRecords, csvPath)) {
        std::cout << "Exported " << benchRecords.size() << " trial runs to '" << csvPath << "' successfully!\n" << std::endl;
    }

    std::cout << "PathWise C++ execution completed successfully.\n";
    return 0;
}

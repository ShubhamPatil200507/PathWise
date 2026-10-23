#include <iostream>
#include <cassert>
#include <cmath>
#include "../include/pathwise/BinaryHeap.hpp"
#include "../include/pathwise/Heuristics.hpp"
#include "../include/pathwise/Grid.hpp"
#include "../include/pathwise/BFS.hpp"
#include "../include/pathwise/Dijkstra.hpp"
#include "../include/pathwise/AStar.hpp"
#include "../include/pathwise/Greedy.hpp"
#include "../include/pathwise/DStarLite.hpp"
#include "../include/pathwise/RoadNetwork.hpp"

using namespace pathwise;

void testBinaryHeap() {
    std::cout << "[RUNNING] testBinaryHeap..." << std::endl;
    BinaryHeap<std::string> heap;
    heap.push("item-30", 30.0);
    heap.push("item-10", 10.0);
    heap.push("item-20", 20.0);
    heap.push("item-5", 5.0);

    assert(heap.size() == 4);
    assert(heap.peek().priority == 5.0);

    assert(heap.pop().item == "item-5");
    assert(heap.pop().item == "item-10");
    assert(heap.pop().item == "item-20");
    assert(heap.pop().item == "item-30");
    assert(heap.isEmpty());

    // Tie-breaking check
    heap.push("high-sec", 10.0, 50.0);
    heap.push("low-sec", 10.0, 10.0);
    assert(heap.pop().item == "low-sec");

    std::cout << "  -> PASSED" << std::endl;
}

void testHeuristics() {
    std::cout << "[RUNNING] testHeuristics..." << std::endl;
    GridCoord a(0, 0);
    GridCoord b(3, 4);

    assert(calculateHeuristic(a, b, HeuristicType::MANHATTAN) == 7.0);
    assert(std::abs(calculateHeuristic(a, b, HeuristicType::OCTILE) - (3.0 * SQRT_2 + 1.0)) < 1e-4);
    assert(calculateHeuristic(a, b, HeuristicType::ZERO) == 0.0);
    assert(calculateHeuristic(a, b, HeuristicType::EUCLIDEAN) == 5.0);

    std::cout << "  -> PASSED" << std::endl;
}

void testCornerCuttingPrevention() {
    std::cout << "[RUNNING] testCornerCuttingPrevention..." << std::endl;
    int rows = 5, cols = 5;
    auto grid = createEmptyGrid(rows, cols);

    // Block orthogonal cells (1, 2) and (2, 3)
    grid[1][2].type = CellType::WALL;
    grid[2][3].type = CellType::WALL;

    // Moving diagonally from (2, 2) to (1, 3) must be strictly forbidden!
    auto neighbors = getValidNeighbors(grid, rows, cols, GridCoord(2, 2), MovementMode::EIGHT_DIRECTIONAL);
    bool hasDiagonalCut = false;
    for (const auto& n : neighbors) {
        if (n.coord.r == 1 && n.coord.c == 3) {
            hasDiagonalCut = true;
            break;
        }
    }
    assert(!hasDiagonalCut);

    std::cout << "  -> PASSED" << std::endl;
}

void testBFSOptimality() {
    std::cout << "[RUNNING] testBFSOptimality..." << std::endl;
    int rows = 10, cols = 10;
    auto grid = createEmptyGrid(rows, cols);
    GridCoord start(1, 1);
    GridCoord target(1, 6);

    auto res = runBFS(grid, rows, cols, start, target, MovementMode::FOUR_DIRECTIONAL);
    assert(res.metrics.found == true);
    assert(res.path.size() == 6); // 1,1 -> 1,2 -> 1,3 -> 1,4 -> 1,5 -> 1,6
    assert(res.metrics.pathCost == 5.0);

    std::cout << "  -> PASSED" << std::endl;
}

void testDijkstraAStarZeroEquivalence() {
    std::cout << "[RUNNING] testDijkstraAStarZeroEquivalence..." << std::endl;
    int rows = 10, cols = 10;
    auto grid = createEmptyGrid(rows, cols);

    // Weighted terrain
    grid[1][2].type = CellType::MUD;
    grid[1][2].weight = 3.0;
    grid[1][3].type = CellType::WATER;
    grid[1][3].weight = 5.0;

    GridCoord start(1, 1);
    GridCoord target(1, 5);

    auto dijkstraRes = runDijkstra(grid, rows, cols, start, target, MovementMode::FOUR_DIRECTIONAL);
    auto astarZeroRes = runAStar(grid, rows, cols, start, target, MovementMode::FOUR_DIRECTIONAL, HeuristicType::ZERO);

    assert(dijkstraRes.metrics.found == true);
    assert(astarZeroRes.metrics.found == true);
    assert(std::abs(dijkstraRes.metrics.pathCost - astarZeroRes.metrics.pathCost) < 1e-4);

    std::cout << "  -> PASSED" << std::endl;
}

void testAStarExpansionEfficiency() {
    std::cout << "[RUNNING] testAStarExpansionEfficiency..." << std::endl;
    int rows = 20, cols = 20;
    auto grid = createEmptyGrid(rows, cols);
    GridCoord start(2, 2);
    GridCoord target(18, 18);

    auto dRes = runDijkstra(grid, rows, cols, start, target, MovementMode::FOUR_DIRECTIONAL);
    auto aRes = runAStar(grid, rows, cols, start, target, MovementMode::FOUR_DIRECTIONAL, HeuristicType::MANHATTAN);

    assert(aRes.metrics.found == true);
    assert(std::abs(aRes.metrics.pathCost - dRes.metrics.pathCost) < 1e-4);
    // A* guided by heuristic expands significantly fewer nodes than Dijkstra on open terrain!
    assert(aRes.metrics.nodesExpanded < dRes.metrics.nodesExpanded);

    std::cout << "  -> PASSED" << std::endl;
}

void testUnreachableDestination() {
    std::cout << "[RUNNING] testUnreachableDestination..." << std::endl;
    int rows = 8, cols = 8;
    auto grid = createEmptyGrid(rows, cols);
    GridCoord start(1, 1);
    GridCoord target(4, 4);

    // Enclose target with walls
    grid[3][4].type = CellType::WALL;
    grid[5][4].type = CellType::WALL;
    grid[4][3].type = CellType::WALL;
    grid[4][5].type = CellType::WALL;

    auto res = runDijkstra(grid, rows, cols, start, target, MovementMode::FOUR_DIRECTIONAL);
    assert(res.metrics.found == false);
    assert(res.path.empty());

    std::cout << "  -> PASSED" << std::endl;
}

void testDStarLiteReplanning() {
    std::cout << "[RUNNING] testDStarLiteReplanning..." << std::endl;
    int rows = 12, cols = 12;
    auto grid = createEmptyGrid(rows, cols);
    GridCoord start(2, 2);
    GridCoord goal(2, 8);

    DStarLiteEngine engine(rows, cols, grid, start, goal, MovementMode::FOUR_DIRECTIONAL);
    auto initialRes = engine.runInitialSearch();

    assert(initialRes.metrics.found == true);
    assert(initialRes.metrics.pathCost == 6.0);

    // Dynamically insert wall blocking cell (2, 5) which is right in the direct trajectory
    std::vector<std::pair<GridCoord, CellType>> changes = {
        { GridCoord(2, 5), CellType::WALL }
    };
    auto replanRes = engine.replanAfterChange(changes);

    assert(!replanRes.path.empty());
    // Path should divert around (2, 5)
    for (const auto& p : replanRes.path) {
        assert(!(p.r == 2 && p.c == 5));
    }

    std::cout << "  -> PASSED" << std::endl;
}

void testRoadNetwork() {
    std::cout << "[RUNNING] testRoadNetwork..." << std::endl;
    auto graph = createDowntownMetropolisGraph();
    auto res = graph.findShortestPath("N1", "N11", true);

    assert(res.found == true);
    assert(res.totalCost > 0.0);
    assert(res.path.front() == "N1");
    assert(res.path.back() == "N11");

    std::cout << "  -> PASSED" << std::endl;
}

int main() {
    std::cout << "==========================================================" << std::endl;
    std::cout << "   PathWise C++ Algorithmic Verification Test Suite" << std::endl;
    std::cout << "==========================================================" << std::endl;

    testBinaryHeap();
    testHeuristics();
    testCornerCuttingPrevention();
    testBFSOptimality();
    testDijkstraAStarZeroEquivalence();
    testAStarExpansionEfficiency();
    testUnreachableDestination();
    testDStarLiteReplanning();
    testRoadNetwork();

    std::cout << "\n>>> ALL 9 C++ ALGORITHM TEST SUITES PASSED CLEANLY! <<<\n" << std::endl;
    return 0;
}

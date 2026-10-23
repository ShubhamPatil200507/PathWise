#pragma once

#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <cmath>
#include <functional>
#include <limits>

namespace pathwise {

enum class CellType {
    EMPTY,
    WALL,
    SAND,   // Weight 2.0
    MUD,    // Weight 3.0
    WATER,  // Weight 5.0
    ZONE    // Hazard Zone, Weight 10.0
};

enum class MovementMode {
    FOUR_DIRECTIONAL,
    EIGHT_DIRECTIONAL
};

enum class HeuristicType {
    MANHATTAN,
    OCTILE,
    EUCLIDEAN,
    CHEBYSHEV,
    ZERO
};

struct GridCoord {
    int r;
    int c;

    GridCoord() : r(0), c(0) {}
    GridCoord(int row, int col) : r(row), c(col) {}

    bool operator==(const GridCoord& other) const {
        return r == other.r && c == other.c;
    }

    bool operator!=(const GridCoord& other) const {
        return !(*this == other);
    }

    bool operator<(const GridCoord& other) const {
        if (r != other.r) return r < other.r;
        return c < other.c;
    }
};

struct GridCoordHash {
    std::size_t operator()(const GridCoord& coord) const {
        return std::hash<int>()(coord.r) ^ (std::hash<int>()(coord.c) << 1);
    }
};

struct GridCell {
    int r;
    int c;
    CellType type;
    double weight;
    double risk;
    double energyFactor;
    double speedFactor;

    GridCell(int row = 0, int col = 0, CellType t = CellType::EMPTY, double w = 1.0)
        : r(row), c(col), type(t), weight(w), risk(0.05), energyFactor(1.0), speedFactor(1.0) {}
};

struct MultiCriteriaWeights {
    double alpha; // Distance
    double beta;  // Travel time
    double gamma; // Energy
    double delta; // Risk

    MultiCriteriaWeights(double a = 1.0, double b = 1.0, double g = 1.0, double d = 1.0)
        : alpha(a), beta(b), gamma(g), delta(d) {}
};

struct SearchStepEvent {
    int step;
    std::string type; // "frontier", "expand", "relax", "path"
    GridCoord coord;
    GridCoord parent;
    bool hasParent;
    double g;
    double h;
    double f;
    std::string explanation;

    SearchStepEvent()
        : step(0), type(""), coord(0, 0), parent(0, 0), hasParent(false),
          g(0.0), h(0.0), f(0.0), explanation("") {}
};

struct AlgorithmMetrics {
    std::string algorithm;
    bool found;
    double pathCost;
    int pathLength;
    double geometricDistance;
    int nodesExpanded;
    int nodesDiscovered;
    int maxFrontierSize;
    double executionTimeMs;
    bool isOptimal;
    double replanningTimeMs;

    AlgorithmMetrics()
        : algorithm(""), found(false), pathCost(0.0), pathLength(0), geometricDistance(0.0),
          nodesExpanded(0), nodesDiscovered(0), maxFrontierSize(0),
          executionTimeMs(0.0), isOptimal(false), replanningTimeMs(0.0) {}
};

struct PathfindingResult {
    AlgorithmMetrics metrics;
    std::vector<GridCoord> path;
    std::vector<GridCoord> visitedOrder;
    std::vector<SearchStepEvent> stepEvents;
};

} // namespace pathwise

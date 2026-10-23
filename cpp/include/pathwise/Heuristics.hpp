#pragma once

#include <cmath>
#include <algorithm>
#include "Types.hpp"

namespace pathwise {

const double SQRT_2 = 1.4142135623730951;

inline double calculateHeuristic(
    const GridCoord& a,
    const GridCoord& b,
    HeuristicType type,
    double minTerrainCost = 1.0
) {
    if (type == HeuristicType::ZERO) {
        return 0.0;
    }

    double dx = std::abs(a.c - b.c);
    double dy = std::abs(a.r - b.r);

    double raw = 0.0;

    switch (type) {
        case HeuristicType::MANHATTAN:
            raw = dx + dy;
            break;

        case HeuristicType::OCTILE:
            raw = std::min(dx, dy) * SQRT_2 + std::abs(dx - dy);
            break;

        case HeuristicType::EUCLIDEAN:
            raw = std::hypot(dx, dy);
            break;

        case HeuristicType::CHEBYSHEV:
            raw = std::max(dx, dy);
            break;

        default:
            raw = dx + dy;
            break;
    }

    // Multiply by minTerrainCost to preserve strict admissibility: h(n) <= h*(n)
    return raw * minTerrainCost;
}

} // namespace pathwise

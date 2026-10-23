#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <cmath>
#include <chrono>
#include <limits>
#include <algorithm>
#include "BinaryHeap.hpp"

namespace pathwise {

struct RoadNode {
    std::string id;
    std::string name;
    double x;
    double y;
};

struct RoadEdge {
    std::string from;
    std::string to;
    double weight;
    std::string type;
};

struct RoadNetworkResult {
    bool found;
    std::vector<std::string> path;
    double totalCost;
    int nodesExpanded;
    double runtimeMs;
};

class PlanarRoadGraph {
private:
    std::unordered_map<std::string, RoadNode> nodes;
    std::unordered_map<std::string, std::vector<std::pair<std::string, double>>> adj;

public:
    void addNode(const std::string& id, const std::string& name, double x, double y) {
        nodes[id] = { id, name, x, y };
        if (adj.find(id) == adj.end()) {
            adj[id] = {};
        }
    }

    void addEdge(const std::string& u, const std::string& v, double weight, bool bidirectional = true) {
        adj[u].push_back({ v, weight });
        if (bidirectional) {
            adj[v].push_back({ u, weight });
        }
    }

    double euclideanHeuristic(const std::string& a, const std::string& b) const {
        auto itA = nodes.find(a);
        auto itB = nodes.find(b);
        if (itA == nodes.end() || itB == nodes.end()) return 0.0;
        double dx = itA->second.x - itB->second.x;
        double dy = itA->second.y - itB->second.y;
        return std::hypot(dx, dy) * 0.015; // scaled Euclidean heuristic
    }

    RoadNetworkResult findShortestPath(const std::string& startId, const std::string& targetId, bool useAStar = true) {
        auto t0 = std::chrono::high_resolution_clock::now();

        BinaryHeap<std::string> pq;
        std::unordered_map<std::string, double> dist;
        std::unordered_map<std::string, std::string> parents;
        std::unordered_set<std::string> closed;

        int nodesExpanded = 0;
        bool found = false;

        dist[startId] = 0.0;
        double startH = useAStar ? euclideanHeuristic(startId, targetId) : 0.0;
        pq.push(startId, startH, startH);

        while (!pq.isEmpty()) {
            auto top = pq.pop();
            std::string curr = top.item;

            if (closed.find(curr) != closed.end()) continue;
            closed.insert(curr);
            nodesExpanded++;

            if (curr == targetId) {
                found = true;
                break;
            }

            double currDist = dist[curr];
            for (const auto& edge : adj[curr]) {
                const std::string& neighbor = edge.first;
                double edgeWeight = edge.second;

                if (closed.find(neighbor) != closed.end()) continue;

                double altDist = currDist + edgeWeight;
                auto it = dist.find(neighbor);
                double prevDist = (it != dist.end()) ? it->second : std::numeric_limits<double>::infinity();

                if (altDist < prevDist) {
                    dist[neighbor] = altDist;
                    parents[neighbor] = curr;
                    double h = useAStar ? euclideanHeuristic(neighbor, targetId) : 0.0;
                    pq.push(neighbor, altDist + h, h);
                }
            }
        }

        auto t1 = std::chrono::high_resolution_clock::now();
        double elapsedMs = std::chrono::duration<double, std::milli>(t1 - t0).count();

        std::vector<std::string> path;
        if (found) {
            std::string curr = targetId;
            while (true) {
                path.push_back(curr);
                if (curr == startId) break;
                auto it = parents.find(curr);
                if (it == parents.end()) break;
                curr = it->second;
            }
            std::reverse(path.begin(), path.end());
        }

        double totalCost = found ? dist[targetId] : 0.0;
        return { found, path, totalCost, nodesExpanded, elapsedMs };
    }

    const RoadNode* getNode(const std::string& id) const {
        auto it = nodes.find(id);
        return it != nodes.end() ? &it->second : nullptr;
    }
};

inline PlanarRoadGraph createDowntownMetropolisGraph() {
    PlanarRoadGraph g;
    g.addNode("N1", "West Station", 80, 120);
    g.addNode("N2", "Grand Central", 260, 120);
    g.addNode("N3", "Civic Plaza", 440, 120);
    g.addNode("N4", "East Port", 620, 120);
    g.addNode("N5", "Market Street", 80, 260);
    g.addNode("N6", "Financial Hub", 260, 260);
    g.addNode("N7", "Tech Park", 440, 260);
    g.addNode("N8", "River Terminal", 620, 260);
    g.addNode("N9", "South Gate", 170, 400);
    g.addNode("N10", "Metro South", 350, 400);
    g.addNode("N11", "Airport Parkway", 530, 400);

    g.addEdge("N1", "N2", 4.2);
    g.addEdge("N2", "N3", 3.8);
    g.addEdge("N3", "N4", 5.1);
    g.addEdge("N1", "N5", 3.0);
    g.addEdge("N2", "N6", 2.8);
    g.addEdge("N3", "N7", 3.2);
    g.addEdge("N4", "N8", 4.0);
    g.addEdge("N5", "N6", 3.5);
    g.addEdge("N6", "N7", 3.1);
    g.addEdge("N7", "N8", 4.4);
    g.addEdge("N5", "N9", 4.8);
    g.addEdge("N6", "N10", 4.0);
    g.addEdge("N7", "N11", 4.5);
    g.addEdge("N9", "N10", 3.6);
    g.addEdge("N10", "N11", 3.9);
    // Express highway bypass
    g.addEdge("N1", "N6", 4.1);
    g.addEdge("N6", "N11", 5.8);

    return g;
}

} // namespace pathwise

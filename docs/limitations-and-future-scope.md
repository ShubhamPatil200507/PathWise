# Limitations and Future Scope

## 1. Current Limitations
1. **Grid Resolution Limits**: In-browser Canvas grid rendering remains smooth up to approximately $120 \times 120$ cells. Grids larger than $200 \times 200$ require GPU-accelerated WebGL or WebGPU tiling.
2. **Scalarized Multi-Criteria**: Multi-criteria optimization utilizes a weighted-sum linear scalarization. While intuitive and computationally fast, weighted-sum cannot discover points on non-convex regions of the Pareto front.
3. **Static Planar Road Graph**: The road-network module models planar road intersections and segment weights; dynamic vehicular traffic congestion simulation is currently synthetic rather than connected to live DOT feeds.

---

## 2. Future Scope & Research Extensions
1. **Hierarchical Pathfinding (HPA*)**: Implementing clustered abstract graph hierarchies to support mega-maps ($1000 \times 1000+$) with near-instantaneous routing.
2. **True Multi-Objective Pareto Search (MO-A*)**: Implementing vector-valued dominance relations to discover the entire non-dominated Pareto frontier for autonomous vehicle routing.
3. **Continuous State-Space Path Planning**: Extending grid and planar graphs to Continuous Any-Angle Pathfinding (Theta*, Field D*) and sampling-based motion planning (RRT* / PRM).
4. **Live OpenStreetMap Overpass API Ingestion**: Direct bounding-box ingestion of live geographic road networks and real-time open traffic feeds.

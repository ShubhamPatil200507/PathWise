import React, { useState, useMemo } from 'react';
import { MapPin, Navigation, Compass, Layers, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { BinaryHeap } from '../core/BinaryHeap';

export interface RoadNode {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface RoadEdge {
  from: string;
  to: string;
  weight: number; // distance in km or time
  type: 'highway' | 'arterial' | 'local';
}

export interface RoadNetwork {
  name: string;
  description: string;
  nodes: RoadNode[];
  edges: RoadEdge[];
}

export const PRESET_ROAD_NETWORKS: RoadNetwork[] = [
  {
    name: 'Metropolitan Downtown Grid',
    description: 'Avenues and cross-streets simulating urban center traffic with high-speed bypasses.',
    nodes: [
      { id: 'N1', name: 'West Station', x: 80, y: 120 },
      { id: 'N2', name: 'Grand Central', x: 260, y: 120 },
      { id: 'N3', name: 'Civic Plaza', x: 440, y: 120 },
      { id: 'N4', name: 'East Port', x: 620, y: 120 },
      { id: 'N5', name: 'Market Street', x: 80, y: 260 },
      { id: 'N6', name: 'Financial Hub', x: 260, y: 260 },
      { id: 'N7', name: 'Tech Park', x: 440, y: 260 },
      { id: 'N8', name: 'River Terminal', x: 620, y: 260 },
      { id: 'N9', name: 'South Gate', x: 170, y: 400 },
      { id: 'N10', name: 'Metro South', x: 350, y: 400 },
      { id: 'N11', name: 'Airport Parkway', x: 530, y: 400 },
    ],
    edges: [
      { from: 'N1', to: 'N2', weight: 4.2, type: 'arterial' },
      { from: 'N2', to: 'N3', weight: 3.8, type: 'arterial' },
      { from: 'N3', to: 'N4', weight: 5.1, type: 'arterial' },
      { from: 'N1', to: 'N5', weight: 3.0, type: 'local' },
      { from: 'N2', to: 'N6', weight: 2.8, type: 'local' },
      { from: 'N3', to: 'N7', weight: 3.2, type: 'local' },
      { from: 'N4', to: 'N8', weight: 4.0, type: 'local' },
      { from: 'N5', to: 'N6', weight: 3.5, type: 'local' },
      { from: 'N6', to: 'N7', weight: 3.1, type: 'local' },
      { from: 'N7', to: 'N8', weight: 4.4, type: 'local' },
      { from: 'N5', to: 'N9', weight: 4.8, type: 'arterial' },
      { from: 'N6', to: 'N10', weight: 4.0, type: 'arterial' },
      { from: 'N7', to: 'N11', weight: 4.5, type: 'arterial' },
      { from: 'N9', to: 'N10', weight: 3.6, type: 'local' },
      { from: 'N10', to: 'N11', weight: 3.9, type: 'local' },
      // Ring highway shortcut along outer perimeter
      { from: 'N1', to: 'N6', weight: 4.1, type: 'highway' },
      { from: 'N6', to: 'N11', weight: 5.8, type: 'highway' },
    ],
  },
  {
    name: 'Orbital Ring Road & Radial Arterials',
    description: 'Circular peripheral highway connected to concentric city core via 4 express arterials.',
    nodes: [
      { id: 'C0', name: 'City Core Hub', x: 350, y: 260 },
      { id: 'R1', name: 'North Ring Jct', x: 350, y: 90 },
      { id: 'R2', name: 'East Ring Jct', x: 570, y: 260 },
      { id: 'R3', name: 'South Ring Jct', x: 350, y: 430 },
      { id: 'R4', name: 'West Ring Jct', x: 130, y: 260 },
      { id: 'NE', name: 'Northeast Logistics', x: 510, y: 140 },
      { id: 'SE', name: 'Southeast Suburb', x: 510, y: 380 },
      { id: 'SW', name: 'Southwest Depot', x: 190, y: 380 },
      { id: 'NW', name: 'Northwest Campus', x: 190, y: 140 },
    ],
    edges: [
      // Radial spurs to City Core
      { from: 'C0', to: 'R1', weight: 5.5, type: 'arterial' },
      { from: 'C0', to: 'R2', weight: 5.8, type: 'arterial' },
      { from: 'C0', to: 'R3', weight: 5.4, type: 'arterial' },
      { from: 'C0', to: 'R4', weight: 5.6, type: 'arterial' },
      // Outer orbital ring highway
      { from: 'R1', to: 'NE', weight: 4.1, type: 'highway' },
      { from: 'NE', to: 'R2', weight: 4.0, type: 'highway' },
      { from: 'R2', to: 'SE', weight: 4.2, type: 'highway' },
      { from: 'SE', to: 'R3', weight: 4.3, type: 'highway' },
      { from: 'R3', to: 'SW', weight: 4.1, type: 'highway' },
      { from: 'SW', to: 'R4', weight: 4.2, type: 'highway' },
      { from: 'R4', to: 'NW', weight: 4.0, type: 'highway' },
      { from: 'NW', to: 'R1', weight: 4.1, type: 'highway' },
    ],
  },
];

export const RoadNetworkView: React.FC = () => {
  const [networkIdx, setNetworkIdx] = useState<number>(0);
  const currentNetwork = PRESET_ROAD_NETWORKS[networkIdx];

  const [startId, setStartId] = useState<string>(currentNetwork.nodes[0].id);
  const [targetId, setTargetId] = useState<string>(currentNetwork.nodes[currentNetwork.nodes.length - 1].id);
  const [algo, setAlgo] = useState<'astar' | 'dijkstra'>('astar');

  // Adjacency map
  const adjacency = useMemo(() => {
    const map = new Map<string, { to: string; weight: number }[]>();
    for (const n of currentNetwork.nodes) {
      map.set(n.id, []);
    }
    for (const e of currentNetwork.edges) {
      // Undirected bidirectional road segments
      map.get(e.from)?.push({ to: e.to, weight: e.weight });
      map.get(e.to)?.push({ to: e.from, weight: e.weight });
    }
    return map;
  }, [currentNetwork]);

  // Node lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, RoadNode>();
    for (const n of currentNetwork.nodes) {
      map.set(n.id, n);
    }
    return map;
  }, [currentNetwork]);

  // Run graph A* / Dijkstra
  const routeResult = useMemo(() => {
    const t0 = performance.now();
    const pq = new BinaryHeap<string>();
    const dist = new Map<string, number>();
    const parents = new Map<string, string>();
    const closed = new Set<string>();

    const targetNode = nodeMap.get(targetId);

    const h = (id: string) => {
      if (algo === 'dijkstra' || !targetNode) return 0;
      const n = nodeMap.get(id);
      if (!n) return 0;
      // Scaled Euclidean distance heuristic
      const dx = n.x - targetNode.x;
      const dy = n.y - targetNode.y;
      return Math.hypot(dx, dy) * 0.015;
    };

    dist.set(startId, 0);
    pq.push(startId, h(startId), h(startId));

    let nodesExpanded = 0;
    let found = false;

    while (!pq.isEmpty()) {
      const top = pq.pop()!;
      const currId = top.item;

      if (closed.has(currId)) continue;
      closed.add(currId);
      nodesExpanded++;

      if (currId === targetId) {
        found = true;
        break;
      }

      const neighbors = adjacency.get(currId) || [];
      const currDist = dist.get(currId) ?? Infinity;

      for (const edge of neighbors) {
        if (closed.has(edge.to)) continue;

        const altDist = currDist + edge.weight;
        const prevDist = dist.get(edge.to) ?? Infinity;

        if (altDist < prevDist) {
          dist.set(edge.to, altDist);
          parents.set(edge.to, currId);
          const f = altDist + h(edge.to);
          pq.push(edge.to, f, h(edge.to));
        }
      }
    }

    const t1 = performance.now();
    const runtimeMs = +(t1 - t0).toFixed(3);

    // Reconstruct path
    const path: string[] = [];
    let curr: string | undefined = targetId;

    if (found) {
      while (curr) {
        path.push(curr);
        if (curr === startId) break;
        curr = parents.get(curr);
      }
      path.reverse();
    }

    const totalCost = dist.get(targetId) ?? 0;

    return {
      found,
      path,
      totalCost: +totalCost.toFixed(2),
      nodesExpanded,
      runtimeMs,
    };
  }, [currentNetwork, startId, targetId, algo, adjacency, nodeMap]);

  const pathEdgesSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < routeResult.path.length - 1; i++) {
      const u = routeResult.path[i];
      const v = routeResult.path[i + 1];
      set.add(`${u}-${v}`);
      set.add(`${v}-${u}`);
    }
    return set;
  }, [routeResult.path]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-400" />
            Planar Graph & Road-Network Route Optimization
          </h2>
          <p className="text-xs text-slate-400">
            Advanced Module: Execute graph-search algorithms on arbitrary weighted planar graphs representing intersections and arterial highways.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400">Network:</span>
            <select
              value={networkIdx}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setNetworkIdx(idx);
                setStartId(PRESET_ROAD_NETWORKS[idx].nodes[0].id);
                setTargetId(PRESET_ROAD_NETWORKS[idx].nodes[PRESET_ROAD_NETWORKS[idx].nodes.length - 1].id);
              }}
              className="bg-transparent text-white font-medium focus:outline-none"
            >
              {PRESET_ROAD_NETWORKS.map((net, i) => (
                <option key={i} value={i} className="bg-slate-900 text-white">
                  {net.name}
                </option>
              ))}
            </select>
          </div>

          {/* Algorithm Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setAlgo('astar')}
              className={`px-3 py-1 rounded font-semibold transition ${
                algo === 'astar' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              A* (Euclidean H)
            </button>
            <button
              onClick={() => setAlgo('dijkstra')}
              className={`px-3 py-1 rounded font-semibold transition ${
                algo === 'dijkstra' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dijkstra
            </button>
          </div>
        </div>
      </div>

      {/* Interactive SVG Road Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 h-[520px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl relative">
          <svg className="w-full h-full" viewBox="0 0 700 500">
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.2)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#roadGrid)" />

            {/* Road Edges */}
            {currentNetwork.edges.map((e, idx) => {
              const u = nodeMap.get(e.from);
              const v = nodeMap.get(e.to);
              if (!u || !v) return null;
              const isPathEdge = pathEdgesSet.has(`${e.from}-${e.to}`);

              return (
                <g key={idx}>
                  <line
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke={
                      isPathEdge
                        ? '#c084fc'
                        : e.type === 'highway'
                        ? '#38bdf8'
                        : e.type === 'arterial'
                        ? '#64748b'
                        : '#334155'
                    }
                    strokeWidth={isPathEdge ? 5 : e.type === 'highway' ? 3.5 : 2}
                    strokeLinecap="round"
                  />
                  {/* Weight label */}
                  <rect
                    x={(u.x + v.x) / 2 - 14}
                    y={(u.y + v.y) / 2 - 9}
                    width={28}
                    height={16}
                    fill="#0f172a"
                    rx={3}
                    stroke="#334155"
                    strokeWidth={0.5}
                  />
                  <text
                    x={(u.x + v.x) / 2}
                    y={(u.y + v.y) / 2 + 3}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    {e.weight}k
                  </text>
                </g>
              );
            })}

            {/* Road Nodes */}
            {currentNetwork.nodes.map((node) => {
              const isStart = node.id === startId;
              const isTarget = node.id === targetId;
              const isPath = routeResult.path.includes(node.id);

              return (
                <g
                  key={node.id}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => {
                    if (startId !== node.id && targetId !== node.id) {
                      setTargetId(node.id);
                    } else if (startId === node.id) {
                      // Already start
                    }
                  }}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isStart || isTarget ? 14 : isPath ? 10 : 8}
                    fill={
                      isStart
                        ? '#10b981'
                        : isTarget
                        ? '#ef4444'
                        : isPath
                        ? '#a855f7'
                        : '#1e293b'
                    }
                    stroke={isStart || isTarget ? '#ffffff' : '#475569'}
                    strokeWidth={2}
                  />

                  {/* Node Name */}
                  <text
                    x={node.x}
                    y={node.y + 24}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize={11}
                    fontWeight={isStart || isTarget ? 'bold' : 'normal'}
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Quick Start / Destination Pin Selector Overlay */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 space-y-1.5 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Origin:</span>
              <select
                value={startId}
                onChange={(e) => setStartId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white"
              >
                {currentNetwork.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Destination:</span>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white"
              >
                {currentNetwork.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Route Details Side Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Route Solution</span>

            {routeResult.found ? (
              <div className="bg-emerald-950/80 border border-emerald-800 p-2.5 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Optimal Road Route Discovered</span>
              </div>
            ) : (
              <div className="bg-rose-950/80 border border-rose-800 p-2.5 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>No Path Connected Between Nodes</span>
              </div>
            )}

            <div className="space-y-2 font-mono text-xs">
              <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Total Distance:</span>
                <span className="text-purple-400 font-bold">{routeResult.totalCost} km</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Intersections:</span>
                <span className="text-sky-400 font-bold">{routeResult.path.length} hops</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Nodes Expanded:</span>
                <span className="text-amber-400 font-bold">{routeResult.nodesExpanded}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Execution Time:</span>
                <span className="text-emerald-400 font-bold">{routeResult.runtimeMs} ms</span>
              </div>
            </div>

            {/* Turn by turn waypoint route */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Waypoints</span>
              <div className="space-y-1 text-xs">
                {routeResult.path.map((id, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-slate-500 font-mono text-[10px] w-4">{idx + 1}.</span>
                    <span className="font-medium">{nodeMap.get(id)?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

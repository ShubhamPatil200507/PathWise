import React, { useState, useMemo } from 'react';
import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';
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
  weight: number; // distance in km
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
    name: 'Downtown City Center',
    description: 'Urban avenues and highways connecting key landmarks across town.',
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
      // Highway bypass
      { from: 'N1', to: 'N6', weight: 4.1, type: 'highway' },
      { from: 'N6', to: 'N11', weight: 5.8, type: 'highway' },
    ],
  },
];

export const RoadNetworkView: React.FC = () => {
  const currentNetwork = PRESET_ROAD_NETWORKS[0];
  const [startId, setStartId] = useState<string>(currentNetwork.nodes[0].id);
  const [targetId, setTargetId] = useState<string>(currentNetwork.nodes[currentNetwork.nodes.length - 1].id);
  const [algo, setAlgo] = useState<'astar' | 'dijkstra'>('astar');

  const adjacency = useMemo(() => {
    const map = new Map<string, { to: string; weight: number }[]>();
    for (const n of currentNetwork.nodes) {
      map.set(n.id, []);
    }
    for (const e of currentNetwork.edges) {
      map.get(e.from)?.push({ to: e.to, weight: e.weight });
      map.get(e.to)?.push({ to: e.from, weight: e.weight });
    }
    return map;
  }, [currentNetwork]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, RoadNode>();
    for (const n of currentNetwork.nodes) {
      map.set(n.id, n);
    }
    return map;
  }, [currentNetwork]);

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

    const path: string[] = [];
    if (found) {
      let curr: string | undefined = targetId;
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
      totalCost: +totalCost.toFixed(1),
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400" />
            City Road Navigation
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Click any two landmarks on the map to find the fastest driving route.
          </p>
        </div>

        {/* Algorithm toggle */}
        <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setAlgo('astar')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              algo === 'astar' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            A* Search (Direct)
          </button>
          <button
            onClick={() => setAlgo('dijkstra')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              algo === 'dijkstra' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Dijkstra (Ripples)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* SVG Map */}
        <div className="lg:col-span-3 h-[480px] bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-sm relative">
          <svg className="w-full h-full" viewBox="0 0 700 500">
            {/* Grid background */}
            <defs>
              <pattern id="cityGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(39, 39, 42, 0.4)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cityGrid)" />

            {/* Roads */}
            {currentNetwork.edges.map((e, idx) => {
              const u = nodeMap.get(e.from);
              const v = nodeMap.get(e.to);
              if (!u || !v) return null;
              const isPath = pathEdgesSet.has(`${e.from}-${e.to}`);

              return (
                <g key={idx}>
                  <line
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke={
                      isPath
                        ? '#c084fc'
                        : e.type === 'highway'
                        ? '#38bdf8'
                        : '#3f3f46'
                    }
                    strokeWidth={isPath ? 4.5 : e.type === 'highway' ? 3 : 2}
                    strokeLinecap="round"
                  />
                  {/* Distance label */}
                  <rect
                    x={(u.x + v.x) / 2 - 14}
                    y={(u.y + v.y) / 2 - 8}
                    width={28}
                    height={16}
                    fill="#18181b"
                    rx={3}
                    stroke="#27272a"
                    strokeWidth={0.5}
                  />
                  <text
                    x={(u.x + v.x) / 2}
                    y={(u.y + v.y) / 2 + 4}
                    textAnchor="middle"
                    fill="#71717a"
                    fontSize={10}
                    fontFamily="monospace"
                  >
                    {e.weight}k
                  </text>
                </g>
              );
            })}

            {/* Landmarks / Intersections */}
            {currentNetwork.nodes.map((node) => {
              const isStart = node.id === startId;
              const isTarget = node.id === targetId;
              const isPath = routeResult.path.includes(node.id);

              return (
                <g
                  key={node.id}
                  className="cursor-pointer transition hover:opacity-80"
                  onClick={() => {
                    if (startId !== node.id && targetId !== node.id) {
                      setTargetId(node.id);
                    }
                  }}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isStart || isTarget ? 13 : isPath ? 9 : 7}
                    fill={
                      isStart
                        ? '#10b981'
                        : isTarget
                        ? '#ef4444'
                        : isPath
                        ? '#a855f7'
                        : '#27272a'
                    }
                    stroke={isStart || isTarget ? '#ffffff' : '#52525b'}
                    strokeWidth={2}
                  />

                  <text
                    x={node.x}
                    y={node.y + 22}
                    textAnchor="middle"
                    fill="#e4e4e7"
                    fontSize={11}
                    fontWeight={isStart || isTarget ? 'bold' : 'normal'}
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Quick Selectors */}
          <div className="absolute bottom-3 left-3 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 space-y-1.5 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Start:</span>
              <select
                value={startId}
                onChange={(e) => setStartId(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-white"
              >
                {currentNetwork.nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Goal:</span>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-white"
              >
                {currentNetwork.nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <span className="text-xs font-semibold text-zinc-400 block">Driving Route</span>

            <div className="bg-emerald-950/60 border border-emerald-900/60 p-2.5 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Shortest route found!</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex justify-between">
                <span className="text-zinc-500">Distance:</span>
                <span className="text-purple-400 font-bold">{routeResult.totalCost} km</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex justify-between">
                <span className="text-zinc-500">Stops:</span>
                <span className="text-zinc-300 font-bold">{routeResult.path.length} landmarks</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex justify-between">
                <span className="text-zinc-500">Time:</span>
                <span className="text-emerald-400 font-bold">{routeResult.runtimeMs} ms</span>
              </div>
            </div>

            {/* Turn by turn */}
            <div className="pt-2 border-t border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-500 block mb-1.5">Turn-by-Turn Route</span>
              <div className="space-y-1 text-xs">
                {routeResult.path.map((id, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-zinc-300">
                    <span className="text-zinc-500 text-[10px] w-4">{idx + 1}.</span>
                    <span>{nodeMap.get(id)?.name}</span>
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

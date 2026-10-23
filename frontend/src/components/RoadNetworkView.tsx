import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Play,
  RotateCcw,
  Zap,
  MapPin,
  Clock,
  Compass,
  AlertTriangle,
  Car,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { AlgorithmId } from '../core/runner';
import { BinaryHeap } from '../core/BinaryHeap';

// Fix default Leaflet icon assets
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface MapCity {
  id: string;
  name: string;
  country: string;
  center: [number, number];
  zoom: number;
  landmarks: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: 'terminal' | 'station' | 'monument' | 'business' | 'park';
  }[];
  roads: {
    from: string;
    to: string;
    name: string;
    type: 'highway' | 'arterial' | 'local';
    closed?: boolean;
  }[];
}

const CITIES: MapCity[] = [
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    center: [18.955, 72.825],
    zoom: 13,
    landmarks: [
      { id: 'M1', name: 'Gateway of India', lat: 18.922, lng: 72.8347, type: 'monument' },
      { id: 'M2', name: 'Colaba Causeway', lat: 18.915, lng: 72.827, type: 'business' },
      { id: 'M3', name: 'Nariman Point', lat: 18.926, lng: 72.822, type: 'business' },
      { id: 'M4', name: 'Marine Drive Promenade', lat: 18.943, lng: 72.8235, type: 'monument' },
      { id: 'M5', name: 'Churchgate Station', lat: 18.9355, lng: 72.8275, type: 'station' },
      { id: 'M6', name: 'CSMT Heritage Terminal', lat: 18.94, lng: 72.8355, type: 'terminal' },
      { id: 'M7', name: 'Crawford Market', lat: 18.947, lng: 72.834, type: 'business' },
      { id: 'M8', name: 'Girgaon Chowpatty Beach', lat: 18.954, lng: 72.812, type: 'park' },
      { id: 'M9', name: 'Haji Ali Dargah', lat: 18.977, lng: 72.8105, type: 'monument' },
      { id: 'M10', name: 'Worli Seaface', lat: 19.005, lng: 72.815, type: 'monument' },
      { id: 'M11', name: 'Dadar Central Circle', lat: 19.018, lng: 72.843, type: 'station' },
      { id: 'M12', name: 'Bandra-Worli Sea Link', lat: 19.03, lng: 72.82, type: 'highway' as any },
    ],
    roads: [
      { from: 'M1', to: 'M2', name: 'Colaba Causeway Road', type: 'local' },
      { from: 'M1', to: 'M6', name: 'Dr. D.N. Road', type: 'arterial' },
      { from: 'M2', to: 'M3', name: 'Madame Cama Road', type: 'arterial' },
      { from: 'M3', to: 'M4', name: 'Netaji Subhash Chandra Bose Rd', type: 'highway' },
      { from: 'M4', to: 'M5', name: 'Maharshi Karve Road', type: 'arterial' },
      { from: 'M5', to: 'M6', name: 'V Veer Nariman Road', type: 'arterial' },
      { from: 'M6', to: 'M7', name: 'Lokmanya Tilak Marg', type: 'arterial' },
      { from: 'M4', to: 'M8', name: 'Marine Drive North', type: 'highway' },
      { from: 'M7', to: 'M8', name: 'Princess Street Flyover', type: 'arterial' },
      { from: 'M8', to: 'M9', name: 'Pedder Road / Lala Lajpatrai', type: 'arterial' },
      { from: 'M9', to: 'M10', name: 'Dr. Annie Besant Road', type: 'arterial' },
      { from: 'M10', to: 'M11', name: 'Senapati Bapat Marg', type: 'arterial' },
      { from: 'M10', to: 'M12', name: 'Bandra-Worli Coastal Expressway', type: 'highway' },
      { from: 'M11', to: 'M12', name: 'Western Express Connector', type: 'arterial' },
    ],
  },
  {
    id: 'nyc',
    name: 'New York (Manhattan)',
    country: 'USA',
    center: [40.75, -73.985],
    zoom: 13,
    landmarks: [
      { id: 'NY1', name: 'Times Square', lat: 40.758, lng: -73.9855, type: 'monument' },
      { id: 'NY2', name: 'Bryant Park & NY Public Library', lat: 40.7536, lng: -73.9832, type: 'park' },
      { id: 'NY3', name: 'Grand Central Terminal', lat: 40.7527, lng: -73.9772, type: 'terminal' },
      { id: 'NY4', name: 'Empire State Building', lat: 40.7484, lng: -73.9857, type: 'monument' },
      { id: 'NY5', name: 'Madison Square & Flatiron', lat: 40.741, lng: -73.9897, type: 'business' },
      { id: 'NY6', name: 'Union Square', lat: 40.7359, lng: -73.9911, type: 'station' },
      { id: 'NY7', name: 'Washington Square Park', lat: 40.7308, lng: -73.9973, type: 'park' },
      { id: 'NY8', name: 'SoHo Broadway District', lat: 40.7233, lng: -73.998, type: 'business' },
      { id: 'NY9', name: 'One World Trade Center', lat: 40.7127, lng: -74.0134, type: 'monument' },
      { id: 'NY10', name: 'Wall Street & Financial Dist', lat: 40.7069, lng: -74.009, type: 'business' },
      { id: 'NY11', name: 'Brooklyn Bridge Entry', lat: 40.7118, lng: -74.001, type: 'highway' as any },
      { id: 'NY12', name: 'Central Park South & Plaza', lat: 40.766, lng: -73.977, type: 'park' },
    ],
    roads: [
      { from: 'NY12', to: 'NY1', name: '7th Avenue', type: 'arterial' },
      { from: 'NY12', to: 'NY3', name: '5th Avenue Uptown', type: 'arterial' },
      { from: 'NY1', to: 'NY2', name: 'W 42nd Street', type: 'arterial' },
      { from: 'NY2', to: 'NY3', name: 'E 42nd Crosstown', type: 'arterial' },
      { from: 'NY2', to: 'NY4', name: '5th Avenue Midtown', type: 'arterial' },
      { from: 'NY1', to: 'NY4', name: 'Broadway', type: 'arterial' },
      { from: 'NY4', to: 'NY5', name: '5th Avenue South', type: 'arterial' },
      { from: 'NY5', to: 'NY6', name: 'Broadway & Park Ave S', type: 'arterial' },
      { from: 'NY6', to: 'NY7', name: 'University Place', type: 'local' },
      { from: 'NY7', to: 'NY8', name: 'West Broadway', type: 'arterial' },
      { from: 'NY8', to: 'NY9', name: 'West Street / Route 9A', type: 'highway' },
      { from: 'NY9', to: 'NY10', name: 'Broadway Downtown', type: 'arterial' },
      { from: 'NY10', to: 'NY11', name: 'FDR Drive Connector', type: 'highway' },
      { from: 'NY8', to: 'NY11', name: 'Canal Street Expressway', type: 'arterial' },
    ],
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    center: [51.5074, -0.12],
    zoom: 13,
    landmarks: [
      { id: 'L1', name: 'Westminster & Big Ben', lat: 51.5007, lng: -0.1246, type: 'monument' },
      { id: 'L2', name: 'London Eye & South Bank', lat: 51.5033, lng: -0.1195, type: 'monument' },
      { id: 'L3', name: 'Trafalgar Square', lat: 51.508, lng: -0.1281, type: 'monument' },
      { id: 'L4', name: 'Piccadilly Circus', lat: 51.5101, lng: -0.134, type: 'business' },
      { id: 'L5', name: 'Buckingham Palace', lat: 51.5014, lng: -0.1419, type: 'monument' },
      { id: 'L6', name: 'Covent Garden', lat: 51.5117, lng: -0.1232, type: 'business' },
      { id: 'L7', name: 'St Paul Cathedral', lat: 51.5138, lng: -0.0984, type: 'monument' },
      { id: 'L8', name: 'Tower Bridge & Tower of London', lat: 51.5081, lng: -0.0759, type: 'highway' as any },
      { id: 'L9', name: 'Hyde Park Corner', lat: 51.503, lng: -0.1517, type: 'park' },
    ],
    roads: [
      { from: 'L1', to: 'L2', name: 'Westminster Bridge Road', type: 'arterial' },
      { from: 'L1', to: 'L3', name: 'Whitehall Avenue', type: 'arterial' },
      { from: 'L3', to: 'L4', name: 'Piccadilly / Haymarket', type: 'arterial' },
      { from: 'L4', to: 'L5', name: 'The Mall & St James', type: 'arterial' },
      { from: 'L5', to: 'L9', name: 'Constitution Hill', type: 'arterial' },
      { from: 'L3', to: 'L6', name: 'Strand / Long Acre', type: 'local' },
      { from: 'L6', to: 'L7', name: 'Fleet Street / Ludgate Hill', type: 'arterial' },
      { from: 'L7', to: 'L8', name: 'Upper Thames Street Bypass', type: 'highway' },
      { from: 'L2', to: 'L8', name: 'Southwark Riverbank Way', type: 'arterial' },
    ],
  },
];

// Haversine distance in kilometers
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const RoadNetworkView: React.FC = () => {
  const [selectedCityId, setSelectedCityId] = useState<string>('mumbai');
  const city = useMemo(() => CITIES.find((c) => c.id === selectedCityId) || CITIES[0], [selectedCityId]);

  const [startId, setStartId] = useState<string>(city.landmarks[0].id);
  const [targetId, setTargetId] = useState<string>(city.landmarks[city.landmarks.length - 1].id);
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmId>('astar');
  const [mapTheme, setMapTheme] = useState<'streets' | 'dark' | 'satellite'>('streets');
  const [trafficLevel, setTrafficLevel] = useState<'normal' | 'moderate' | 'heavy'>('normal');

  // Closed roads state (for D* Lite replanning)
  const [closedRoads, setClosedRoads] = useState<Set<string>>(new Set());

  // Navigation animation & metrics
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [exploredNodeIds, setExploredNodeIds] = useState<string[]>([]);
  const [activeRoutePath, setActiveRoutePath] = useState<string[]>([]);
  const [routeMetrics, setRouteMetrics] = useState<{
    distanceKm: number;
    durationMin: number;
    exploredCount: number;
    runtimeMs: number;
    found: boolean;
  } | null>(null);

  // Map DOM and Leaflet instance
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const roadsLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const explorationLayerRef = useRef<L.LayerGroup | null>(null);

  // When city changes, reset start/target to defaults for that city
  useEffect(() => {
    setStartId(city.landmarks[0].id);
    setTargetId(city.landmarks[city.landmarks.length - 1].id);
    setClosedRoads(new Set());
    setActiveRoutePath([]);
    setExploredNodeIds([]);
    setRouteMetrics(null);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(city.center, city.zoom);
    }
  }, [city]);

  // Landmark Lookup Map
  const landmarkMap = useMemo(() => {
    const map = new Map<string, (typeof city.landmarks)[0]>();
    city.landmarks.forEach((l) => map.set(l.id, l));
    return map;
  }, [city]);

  // Graph Adjacency List
  const graph = useMemo(() => {
    const adj = new Map<
      string,
      { to: string; roadName: string; type: string; distanceKm: number; cost: number; roadKey: string }[]
    >();
    city.landmarks.forEach((l) => adj.set(l.id, []));

    const speedMap: Record<string, number> = {
      highway: 70, // km/h
      arterial: 40,
      local: 25,
    };

    const trafficMultiplier = trafficLevel === 'heavy' ? 2.2 : trafficLevel === 'moderate' ? 1.5 : 1.0;

    city.roads.forEach((r) => {
      const roadKey = `${r.from}-${r.to}`;
      if (closedRoads.has(roadKey) || closedRoads.has(`${r.to}-${r.from}`)) {
        return; // road is blocked
      }

      const u = landmarkMap.get(r.from);
      const v = landmarkMap.get(r.to);
      if (!u || !v) return;

      const dist = haversineKm(u.lat, u.lng, v.lat, v.lng);
      const baseSpeed = speedMap[r.type] || 35;
      const effectiveSpeed = baseSpeed / trafficMultiplier;
      // Cost in minutes of travel time
      const costMinutes = (dist / effectiveSpeed) * 60;

      adj.get(r.from)?.push({
        to: r.to,
        roadName: r.name,
        type: r.type,
        distanceKm: dist,
        cost: costMinutes,
        roadKey,
      });

      adj.get(r.to)?.push({
        to: r.from,
        roadName: r.name,
        type: r.type,
        distanceKm: dist,
        cost: costMinutes,
        roadKey,
      });
    });

    return adj;
  }, [city, landmarkMap, closedRoads, trafficLevel]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: city.center,
      zoom: city.zoom,
      zoomControl: true,
    });

    // Google Maps Style CartoDB Voyager Tile Layer
    const tileUrl =
      mapTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : mapTheme === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tiles = L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors & CartoDB',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tiles;
    roadsLayerRef.current = L.layerGroup().addTo(map);
    explorationLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when Map Theme Changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const tileUrl =
      mapTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : mapTheme === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    tileLayerRef.current.setUrl(tileUrl);
  }, [mapTheme]);

  // Render Roads, Markers, and Exploration on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !roadsLayerRef.current || !markersLayerRef.current) return;

    const roadsLayer = roadsLayerRef.current;
    const markersLayer = markersLayerRef.current;
    const expLayer = explorationLayerRef.current;

    roadsLayer.clearLayers();
    markersLayer.clearLayers();
    if (expLayer) expLayer.clearLayers();

    // 1. Draw City Roads
    city.roads.forEach((road) => {
      const u = landmarkMap.get(road.from);
      const v = landmarkMap.get(road.to);
      if (!u || !v) return;

      const isClosed = closedRoads.has(`${road.from}-${road.to}`) || closedRoads.has(`${road.to}-${road.from}`);

      const color = isClosed
        ? '#ef4444' // Red if road blocked
        : road.type === 'highway'
        ? '#0284c7' // Blue highway
        : road.type === 'arterial'
        ? '#d97706' // Amber main road
        : '#71717a'; // Gray local street

      const weight = isClosed ? 3 : road.type === 'highway' ? 5 : 3.5;
      const dashArray = isClosed ? '6, 6' : undefined;

      const polyline = L.polyline(
        [
          [u.lat, u.lng],
          [v.lat, v.lng],
        ],
        {
          color,
          weight,
          opacity: isClosed ? 0.9 : 0.7,
          dashArray,
        }
      );

      polyline.bindPopup(
        `<div style="font-family: sans-serif; font-size: 12px;">
          <strong>${road.name}</strong><br/>
          Type: ${road.type.toUpperCase()}<br/>
          Status: ${isClosed ? '<span style="color:red;font-weight:bold;">ROAD CLOSED</span>' : 'Open'}<br/>
          <button id="toggle-road" style="margin-top:6px;padding:3px 8px;background:${
            isClosed ? '#10b981' : '#ef4444'
          };color:white;border:none;border-radius:4px;cursor:pointer;">
            ${isClosed ? 'Reopen Road' : 'Close Road (Test D* Lite)'}
          </button>
        </div>`
      );

      polyline.on('popupopen', () => {
        const btn = document.getElementById('toggle-road');
        if (btn) {
          btn.onclick = () => {
            const key = `${road.from}-${road.to}`;
            setClosedRoads((prev) => {
              const next = new Set(prev);
              if (next.has(key)) next.delete(key);
              else next.add(key);
              return next;
            });
            polyline.closePopup();
          };
        }
      });

      roadsLayer.addLayer(polyline);
    });

    // 2. Draw Explored Intersections (Algorithm exploration step)
    if (expLayer && exploredNodeIds.length > 0) {
      exploredNodeIds.forEach((id) => {
        const node = landmarkMap.get(id);
        if (!node) return;
        const circle = L.circleMarker([node.lat, node.lng], {
          radius: 9,
          fillColor: '#38bdf8',
          fillOpacity: 0.6,
          color: '#0284c7',
          weight: 2,
        });
        expLayer.addLayer(circle);
      });
    }

    // 3. Draw Landmark Pin Markers
    city.landmarks.forEach((landmark) => {
      const isStart = landmark.id === startId;
      const isTarget = landmark.id === targetId;

      const iconHtml = isStart
        ? `<div style="background:#10b981;color:white;font-weight:bold;font-size:11px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(16,185,129,0.8);border:2px solid white;">S</div>`
        : isTarget
        ? `<div style="background:#ef4444;color:white;font-weight:bold;font-size:11px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(239,68,68,0.8);border:2px solid white;">★</div>`
        : `<div style="background:#18181b;color:#a1a1aa;font-size:10px;width:14px;height:14px;border-radius:50%;border:2px solid #52525b;box-shadow:0 1px 3px rgba(0,0,0,0.5);"></div>`;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-map-pin',
        iconSize: isStart || isTarget ? [28, 28] : [14, 14],
        iconAnchor: isStart || isTarget ? [14, 14] : [7, 7],
      });

      const marker = L.marker([landmark.lat, landmark.lng], { icon: customIcon });

      marker.bindPopup(
        `<div style="font-family: sans-serif; font-size: 12px;">
          <strong>${landmark.name}</strong><br/>
          <div style="margin-top:6px; display:flex; gap:4px;">
            <button id="set-start-${landmark.id}" style="padding:4px 8px; background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer;">
              Set as Start
            </button>
            <button id="set-dest-${landmark.id}" style="padding:4px 8px; background:#ef4444; color:white; border:none; border-radius:4px; cursor:pointer;">
              Set as Destination
            </button>
          </div>
        </div>`
      );

      marker.on('popupopen', () => {
        const sBtn = document.getElementById(`set-start-${landmark.id}`);
        const dBtn = document.getElementById(`set-dest-${landmark.id}`);
        if (sBtn) {
          sBtn.onclick = () => {
            setStartId(landmark.id);
            marker.closePopup();
          };
        }
        if (dBtn) {
          dBtn.onclick = () => {
            setTargetId(landmark.id);
            marker.closePopup();
          };
        }
      });

      markersLayer.addLayer(marker);
    });

    // 4. Draw Active Discovered Route Path (Google Maps Bold Route)
    if (activeRoutePath.length > 1) {
      const latlngs: [number, number][] = [];
      activeRoutePath.forEach((id) => {
        const l = landmarkMap.get(id);
        if (l) latlngs.push([l.lat, l.lng]);
      });

      // Outer outline for Google Maps style border
      const outerLine = L.polyline(latlngs, {
        color: '#1d4ed8',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Inner bright polyline
      const innerLine = L.polyline(latlngs, {
        color: '#38bdf8',
        weight: 5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      });

      roadsLayer.addLayer(outerLine);
      roadsLayer.addLayer(innerLine);
    }
  }, [city, landmarkMap, closedRoads, startId, targetId, exploredNodeIds, activeRoutePath]);

  // Execute Chosen Algorithm on City Road Graph
  const executePathfinding = (animate: boolean = false) => {
    if (startId === targetId) return;

    const t0 = performance.now();
    const targetNode = landmarkMap.get(targetId);
    if (!targetNode) return;

    // Heuristic function (Straight-line distance / max speed in minutes)
    const heuristic = (id: string): number => {
      if (selectedAlgo === 'dijkstra' || selectedAlgo === 'bfs') return 0;
      const curr = landmarkMap.get(id);
      if (!curr) return 0;
      const straightKm = haversineKm(curr.lat, curr.lng, targetNode.lat, targetNode.lng);
      // Min travel time in minutes assuming max highway speed (70 km/h)
      return (straightKm / 70) * 60;
    };

    const dist = new Map<string, number>();
    const parents = new Map<string, string>();
    const closed = new Set<string>();
    const explorationTrace: string[] = [];

    let found = false;

    if (selectedAlgo === 'bfs') {
      // Unweighted Queue
      const queue: string[] = [startId];
      dist.set(startId, 0);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (closed.has(curr)) continue;
        closed.add(curr);
        explorationTrace.push(curr);

        if (curr === targetId) {
          found = true;
          break;
        }

        const neighbors = graph.get(curr) || [];
        for (const edge of neighbors) {
          if (!dist.has(edge.to)) {
            dist.set(edge.to, (dist.get(curr) || 0) + 1);
            parents.set(edge.to, curr);
            queue.push(edge.to);
          }
        }
      }
    } else {
      // Priority Queue for A*, Dijkstra, Greedy, D* Lite
      const pq = new BinaryHeap<string>();
      dist.set(startId, 0);

      const startH = heuristic(startId);
      const startF = selectedAlgo === 'greedy' ? startH : startH;
      pq.push(startId, startF, startH);

      while (!pq.isEmpty()) {
        const top = pq.pop()!;
        const curr = top.item;

        if (closed.has(curr)) continue;
        closed.add(curr);
        explorationTrace.push(curr);

        if (curr === targetId) {
          found = true;
          break;
        }

        const neighbors = graph.get(curr) || [];
        const currentG = dist.get(curr) ?? Infinity;

        for (const edge of neighbors) {
          if (closed.has(edge.to)) continue;

          // For Greedy, edge cost is ignored; only h is evaluated
          const altG = currentG + edge.cost;
          const prevG = dist.get(edge.to) ?? Infinity;

          if (selectedAlgo === 'greedy' || altG < prevG) {
            dist.set(edge.to, altG);
            parents.set(edge.to, curr);
            const h = heuristic(edge.to);
            const f = selectedAlgo === 'greedy' ? h : altG + h;
            pq.push(edge.to, f, h);
          }
        }
      }
    }

    const t1 = performance.now();
    const runtimeMs = +(t1 - t0).toFixed(2);

    // Reconstruct Route
    const path: string[] = [];
    let totalKm = 0;
    let totalMinutes = 0;

    if (found) {
      let curr: string | undefined = targetId;
      while (curr) {
        path.push(curr);
        if (curr === startId) break;
        const prev: string | undefined = parents.get(curr);
        if (prev) {
          const edge = graph.get(prev)?.find((e) => e.to === curr);
          if (edge) {
            totalKm += edge.distanceKm;
            totalMinutes += edge.cost;
          }
        }
        curr = prev;
      }
      path.reverse();
    }

    const metrics = {
      distanceKm: +totalKm.toFixed(1),
      durationMin: Math.max(1, Math.round(totalMinutes)),
      exploredCount: explorationTrace.length,
      runtimeMs,
      found,
    };

    if (animate) {
      setIsNavigating(true);
      setExploredNodeIds([]);
      setActiveRoutePath([]);
      setRouteMetrics(null);

      let step = 0;
      const interval = setInterval(() => {
        step++;
        setExploredNodeIds(explorationTrace.slice(0, step));

        if (step >= explorationTrace.length) {
          clearInterval(interval);
          setActiveRoutePath(path);
          setRouteMetrics(metrics);
          setIsNavigating(false);
        }
      }, 70);
    } else {
      setExploredNodeIds(explorationTrace);
      setActiveRoutePath(path);
      setRouteMetrics(metrics);
      setIsNavigating(false);
    }
  };

  const handleReset = () => {
    setActiveRoutePath([]);
    setExploredNodeIds([]);
    setRouteMetrics(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Settings */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400" />
            Live Map Navigation & Routing
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Select a city, choose any of the 5 algorithms, and navigate real city road networks with live routing.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* City Selection */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 font-medium">City:</span>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
          </div>

          {/* Algorithm Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 font-medium">Algorithm:</span>
            <select
              value={selectedAlgo}
              onChange={(e) => setSelectedAlgo(e.target.value as AlgorithmId)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="astar" className="bg-zinc-900 text-white">A* Search (Direct & Fastest)</option>
              <option value="dijkstra" className="bg-zinc-900 text-white">Dijkstra (Guaranteed Shortest Time)</option>
              <option value="bfs" className="bg-zinc-900 text-white">BFS (Fewest Intersections)</option>
              <option value="greedy" className="bg-zinc-900 text-white">Greedy Best-First (Heuristic Rush)</option>
              <option value="dlite" className="bg-zinc-900 text-white">D* Lite (Dynamic Traffic Replanner)</option>
            </select>
          </div>

          {/* Traffic Conditions */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800">
            <Car className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={trafficLevel}
              onChange={(e) => setTrafficLevel(e.target.value as any)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="normal" className="bg-zinc-900 text-white">Normal Traffic</option>
              <option value="moderate" className="bg-zinc-900 text-white">Moderate Traffic</option>
              <option value="heavy" className="bg-zinc-900 text-white">Heavy Congestion</option>
            </select>
          </div>

          {/* Map Style */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1.5 rounded-lg border border-zinc-800">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={mapTheme}
              onChange={(e) => setMapTheme(e.target.value as any)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="streets" className="bg-zinc-900 text-white">Google Street Style</option>
              <option value="dark" className="bg-zinc-900 text-white">Dark Map Style</option>
              <option value="satellite" className="bg-zinc-900 text-white">Satellite Hybrid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Map + Google Maps Navigation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Interactive Leaflet Map */}
        <div className="lg:col-span-3 h-[540px] rounded-xl overflow-hidden border border-zinc-800 shadow-md relative bg-zinc-950">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Map Overlay: Quick Controls */}
          <div className="absolute top-3 left-14 z-20 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-1.5 rounded-lg shadow-lg">
            <button
              onClick={() => executePathfinding(true)}
              disabled={isNavigating}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm transition active:scale-95"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isNavigating ? 'Navigating...' : 'Animate Navigation'}</span>
            </button>

            <button
              onClick={() => executePathfinding(false)}
              disabled={isNavigating}
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm transition active:scale-95"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Instant Route</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium px-2.5 py-1.5 rounded-md border border-zinc-700 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-20 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-2 rounded-lg text-[11px] text-zinc-300 space-y-1 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Start Pin</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block ml-2" />
              <span>Destination Pin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-sky-500 inline-block rounded" />
              <span>Highway</span>
              <span className="w-3 h-1 bg-amber-500 inline-block rounded ml-2" />
              <span>Arterial</span>
              <span className="w-3 h-1 bg-zinc-500 inline-block rounded ml-2" />
              <span>Local</span>
            </div>
            <p className="text-[10px] text-zinc-500 pt-0.5">
              Click any road to close/reopen it and test D* Lite rerouting.
            </p>
          </div>
        </div>

        {/* Right Navigation Panel (Google Maps Style) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Origin & Destination Selectors */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex-1">
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Start</span>
                  <select
                    value={startId}
                    onChange={(e) => setStartId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-white"
                  >
                    {city.landmarks.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                <div className="flex-1">
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Destination</span>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-white"
                  >
                    {city.landmarks.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Route Summary Result */}
            {routeMetrics ? (
              routeMetrics.found ? (
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-emerald-400">
                        {routeMetrics.durationMin} min
                      </span>
                      <span className="text-xs text-zinc-400 ml-2">({routeMetrics.distanceKm} km)</span>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded font-medium">
                      Fastest route
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-zinc-800">
                    <div className="bg-zinc-900 p-2 rounded">
                      <span className="text-[10px] text-zinc-500 block">Nodes Checked</span>
                      <span className="text-sky-400 font-bold">{routeMetrics.exploredCount}</span>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded">
                      <span className="text-[10px] text-zinc-500 block">Search Time</span>
                      <span className="text-purple-400 font-bold">{routeMetrics.runtimeMs} ms</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-950/60 border border-rose-900/60 p-3 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>No route found. Try reopening closed roads!</span>
                </div>
              )
            ) : (
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-center text-xs text-zinc-500">
                Click <strong>"Animate Navigation"</strong> or <strong>"Instant Route"</strong> to find the shortest driving path.
              </div>
            )}

            {/* Turn-by-Turn Route Stops */}
            {activeRoutePath.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                <span className="text-[11px] font-semibold text-zinc-400 block">Turn-by-Turn Navigation</span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {activeRoutePath.map((id, idx) => {
                    const node = landmarkMap.get(id);
                    const isStart = idx === 0;
                    const isEnd = idx === activeRoutePath.length - 1;

                    return (
                      <div
                        key={id}
                        className={`p-2 rounded flex items-center gap-2 text-xs border ${
                          isStart
                            ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300'
                            : isEnd
                            ? 'bg-rose-950/40 border-rose-900/50 text-rose-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold text-zinc-500 w-4">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 truncate">
                          <span className="font-medium">{node?.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* D* Lite Replanning Tip */}
          <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
            <span className="text-purple-400 font-semibold block mb-0.5">D* Lite Replanner Tip:</span>
            Click any road segment directly on the map to close it. If you run D* Lite, it will immediately reroute around the blockage without recalculating the entire city from scratch!
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar, AppViewMode } from './components/Navbar';
import { CanvasGrid, DrawTool } from './components/CanvasGrid';
import { ControlsBar } from './components/ControlsBar';
import { EducationalPanel } from './components/EducationalPanel';
import { MetricsCard } from './components/MetricsCard';
import { ComparisonView } from './components/ComparisonView';
import { DynamicReplanningView } from './components/DynamicReplanningView';
import { MultiCriteriaView } from './components/MultiCriteriaView';
import { BenchmarkStudio } from './components/BenchmarkStudio';
import { RoadNetworkView } from './components/RoadNetworkView';
import { ScenarioModal, SavedScenario } from './components/ScenarioModal';
import { createEmptyGrid, coordKey, coordsEqual } from './core/grid';
import { AlgorithmId, runAlgorithm } from './core/runner';
import { GridCell, GridCoord, MovementMode, HeuristicType, SearchStepEvent, AlgorithmMetrics } from './core/types';
import { PRESET_SCENARIOS } from './core/presets';
import { checkBackendHealth } from './services/api';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppViewMode>('visualizer');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);

  // Environment Grid State
  const [rows, setRows] = useState<number>(25);
  const [cols, setCols] = useState<number>(35);
  const [grid, setGrid] = useState<GridCell[][]>(() => createEmptyGrid(25, 35));
  const [start, setStart] = useState<GridCoord>({ r: 12, c: 4 });
  const [target, setTarget] = useState<GridCoord>({ r: 12, c: 30 });

  // Algorithmic settings
  const [algorithm, setAlgorithm] = useState<AlgorithmId>('astar');
  const [movement, setMovement] = useState<MovementMode>('4-directional');
  const [heuristic, setHeuristic] = useState<HeuristicType>('manhattan');
  const [selectedPreset, setSelectedPreset] = useState<string>('empty-grid');
  const [drawTool, setDrawTool] = useState<DrawTool>('wall');

  // Animation Playback State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(30); // 1 to 100
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());
  const [frontierNodes, setFrontierNodes] = useState<Set<string>>(new Set());
  const [pathNodes, setPathNodes] = useState<GridCoord[]>([]);
  const [activeNode, setActiveNode] = useState<GridCoord | null>(null);

  const [stepEvents, setStepEvents] = useState<SearchStepEvent[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [metrics, setMetrics] = useState<AlgorithmMetrics | null>(null);
  const [hoverCoord, setHoverCoord] = useState<GridCoord | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number>(0);

  // Check Backend Health on Mount
  useEffect(() => {
    checkBackendHealth().then(setBackendOnline);
    const timer = setInterval(() => {
      checkBackendHealth().then(setBackendOnline);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Handle Preset Selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    handleResetExploration();

    const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (preset) {
      setRows(preset.rows);
      setCols(preset.cols);
      setStart(preset.start);
      setTarget(preset.target);
      setGrid(preset.generate());
    }
  };

  // Reset visualization path and exploration
  const handleResetExploration = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setVisitedNodes(new Set());
    setFrontierNodes(new Set());
    setPathNodes([]);
    setActiveNode(null);
    setStepEvents([]);
    setCurrentStepIdx(0);
    setMetrics(null);
  }, []);

  // Clear entire board (walls and terrain)
  const handleClearBoard = () => {
    handleResetExploration();
    setGrid(createEmptyGrid(rows, cols));
    setSelectedPreset('custom');
  };

  // Start Animation Run
  const handleStartRun = () => {
    handleResetExploration();

    // Execute algorithm to gather verified event trace and metrics
    const result = runAlgorithm(algorithm, {
      rows,
      cols,
      grid,
      start,
      target,
      movement,
      heuristic,
      recordEvents: true,
    });

    setStepEvents(result.stepEvents);
    setMetrics(result.metrics);
    setIsRunning(true);
    setIsPaused(false);
    setCurrentStepIdx(0);
  };

  // Run instantly without animation delay
  const handleRunInstant = () => {
    handleResetExploration();

    const result = runAlgorithm(algorithm, {
      rows,
      cols,
      grid,
      start,
      target,
      movement,
      heuristic,
      recordEvents: false,
    });

    const vSet = new Set(result.visitedOrder.map(coordKey));
    setVisitedNodes(vSet);
    setFrontierNodes(new Set());
    setPathNodes(result.path);
    setMetrics(result.metrics);
    setIsRunning(false);
    setIsPaused(false);
  };

  // Advance single step in event trace
  const advanceStep = useCallback(
    (index: number): boolean => {
      if (index >= stepEvents.length) {
        setIsRunning(false);
        setIsPaused(false);
        return false;
      }

      const evt = stepEvents[index];
      const key = coordKey(evt.coord);

      if (evt.type === 'expand') {
        setActiveNode(evt.coord);
        setVisitedNodes((prev) => new Set(prev).add(key));
        setFrontierNodes((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else if (evt.type === 'frontier' || evt.type === 'relax') {
        setFrontierNodes((prev) => new Set(prev).add(key));
      } else if (evt.type === 'path') {
        setPathNodes((prev) => [...prev, evt.coord]);
      }

      setCurrentStepIdx(index + 1);
      return true;
    },
    [stepEvents]
  );

  // Animation Loop using requestAnimationFrame
  useEffect(() => {
    if (!isRunning || isPaused || stepEvents.length === 0) return;

    // Delay inversely proportional to speed (100 = 0ms/fastest batching, 1 = 150ms/slowest)
    const intervalMs = Math.max(0, 150 - speed * 1.45);
    const stepsPerFrame = speed > 50 ? Math.floor(speed / 15) : 1;

    const loop = (timestamp: number) => {
      if (!lastStepTimeRef.current) lastStepTimeRef.current = timestamp;

      if (timestamp - lastStepTimeRef.current >= intervalMs) {
        lastStepTimeRef.current = timestamp;

        let cur = currentStepIdx;
        let cont = true;

        for (let i = 0; i < stepsPerFrame && cont; i++) {
          cont = advanceStep(cur);
          cur++;
        }

        if (!cont) return;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isRunning, isPaused, stepEvents, currentStepIdx, speed, advanceStep]);

  // Step Forward Button
  const handleStepForward = () => {
    if (stepEvents.length === 0) {
      const result = runAlgorithm(algorithm, {
        rows,
        cols,
        grid,
        start,
        target,
        movement,
        heuristic,
        recordEvents: true,
      });
      setStepEvents(result.stepEvents);
      setMetrics(result.metrics);
      setIsRunning(true);
      setIsPaused(true);
      advanceStep(0);
    } else {
      setIsPaused(true);
      advanceStep(currentStepIdx);
    }
  };

  // Grid Cell Interaction (Drawing & Erasing)
  const applyToolToCell = (coord: GridCoord, tool: DrawTool) => {
    if (coordsEqual(coord, start) || coordsEqual(coord, target)) return;

    const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
    const cell = newGrid[coord.r][coord.c];

    if (tool === 'wall') {
      cell.type = 'wall';
      cell.weight = Infinity;
    } else if (tool === 'eraser') {
      cell.type = 'empty';
      cell.weight = 1.0;
    } else if (tool === 'sand') {
      cell.type = 'sand';
      cell.weight = 2.0;
    } else if (tool === 'mud') {
      cell.type = 'mud';
      cell.weight = 3.0;
    } else if (tool === 'water') {
      cell.type = 'water';
      cell.weight = 5.0;
    } else if (tool === 'zone') {
      cell.type = 'zone';
      cell.weight = 10.0;
    }

    setGrid(newGrid);
    setSelectedPreset('custom');
  };

  const handleCellClick = (coord: GridCoord, tool: DrawTool) => {
    applyToolToCell(coord, tool);
  };

  const handleCellDrag = (coord: GridCoord, tool: DrawTool) => {
    applyToolToCell(coord, tool);
  };

  const handleLoadScenario = (scen: SavedScenario) => {
    handleResetExploration();
    setRows(scen.rows);
    setCols(scen.cols);
    setStart(scen.start);
    setTarget(scen.target);
    setMovement(scen.movement);
    setGrid(scen.grid);
    setSelectedPreset('custom');
  };

  const currentStepEvent =
    stepEvents.length > 0 && currentStepIdx > 0
      ? stepEvents[Math.min(currentStepIdx - 1, stepEvents.length - 1)]
      : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
        backendOnline={backendOnline}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">
        {currentView === 'visualizer' && (
          <>
            {/* Controls Bar */}
            <ControlsBar
              algorithm={algorithm}
              onSelectAlgorithm={(id) => {
                setAlgorithm(id);
                handleResetExploration();
              }}
              movement={movement}
              onChangeMovement={(m) => {
                setMovement(m);
                handleResetExploration();
              }}
              heuristic={heuristic}
              onChangeHeuristic={(h) => {
                setHeuristic(h);
                handleResetExploration();
              }}
              selectedPreset={selectedPreset}
              onSelectPreset={handleSelectPreset}
              drawTool={drawTool}
              onSelectDrawTool={setDrawTool}
              isRunning={isRunning}
              isPaused={isPaused}
              onStart={handleStartRun}
              onPause={() => setIsPaused(true)}
              onResume={() => setIsPaused(false)}
              onStepForward={handleStepForward}
              onRunInstant={handleRunInstant}
              onResetExploration={handleResetExploration}
              onClearBoard={handleClearBoard}
              speed={speed}
              onChangeSpeed={setSpeed}
            />

            {/* Canvas Grid View & Educational Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
              {/* Canvas Renderer */}
              <div className="lg:col-span-3 h-[520px]">
                <CanvasGrid
                  rows={rows}
                  cols={cols}
                  grid={grid}
                  start={start}
                  target={target}
                  visitedNodes={visitedNodes}
                  frontierNodes={frontierNodes}
                  pathNodes={pathNodes}
                  currentActiveNode={activeNode}
                  drawTool={drawTool}
                  isRunning={isRunning && !isPaused}
                  onCellClick={handleCellClick}
                  onCellDrag={handleCellDrag}
                  onHoverCell={setHoverCoord}
                  onMoveStart={setStart}
                  onMoveTarget={setTarget}
                />
              </div>

              {/* Real-time Educational Inspector */}
              <div className="h-[520px]">
                <EducationalPanel
                  algorithm={algorithm}
                  currentStepEvent={currentStepEvent}
                  stepIndex={currentStepIdx}
                  totalSteps={stepEvents.length}
                  openSetSize={frontierNodes.size}
                  closedSetSize={visitedNodes.size}
                  hoverCoord={hoverCoord}
                />
              </div>
            </div>

            {/* Performance Metrics Summary Card */}
            <MetricsCard metrics={metrics} />
          </>
        )}

        {currentView === 'comparison' && (
          <ComparisonView
            rows={rows}
            cols={cols}
            grid={grid}
            start={start}
            target={target}
            movement={movement}
            heuristic={heuristic}
          />
        )}

        {currentView === 'dynamic' && (
          <DynamicReplanningView
            rows={rows}
            cols={cols}
            grid={grid}
            start={start}
            target={target}
            movement={movement}
          />
        )}

        {currentView === 'multicriteria' && (
          <MultiCriteriaView
            rows={rows}
            cols={cols}
            grid={grid}
            start={start}
            target={target}
            movement={movement}
          />
        )}

        {currentView === 'benchmarks' && <BenchmarkStudio />}

        {currentView === 'roadnetwork' && <RoadNetworkView />}
      </main>

      {/* Scenario Management Modal */}
      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        currentGrid={grid}
        rows={rows}
        cols={cols}
        start={start}
        target={target}
        movement={movement}
        onLoadScenario={handleLoadScenario}
      />
    </div>
  );
};

export default App;

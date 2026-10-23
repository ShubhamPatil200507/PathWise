import React, { useState } from 'react';
import { X, Save, FolderOpen, Download, Upload, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { GridCell, GridCoord, MovementMode } from '../core/types';

export interface SavedScenario {
  id: string;
  name: string;
  description: string;
  rows: number;
  cols: number;
  start: GridCoord;
  target: GridCoord;
  movement: MovementMode;
  grid: GridCell[][];
  createdAt: string;
}

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGrid: GridCell[][];
  rows: number;
  cols: number;
  start: GridCoord;
  target: GridCoord;
  movement: MovementMode;
  onLoadScenario: (scenario: SavedScenario) => void;
}

const LOCAL_STORAGE_KEY = 'pathwise_saved_maps_v1';

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  currentGrid,
  rows,
  cols,
  start,
  target,
  movement,
  onLoadScenario,
}) => {
  const [scenarioName, setScenarioName] = useState<string>('');
  const [scenarioDesc, setScenarioDesc] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getSavedScenarios = (): SavedScenario[] => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const [savedList, setSavedList] = useState<SavedScenario[]>(getSavedScenarios);

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    if (!scenarioName.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a name for your map.' });
      return;
    }

    const newScenario: SavedScenario = {
      id: `map_${Date.now()}`,
      name: scenarioName.trim(),
      description: scenarioDesc.trim(),
      rows,
      cols,
      start,
      target,
      movement,
      grid: currentGrid.map((r) => r.map((c) => ({ ...c }))),
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [newScenario, ...savedList];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setSavedList(updated);
    setScenarioName('');
    setScenarioDesc('');
    setStatusMsg({ type: 'success', text: `Map "${newScenario.name}" saved successfully!` });
  };

  const handleDelete = (id: string) => {
    const updated = savedList.filter((s) => s.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setSavedList(updated);
    setStatusMsg({ type: 'success', text: 'Map deleted.' });
  };

  const handleExportJSON = (scen: SavedScenario) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scen, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${scen.name.toLowerCase().replace(/\s+/g, '_')}_map.json`);
    dlAnchorElem.click();
    dlAnchorElem.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (!parsed.rows || !parsed.cols || !parsed.grid || !parsed.start || !parsed.target) {
            throw new Error('Missing required map fields (rows, cols, grid, start, target).');
          }

          const imported: SavedScenario = {
            id: `import_${Date.now()}`,
            name: parsed.name || 'Imported Map',
            description: parsed.description || 'Imported from file',
            rows: parsed.rows,
            cols: parsed.cols,
            start: parsed.start,
            target: parsed.target,
            movement: parsed.movement || '4-directional',
            grid: parsed.grid,
            createdAt: new Date().toLocaleDateString(),
          };

          const updated = [imported, ...savedList];
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
          setSavedList(updated);
          setStatusMsg({ type: 'success', text: `Map "${imported.name}" imported successfully!` });
        } catch (err: any) {
          setStatusMsg({ type: 'error', text: `Import failed: ${err.message}` });
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-sm text-white">Save & Load Maps</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-2.5 rounded-lg flex items-center gap-2 text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-900/60'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Save Current Section */}
          <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-2.5">
            <span className="font-medium text-zinc-300 block">Save Current Map Layout</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Map name (e.g. My Maze 1)"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
              <input
                type="text"
                placeholder="Optional description"
                value={scenarioDesc}
                onChange={(e) => setScenarioDesc(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <button
              onClick={handleSaveCurrent}
              className="flex items-center justify-center gap-1.5 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-1.5 rounded-lg transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Map</span>
            </button>
          </div>

          {/* Saved Maps List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
              <span className="font-medium text-zinc-400">Saved Maps ({savedList.length})</span>
              <label className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] font-medium px-2 py-1 rounded cursor-pointer transition">
                <Upload className="w-3 h-3 text-sky-400" />
                <span>Import JSON</span>
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
            </div>

            {savedList.length > 0 ? (
              <div className="space-y-2">
                {savedList.map((scen) => (
                  <div
                    key={scen.id}
                    className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition"
                  >
                    <div>
                      <span className="font-semibold text-white block">{scen.name}</span>
                      {scen.description && (
                        <span className="text-[11px] text-zinc-400 block">{scen.description}</span>
                      )}
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {scen.rows}×{scen.cols} • {scen.movement} • {scen.createdAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onLoadScenario(scen);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleExportJSON(scen)}
                        title="Download as JSON"
                        className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(scen.id)}
                        title="Delete"
                        className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/80 rounded border border-rose-900/60 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-zinc-500 text-xs">
                No saved maps yet. Draw walls or terrain on the grid and save above.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

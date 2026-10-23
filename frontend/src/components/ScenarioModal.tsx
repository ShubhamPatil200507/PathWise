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

const LOCAL_STORAGE_KEY = 'pathwise_saved_scenarios_v1';

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

  // Load from localStorage
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
      setStatusMsg({ type: 'error', text: 'Please enter a name for the scenario.' });
      return;
    }

    const newScenario: SavedScenario = {
      id: `scen_${Date.now()}`,
      name: scenarioName.trim(),
      description: scenarioDesc.trim(),
      rows,
      cols,
      start,
      target,
      movement,
      grid: currentGrid,
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [newScenario, ...savedList];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setSavedList(updated);
    setScenarioName('');
    setScenarioDesc('');
    setStatusMsg({ type: 'success', text: 'Scenario saved successfully to browser storage!' });
  };

  const handleDelete = (id: string) => {
    const updated = savedList.filter((s) => s.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setSavedList(updated);
  };

  const handleExportJSON = (s: SavedScenario) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(s, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${s.name.replace(/\s+/g, '_')}_scenario.json`);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          // Schema validation
          if (!parsed.rows || !parsed.cols || !parsed.grid || !parsed.start || !parsed.target) {
            throw new Error('Invalid JSON structure: Missing required scenario fields.');
          }
          if (parsed.grid.length !== parsed.rows || parsed.grid[0].length !== parsed.cols) {
            throw new Error('Grid dimension mismatch in imported scenario.');
          }

          const imported: SavedScenario = {
            id: `import_${Date.now()}`,
            name: parsed.name || 'Imported Scenario',
            description: parsed.description || 'Imported from JSON',
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
          setStatusMsg({ type: 'success', text: `Scenario "${imported.name}" imported successfully!` });
        } catch (err: any) {
          setStatusMsg({ type: 'error', text: `Import Error: ${err.message}` });
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-sm text-white">Scenario Management & Persistence</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-rose-950 text-rose-300 border-rose-800'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Save Current */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider text-[10px]">
              Save Current Environment
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Scenario Name (e.g., Narrow Maze Bottleneck)"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2 focus:outline-none focus:border-brand-500"
              />
              <input
                type="text"
                placeholder="Description / Hypothesis..."
                value={scenarioDesc}
                onChange={(e) => setScenarioDesc(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Grid: {rows}×{cols} • Start: ({start.r},{start.c}) • Target: ({target.r},{target.c})
              </span>
              <button
                onClick={handleSaveCurrent}
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow active:scale-95 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Scenario</span>
              </button>
            </div>
          </div>

          {/* Import / Export Controls */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300">Saved Custom Scenarios ({savedList.length})</span>
            <label className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>

          {/* Scenarios List */}
          {savedList.length > 0 ? (
            <div className="space-y-2">
              {savedList.map((scen) => (
                <div
                  key={scen.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-xs text-white block">{scen.name}</span>
                    <span className="text-[11px] text-slate-400 block">{scen.description || 'No description'}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {scen.rows}×{scen.cols} • {scen.movement} • Saved {scen.createdAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onLoadScenario(scen);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleExportJSON(scen)}
                      title="Export as JSON"
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(scen.id)}
                      title="Delete Scenario"
                      className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No saved custom scenarios. Create custom walls or weighted terrain, then save above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

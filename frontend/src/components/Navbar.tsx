import React from 'react';
import {
  Compass,
  Scale,
  RefreshCw,
  Sliders,
  BarChart3,
  Navigation,
  FolderOpen,
  Server,
  Zap,
} from 'lucide-react';

export type AppViewMode =
  | 'visualizer'
  | 'comparison'
  | 'dynamic'
  | 'multicriteria'
  | 'benchmarks'
  | 'roadnetwork';

interface NavbarProps {
  currentView: AppViewMode;
  onChangeView: (view: AppViewMode) => void;
  onOpenScenarioModal: () => void;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  onOpenScenarioModal,
  backendOnline,
}) => {
  const navItems: { id: AppViewMode; label: string; icon: any }[] = [
    { id: 'visualizer', label: 'Pathfinding Lab', icon: Compass },
    { id: 'comparison', label: 'Algorithm Comparison', icon: Scale },
    { id: 'dynamic', label: 'Dynamic Replanning', icon: RefreshCw },
    { id: 'multicriteria', label: 'Multi-Criteria Opt', icon: Sliders },
    { id: 'benchmarks', label: 'Benchmark Studio', icon: BarChart3 },
    { id: 'roadnetwork', label: 'Road Network Graph', icon: Navigation },
  ];

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-purple-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-white font-sans">
                PathWise
              </h1>
              <span className="text-[10px] font-mono font-bold bg-brand-950 text-brand-300 border border-brand-800 px-1.5 py-0.5 rounded">
                v2.0 PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Intelligent Pathfinding & Optimization Platform
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Scenario Storage & Backend Status */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenScenarioModal}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition"
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Scenarios</span>
          </button>

          {/* Backend Online Pill */}
          <div
            className={`flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg border ${
              backendOnline
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={backendOnline ? 'Connected to FastAPI Backend Engine' : 'Running in Offline Local Engine Mode'}
          >
            <Server className={`w-3.5 h-3.5 ${backendOnline ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>{backendOnline ? 'API Active' : 'Local Engine'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Compass, Columns2, MapPin, Gauge, RotateCcw } from 'lucide-react';

export type AppViewMode = 'visualizer' | 'compare' | 'city' | 'benchmarks';

interface NavbarProps {
  currentView: AppViewMode;
  onChangeView: (view: AppViewMode) => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  onReset,
}) => {
  const tabs: { id: AppViewMode; label: string; icon: any }[] = [
    { id: 'visualizer', label: 'Visualizer', icon: Compass },
    { id: 'compare', label: 'Compare (5 Algos)', icon: Columns2 },
    { id: 'city', label: 'Map Navigation', icon: MapPin },
    { id: 'benchmarks', label: 'Speed Test', icon: Gauge },
  ];

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-sm text-zinc-100 tracking-tight">PathWise</span>
            <span className="hidden sm:inline-block text-xs text-zinc-500 ml-2">Interactive pathfinding</span>
          </div>
        </div>

        {/* Clean Center Navigation */}
        <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeView(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  active
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            title="Reset exploration"
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <a
            href="https://github.com/ShubhamPatil200507/PathWise"
            target="_blank"
            rel="noreferrer"
            title="View source on GitHub"
            className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-900 border border-zinc-800 transition"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};

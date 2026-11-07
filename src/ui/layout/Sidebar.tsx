import React from 'react';
import { ROUTES } from '../../app/routes';
import { useUIStore } from '../../store/uiStore';
import { TrendingUp } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-950 border-r border-gray-800/80 p-4 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-3 py-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-gray-100">
            EMPIRE LEDGER
          </h1>
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">
            Market Tycoon v0.1
          </span>
        </div>
      </div>

      {/* Navigation Routes */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {ROUTES.map((route) => {
          const Icon = route.icon;
          const isActive = activeTab === route.id;

          return (
            <button
              key={route.id}
              onClick={() => setActiveTab(route.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
              <span>{route.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-800/80 text-xs text-gray-500 flex items-center justify-between px-2">
        <span>Headless Engine Active</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </aside>
  );
};

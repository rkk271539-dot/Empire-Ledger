import React from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { ROUTES } from '../../app/routes';
import { useUIStore } from '../../store/uiStore';

export const BottomTabs: React.FC = () => {
  const { activeTab, setActiveTab, isMoreMenuOpen, setMoreMenuOpen } = useUIStore();

  const primaryRoutes = ROUTES.filter((r) => r.inMobileBar);
  const secondaryRoutes = ROUTES.filter((r) => !r.inMobileBar);

  const isSecondaryActive = secondaryRoutes.some((r) => r.id === activeTab);

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-md border-t border-gray-800/80 px-2 pb-[env(safe-area-inset-bottom,0.5rem)] pt-1">
        <div className="grid grid-cols-5 gap-1 items-center">
          {primaryRoutes.map((route) => {
            const Icon = route.icon;
            const isActive = activeTab === route.id;

            return (
              <button
                key={route.id}
                onClick={() => {
                  setActiveTab(route.id);
                  setMoreMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition min-h-[48px] active:scale-95 ${
                  isActive ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.2px]' : 'stroke-[1.7px]'}`} />
                <span className="text-[10px] tracking-tight">{route.label}</span>
              </button>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition min-h-[48px] active:scale-95 ${
              isSecondaryActive || isMoreMenuOpen
                ? 'text-blue-400 font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5 stroke-[1.8px]" />
            <span className="text-[10px] tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Bottom Sheet Modal */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div
            className="absolute inset-0"
            onClick={() => setMoreMenuOpen(false)}
          />

          <div className="relative bg-gray-900 border-t border-gray-800 rounded-t-2xl p-5 shadow-2xl z-10 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <span className="font-bold text-sm text-gray-200 uppercase tracking-wider">
                All Empire Modules
              </span>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 py-4">
              {secondaryRoutes.map((route) => {
                const Icon = route.icon;
                const isActive = activeTab === route.id;

                return (
                  <button
                    key={route.id}
                    onClick={() => {
                      setActiveTab(route.id);
                      setMoreMenuOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition active:scale-95 min-h-[72px] ${
                      isActive
                        ? 'bg-blue-600/15 border-blue-500/50 text-blue-400'
                        : 'bg-gray-800/80 border-gray-700/60 text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-1.5" />
                    <span className="text-xs font-medium text-center">{route.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

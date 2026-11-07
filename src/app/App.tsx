import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { TopBar } from '../ui/layout/TopBar';
import { Sidebar } from '../ui/layout/Sidebar';
import { BottomTabs } from '../ui/layout/BottomTabs';
import { ToastContainer } from '../ui/components/ToastContainer';
import { FounderSetupModal } from '../ui/components/FounderSetupModal';

import { DashboardTab } from '../ui/tabs/DashboardTab';
import { CompanyTab } from '../ui/tabs/CompanyTab';
import { MarketTab } from '../ui/tabs/MarketTab';
import { PeopleTab } from '../ui/tabs/PeopleTab';
import { InstitutionsTab } from '../ui/tabs/InstitutionsTab';
import { StartupsTab } from '../ui/tabs/StartupsTab';
import { WifeTab } from '../ui/tabs/WifeTab';
import { NewsTab } from '../ui/tabs/NewsTab';
import { FinanceTab } from '../ui/tabs/FinanceTab';
import { SettingsTab } from '../ui/tabs/SettingsTab';

export const App: React.FC = () => {
  const { state, isReady, init, dispatch } = useGameStore();
  const { activeTab, autoPlay, autoPlaySpeed, isFounderSetupOpen, setFounderSetupOpen } = useUIStore();

  useEffect(() => {
    init();
  }, [init]);

  // Auto-play timer
  useEffect(() => {
    if (!autoPlay || !isReady) return;

    const intervalMs = Math.round(1200 / autoPlaySpeed);
    const timer = setInterval(() => {
      dispatch({ type: 'ADVANCE_DAY', count: 1 });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoPlay, autoPlaySpeed, isReady, dispatch]);

  if (!isReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950 text-gray-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-gray-300">
            Initializing Empire Ledger Engine
          </h2>
          <p className="text-xs text-gray-500">Loading seeded PRNG & persistence layer...</p>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'company':
        return <CompanyTab />;
      case 'market':
        return <MarketTab />;
      case 'people':
        return <PeopleTab />;
      case 'institutions':
        return <InstitutionsTab />;
      case 'startups':
        return <StartupsTab />;
      case 'wife':
        return <WifeTab />;
      case 'news':
        return <NewsTab />;
      case 'finance':
        return <FinanceTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 p-3.5 sm:p-6 max-w-7xl w-full mx-auto">
          {renderActiveTab()}
        </main>

        {/* Mobile Bottom Tabs */}
        <BottomTabs />
      </div>

      {/* Global Toast System */}
      <ToastContainer />

      {/* Founder Setup Onboarding & Profile Edit Modal */}
      <FounderSetupModal
        isOpen={!state.flags.gameSetupCompleted || isFounderSetupOpen}
        onClose={() => setFounderSetupOpen(false)}
      />
    </div>
  );
};

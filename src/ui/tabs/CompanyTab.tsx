import React from 'react';
import { Card } from '../components/Card';
import { StatTile } from '../components/StatTile';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../utils/format';
import { Building2 } from 'lucide-react';

export const CompanyTab: React.FC = () => {
  const { state } = useGameStore();
  const { numberFormat } = useUIStore();

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-400" />
          Mehta Enterprise (Your Company)
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Primary operating business · Roadmap: Full operations & departments in v0.2
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="Est. Valuation"
          value={formatMoney(state.player.netWorth * 0.7, numberFormat)}
          subValue="Unlisted (Pre-IPO)"
        />
        <StatTile
          label="Daily Revenue"
          value={formatMoney(450000, numberFormat)}
          subValue="Across 3 product lines"
        />
        <StatTile
          label="Workforce"
          value="48"
          subValue="Morale: 82% · Attrition: Low"
        />
        <StatTile
          label="Founder Stake"
          value="100%"
          subValue="Complete executive control"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Department Structure" subtitle="Operational Readiness (v0.2 Preview)">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 rounded bg-gray-950/60 border border-gray-800">
              <span className="font-semibold text-gray-200">Marketing & Sales</span>
              <span className="text-emerald-400 font-medium">Brings new projects</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-gray-950/60 border border-gray-800">
              <span className="font-semibold text-gray-200">Engineering & R&D</span>
              <span className="text-blue-400 font-medium">Product innovation</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-gray-950/60 border border-gray-800">
              <span className="font-semibold text-gray-200">Operations & Logistics</span>
              <span className="text-purple-400 font-medium">Delivery & capacity</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-gray-950/60 border border-gray-800">
              <span className="font-semibold text-gray-200">Human Resources</span>
              <span className="text-amber-400 font-medium">Hiring & team morale</span>
            </div>
          </div>
        </Card>

        <Card title="Active Projects Pipeline" subtitle="Client Deliverables">
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-gray-950/60 border border-gray-800">
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-gray-200">Fintech API Gateway</span>
                <span className="text-emerald-400 tabular-nums font-bold">₹1.8 Cr</span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '65%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>Deadline: 22 Days</span>
                <span>Progress: 65%</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-gray-950/60 border border-gray-800">
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-gray-200">Smart Supply Chain ERP</span>
                <span className="text-emerald-400 tabular-nums font-bold">₹2.4 Cr</span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '30%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>Deadline: 45 Days</span>
                <span>Progress: 30%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

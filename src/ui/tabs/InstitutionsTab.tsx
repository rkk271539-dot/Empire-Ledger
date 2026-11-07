import React from 'react';
import { Card } from '../components/Card';
import { StatTile } from '../components/StatTile';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../utils/format';
import { Landmark } from 'lucide-react';

export const InstitutionsTab: React.FC = () => {
  const { state } = useGameStore();
  const { numberFormat } = useUIStore();

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-blue-400" />
          Institutional Capital Flows (FII & DII)
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Foreign funds, domestic mutual funds, insurers & commercial banks · Roadmap: v0.45
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="Today's FII Flow"
          value={formatMoney(state.macro.fiiNetDaily, numberFormat)}
          subValue="Foreign Institutional Net"
          trend="up"
        />
        <StatTile
          label="Today's DII Flow"
          value={formatMoney(state.macro.diiNetDaily, numberFormat)}
          subValue="Domestic Institutional Net"
          trend="up"
        />
        <StatTile
          label="Global Risk Appetite"
          value={(state.macro.globalRiskAppetite * 100).toFixed(0)}
          subValue="Neutral (0 = Balanced)"
        />
        <StatTile
          label="Retail SIP Inflow"
          value={formatMoney(state.macro.retailSIPFlow, numberFormat)}
          subValue="Steady monthly support"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Foreign Institutional Investors (FII)" subtitle="Global Macro Driven">
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            FIIs manage tens of thousands of crores and trade in massive blocks. They react to US rates, dollar index, and corporate governance.
          </p>
          <div className="p-3 rounded bg-gray-950/60 border border-gray-800 text-xs">
            <span className="font-semibold text-gray-200">Current Regime:</span>{' '}
            <span className="text-emerald-400">Risk-On Accumulation</span>
          </div>
        </Card>

        <Card title="Domestic Institutional Investors (DII)" subtitle="Market Stabilisers">
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            Powered by retail SIP money, DIIs absorb foreign selling pressure and seek sustainable long-term dividend yields.
          </p>
          <div className="p-3 rounded bg-gray-950/60 border border-gray-800 text-xs">
            <span className="font-semibold text-gray-200">Current Regime:</span>{' '}
            <span className="text-blue-400">Steady Value Buying</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

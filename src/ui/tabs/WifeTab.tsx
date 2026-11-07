import React from 'react';
import { Card } from '../components/Card';
import { StatTile } from '../components/StatTile';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../utils/format';
import { HeartHandshake } from 'lucide-react';

export const WifeTab: React.FC = () => {
  const { state } = useGameStore();
  const { numberFormat } = useUIStore();
  const wife = state.people['wife'];
  const rel = state.relationships['player:wife'];

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center overflow-hidden shrink-0">
          {wife?.avatarUrl ? (
            <img src={wife.avatarUrl} alt={wife.name} className="w-full h-full object-cover" />
          ) : (
            <HeartHandshake className="w-6 h-6 text-emerald-400" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            {wife?.name ?? 'Ananya Mehta'} (Wife & Partner)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Independent AI investor, portfolio manager, and advisor · Roadmap: Full life & trust in v0.6
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="Net Worth"
          value={formatMoney(wife?.netWorth ?? 60000000, numberFormat)}
          subValue="Independent wealth"
        />
        <StatTile
          label="Cash Reserves"
          value={formatMoney(wife?.cash ?? 25000000, numberFormat)}
          subValue="Available liquidity"
        />
        <StatTile
          label="Trust Level"
          value={`${rel?.trust ?? 85}%`}
          subValue="Beta distribution model"
          trend="up"
        />
        <StatTile
          label="Emotional Bond"
          value={`${rel?.bond ?? 82}%`}
          subValue="Quality time required"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Relationship Dynamics" subtitle="Trust & Social Graph (Section 18A.6)">
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>Trust in You</span>
                <span className="font-semibold text-emerald-400">{rel?.trust ?? 85}%</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${rel?.trust ?? 85}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>Respect for Capability</span>
                <span className="font-semibold text-blue-400">{rel?.respect ?? 80}%</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${rel?.respect ?? 80}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>Vulnerability to Rival Wooing</span>
                <span className="font-semibold text-amber-400">Low (15%)</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Recent Decisions & Diary" subtitle="Autonomous NPC Actions">
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-gray-950/60 border border-gray-800">
              <span className="text-gray-200 font-semibold">Reviewed Healthcare Equities</span>
              <p className="text-gray-400 mt-0.5">
                "Sunrise Pharma's cash flows look resilient ahead of the upcoming reporting cycle."
              </p>
            </div>
            <div className="p-2.5 rounded bg-gray-950/60 border border-gray-800">
              <span className="text-gray-200 font-semibold">Declined Rival's Advisory Approach</span>
              <p className="text-gray-400 mt-0.5">
                "Vikram Singhania sent feelers regarding a joint syndicate. I declined out of loyalty."
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

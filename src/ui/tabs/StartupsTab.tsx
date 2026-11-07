import React from 'react';
import { Card } from '../components/Card';
import { StatTile } from '../components/StatTile';
import { Rocket } from 'lucide-react';

export const StartupsTab: React.FC = () => {
  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-blue-400" />
          Venture Ecosystem & Startups
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          High-risk private companies: Seed, Series A-C, acquisitions & IPOs · Roadmap: v0.45
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Ecosystem Total" value="40+" subValue="Active Startups" />
        <StatTile label="Player Angel Bets" value="0" subValue="₹0 Capital Deployed" />
        <StatTile label="Pre-IPO Pipeline" value="4" subValue="Expected in 12-24m" />
        <StatTile label="Failure Rate" value="60%" subValue="Historical Average" />
      </div>

      <Card title="Venture Board" subtitle="Ecosystem Preview">
        <div className="space-y-3">
          <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs sm:text-sm text-gray-100">Zenith AI Labs</div>
              <div className="text-[11px] text-gray-400">Sector: Tech · Stage: Series A · Burn: ₹35L/mo</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400">₹24 Cr Val</span>
              <div className="text-[10px] text-gray-500">Runway: 11 mos</div>
            </div>
          </div>

          <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs sm:text-sm text-gray-100">Volt Mobility</div>
              <div className="text-[11px] text-gray-400">Sector: CleanTech · Stage: Seed · Burn: ₹18L/mo</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400">₹12 Cr Val</span>
              <div className="text-[10px] text-gray-500">Runway: 6 mos</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

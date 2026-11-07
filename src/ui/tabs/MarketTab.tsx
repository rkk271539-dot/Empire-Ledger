import React from 'react';
import { Card } from '../components/Card';
import { StatTile } from '../components/StatTile';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../utils/format';
import { TrendingUp } from 'lucide-react';
import sectorsConfig from '../../data/config/sectors.json';

export const MarketTab: React.FC = () => {
  const { state } = useGameStore();
  const { numberFormat } = useUIStore();

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Stock Market & Listings
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          24 Listed Companies across 8 Sectors · Roadmap: Full trading desk in v0.3
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="BSE Index"
          value={state.market.indexLevel.toLocaleString()}
          change={state.market.dailyReturn}
          subValue="Day 1 Baseline"
        />
        <StatTile
          label="Market Mood"
          value={(state.macro.marketMood * 100).toFixed(0)}
          subValue="Range: -100 to +100"
        />
        <StatTile
          label="Portfolio Value"
          value={formatMoney(0, numberFormat)}
          subValue="No shares held yet"
        />
        <StatTile
          label="Daily Dividends"
          value={formatMoney(0, numberFormat)}
          subValue="Accrues daily"
        />
      </div>

      {/* Sector Breakdown */}
      <Card title="Tracked Sectors" subtitle="Economic Segments">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sectorsConfig.map((sec) => (
            <div
              key={sec.id}
              className="p-3 rounded-lg bg-gray-950/60 border border-gray-800 hover:border-gray-700 transition"
            >
              <div className="font-semibold text-xs text-gray-200">{sec.name}</div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 mt-2">
                <span>Volatility: {sec.volatility}x</span>
                <span>Beta: {sec.beta}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Order Matching Engine" subtitle="Liquidity-Based Price Impact">
        <p className="text-xs text-gray-400 leading-relaxed">
          The stock market simulation uses the Section 18A.4 Heston-style stochastic volatility model with square-root order-flow price impact and fat-tailed news jumps. Companies will begin active daily quotes in v0.3.
        </p>
      </Card>
    </div>
  );
};

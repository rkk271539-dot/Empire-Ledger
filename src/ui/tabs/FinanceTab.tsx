import React from 'react';
import { Card } from '../components/Card';
import { StatTile } from '../components/StatTile';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../utils/format';
import { Wallet } from 'lucide-react';

export const FinanceTab: React.FC = () => {
  const { numberFormat } = useUIStore();

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-400" />
          Banking, Treasury & Capital Raising
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Loans, fixed deposits, IPO issuance & credit ratings · Roadmap: v0.8
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="Credit Rating"
          value="AAA"
          subValue="Prime tier credit"
          trend="up"
        />
        <StatTile
          label="Active Loans"
          value={formatMoney(0, numberFormat)}
          subValue="Zero debt liability"
        />
        <StatTile
          label="FD Deposits"
          value={formatMoney(0, numberFormat)}
          subValue="6% yield / 100 days"
        />
        <StatTile
          label="IPO Readiness"
          value="65%"
          subValue="Eligible post 180 days"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Commercial Bank Lending" subtitle="Working Capital & Term Credit">
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            Banks evaluate your credit score, net worth, and historical profits to issue loans (12% per 100 days).
          </p>
          <div className="p-3 bg-gray-950/60 rounded border border-gray-800 text-xs">
            <span className="text-gray-400">Available Credit Line:</span>{' '}
            <span className="font-bold text-emerald-400">₹2.50 Cr</span>
          </div>
        </Card>

        <Card title="Treasury & Fixed Deposits" subtitle="Guaranteed Returns">
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            Park excess liquid cash in secure bank deposits earning 6% risk-free yield over 100-day tranches.
          </p>
          <div className="p-3 bg-gray-950/60 rounded border border-gray-800 text-xs">
            <span className="text-gray-400">Current Yield:</span>{' '}
            <span className="font-bold text-blue-400">6.0% p.a.</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatTileProps {
  label: string;
  value: string;
  subValue?: string;
  change?: number; // e.g., 0.05 for +5%
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  subValue,
  change,
  trend,
  icon,
}) => {
  const isPositive = trend ? trend === 'up' : change !== undefined ? change >= 0 : null;

  return (
    <div className="bg-gray-900 border border-gray-800/90 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between text-gray-400 text-xs mb-1.5 font-medium">
        <span>{label}</span>
        {icon && <span className="text-gray-500">{icon}</span>}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-100 tabular-nums">
          {value}
        </span>

        {change !== undefined && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
              isPositive
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-rose-400 bg-rose-500/10'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5 inline" />
            )}
            {Math.abs(change * 100).toFixed(1)}%
          </span>
        )}
      </div>

      {subValue && (
        <span className="text-[11px] text-gray-400 mt-1 truncate">{subValue}</span>
      )}
    </div>
  );
};

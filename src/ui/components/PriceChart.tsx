import React from 'react';

interface PriceChartProps {
  data: number[];
  height?: number;
  showLabels?: boolean;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  data,
  height = 160,
  showLabels = true,
}) => {
  if (!data || data.length < 2) {
    return (
      <div
        className="w-full flex items-center justify-center text-xs text-gray-500 bg-gray-900/50 rounded-lg border border-gray-800"
        style={{ height }}
      >
        Insufficient price history
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 1e-4);
  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = isUp ? '#10b981' : '#f43f5e';
  const fillColor = isUp ? 'url(#greenGradient)' : 'url(#redGradient)';

  const width = 500;
  const paddingX = 10;
  const paddingY = 16;
  const chartHeight = height - paddingY * 2;
  const chartWidth = width - paddingX * 2;

  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * chartWidth;
    const y = paddingY + (1 - (val - min) / range) * chartHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${points[0]} L ${points.join(' L ')} L ${paddingX + chartWidth},${height} L ${paddingX},${height} Z`;

  return (
    <div className="w-full relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Subtle reference gridlines */}
        <line
          x1={paddingX}
          y1={paddingY}
          x2={width - paddingX}
          y2={paddingY}
          stroke="#374151"
          strokeDasharray="3 3"
          strokeOpacity="0.4"
        />
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="#374151"
          strokeDasharray="3 3"
          strokeOpacity="0.4"
        />

        {/* Gradient Area */}
        <path d={areaD} fill={fillColor} />

        {/* Price Line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current Price Dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="4"
            fill={strokeColor}
            className="animate-pulse"
          />
        )}
      </svg>

      {showLabels && (
        <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1 font-mono">
          <span>Min: ₹{min.toFixed(1)}</span>
          <span className={isUp ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            Now: ₹{data[data.length - 1].toFixed(1)} ({(((data[data.length - 1] - data[0]) / data[0]) * 100).toFixed(1)}%)
          </span>
          <span>Max: ₹{max.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
};

export const Sparkline: React.FC<{ data: number[]; width?: number; height?: number }> = ({
  data,
  width = 72,
  height = 24,
}) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 1e-4);
  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = isUp ? '#10b981' : '#f43f5e';

  const pts = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = (1 - (val - min) / range) * (height - 4) + 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <path
        d={`M ${pts.join(' L ')}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

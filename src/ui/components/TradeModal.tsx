import React, { useState, useEffect } from 'react';
import { Company } from '../../engine/core/types';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../utils/format';
import { PriceChart } from './PriceChart';
import { X, TrendingUp, TrendingDown, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import balanceConfig from '../../data/config/balance.json';

interface TradeModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({ company, isOpen, onClose }) => {
  const { state, dispatch } = useGameStore();
  const { numberFormat } = useUIStore();

  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [shares, setShares] = useState<number>(100);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when company changes
  useEffect(() => {
    if (company) {
      setShares(100);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [company]);

  if (!isOpen || !company) return null;

  const currentPrice = company.price;
  const p = company.stockParams;
  const sigma = p ? Math.sqrt(Math.max(company.stockState?.v ?? p.thetaV, 1e-8)) : 0.018;
  const adv = p ? Math.max(p.adv, 1) : 1000000;
  const feeRate = balanceConfig.tradingFeeRate || 0.001;

  const ownedHolding = state.player.holdings.find(h => h.companyId === company.id);
  const ownedShares = ownedHolding?.shares || 0;

  // Max affordable shares (approximated)
  const maxAffordable = Math.max(0, Math.floor(state.player.cash / (currentPrice * (1 + feeRate))));

  // Calculate live price impact
  const qty = Math.max(1, shares);
  const impact = p ? p.impactY * sigma * Math.sqrt(qty / adv) : 0;
  const executionPrice =
    mode === 'buy'
      ? Math.round(currentPrice * Math.exp(0.5 * impact) * 100) / 100
      : Math.max(1, Math.round(currentPrice * Math.exp(-0.5 * impact) * 100) / 100);

  const grossTotal = Math.round(qty * executionPrice);
  const fee = Math.max(1, Math.round(grossTotal * feeRate));
  const netTotal = mode === 'buy' ? grossTotal + fee : Math.max(0, grossTotal - fee);

  const canExecute =
    mode === 'buy'
      ? qty > 0 && state.player.cash >= netTotal
      : qty > 0 && ownedShares >= qty;

  const handleExecuteTrade = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'buy') {
      if (qty <= 0) {
        setErrorMsg('Please specify a positive number of shares.');
        return;
      }
      if (state.player.cash < netTotal) {
        setErrorMsg('Insufficient cash balance to execute this trade.');
        return;
      }

      dispatch({
        type: 'BUY_SHARES',
        companyId: company.id,
        shares: qty,
      });

      setSuccessMsg(`Successfully purchased ${qty.toLocaleString()} shares of ${company.symbol || company.name}!`);
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } else {
      if (qty <= 0) {
        setErrorMsg('Please specify a positive number of shares.');
        return;
      }
      if (ownedShares < qty) {
        setErrorMsg(`You only own ${ownedShares.toLocaleString()} shares.`);
        return;
      }

      dispatch({
        type: 'SELL_SHARES',
        companyId: company.id,
        shares: qty,
      });

      setSuccessMsg(`Successfully sold ${qty.toLocaleString()} shares of ${company.symbol || company.name}!`);
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    }
  };

  const handleQuickAdd = (delta: number) => {
    setShares(prev => Math.max(1, prev + delta));
  };

  const handleSetMax = () => {
    if (mode === 'buy') {
      setShares(maxAffordable > 0 ? maxAffordable : 1);
    } else {
      setShares(ownedShares > 0 ? ownedShares : 1);
    }
  };

  const priceHistory = company.priceHistory ?? [currentPrice];
  const dayChange = priceHistory.length >= 2 ? currentPrice - priceHistory[priceHistory.length - 2] : 0;
  const dayChangePercent = priceHistory.length >= 2 ? (dayChange / priceHistory[priceHistory.length - 2]) * 100 : 0;
  const isUp = dayChange >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900/30 border border-blue-500/30 flex items-center justify-center font-bold text-sm text-blue-400">
              {company.symbol || company.name.substring(0, 4).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-100">{company.name}</h3>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                  {company.sector}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-semibold text-gray-200">₹{currentPrice.toFixed(2)}</span>
                <span className={`text-xs font-semibold flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />}
                  {isUp ? '+' : ''}{dayChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Price Chart */}
          <div className="bg-gray-950/60 p-3.5 rounded-xl border border-gray-800/80">
            <div className="text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              30-Day Price Movement
            </div>
            <PriceChart data={priceHistory} height={140} showLabels={true} />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-gray-950/40 p-2.5 rounded-lg border border-gray-800/60">
              <span className="text-gray-400 block text-[10px]">Market Cap</span>
              <span className="font-semibold text-gray-200 font-mono">
                {formatMoney(currentPrice * company.sharesOutstanding, numberFormat)}
              </span>
            </div>
            <div className="bg-gray-950/40 p-2.5 rounded-lg border border-gray-800/60">
              <span className="text-gray-400 block text-[10px]">P/E Ratio</span>
              <span className="font-semibold text-gray-200 font-mono">
                {company.financials.peRatio ? `${company.financials.peRatio.toFixed(1)}x` : 'N/A'}
              </span>
            </div>
            <div className="bg-gray-950/40 p-2.5 rounded-lg border border-gray-800/60">
              <span className="text-gray-400 block text-[10px]">Dividend Yield</span>
              <span className="font-semibold text-gray-200 font-mono">
                {company.financials.dividendYield ? `${(company.financials.dividendYield * 100).toFixed(1)}%` : '0.0%'}
              </span>
            </div>
            <div className="bg-gray-950/40 p-2.5 rounded-lg border border-gray-800/60">
              <span className="text-gray-400 block text-[10px]">Your Holdings</span>
              <span className="font-semibold text-gray-200 font-mono">
                {ownedShares.toLocaleString()} shares
              </span>
            </div>
          </div>

          {/* Buy / Sell Tabs */}
          <div className="flex rounded-xl bg-gray-950 p-1 border border-gray-800">
            <button
              onClick={() => { setMode('buy'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                mode === 'buy'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Buy Shares
            </button>
            <button
              onClick={() => { setMode('sell'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                mode === 'sell'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sell Shares
            </button>
          </div>

          {/* Quantity Controls */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Order Quantity (Shares)</span>
              <span className="text-gray-400">
                {mode === 'buy'
                  ? `Available Cash: ${formatMoney(state.player.cash, numberFormat)}`
                  : `Owned: ${ownedShares.toLocaleString()} shares`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={shares || ''}
                onChange={e => setShares(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-gray-100 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleSetMax}
                className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition"
              >
                Max
              </button>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-1.5 pt-1">
              {[10, 50, 100, 500, 1000].map(inc => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleQuickAdd(inc)}
                  className="flex-1 py-1.5 bg-gray-950/80 hover:bg-gray-800 border border-gray-800/80 rounded-lg text-xs font-medium text-gray-300 transition"
                >
                  +{inc}
                </button>
              ))}
            </div>
          </div>

          {/* Trade Execution Breakdown */}
          <div className="p-3.5 rounded-xl bg-gray-950/60 border border-gray-800 space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Execution Price (with slippage)</span>
              <span className="font-mono text-gray-200 font-semibold">₹{executionPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Price Impact (Section 18A.4)</span>
              <span className={`font-mono font-semibold ${impact > 0.005 ? (mode === 'buy' ? 'text-amber-400' : 'text-rose-400') : 'text-gray-300'}`}>
                {mode === 'buy' ? '+' : '-'}{(impact * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>STT & Brokerage Fee (0.1%)</span>
              <span className="font-mono text-gray-200">₹{fee.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-800/80 pt-2 flex justify-between items-center text-sm font-bold text-gray-100">
              <span>{mode === 'buy' ? 'Total Cost' : 'Net Proceeds'}</span>
              <span className={`font-mono text-base ${mode === 'buy' ? 'text-emerald-400' : 'text-blue-400'}`}>
                {formatMoney(netTotal, numberFormat)}
              </span>
            </div>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            disabled={!canExecute}
            onClick={handleExecuteTrade}
            className={`w-full py-3.5 rounded-xl text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 ${
              canExecute
                ? mode === 'buy'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {mode === 'buy'
              ? `Confirm Buy ${qty.toLocaleString()} Shares (${formatMoney(netTotal, numberFormat)})`
              : `Confirm Sell ${qty.toLocaleString()} Shares (${formatMoney(netTotal, numberFormat)})`}
          </button>
        </div>
      </div>
    </div>
  );
};

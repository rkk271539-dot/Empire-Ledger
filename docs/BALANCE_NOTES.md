# Balance Notes

This document tracks balancing parameters, target metrics, and balance test results.

---

## Target Metrics (v1.0 Goals)
- **Win Rate (Normal)**: 40% - 60%
- **Average Game Length**: 600 - 1200 days
- **Stock Volatility (daily)**: 1.2% - 2.5% typical, fat-tailed with kurtosis 4 - 15
- **Regime Persistence**: Stressed regimes cluster and last 2 - 8 weeks
- **M&A Value Destruction**: 40% - 60% of acquisitions destroy acquirer value over 24 months

## v0.1 Baseline Values
- Starting Player Cash: ₹5,00,00,000 (5 Crore)
- Starting Player Net Worth: ₹10,00,00,000 (10 Crore)
- Starting Rival Cash: ₹5,00,00,000 (5 Crore)
- Starting Wife Cash: ₹2,50,00,000 (2.5 Crore)
- Default Calendar Start: 1 January 2026
- Announcement Cycle: Every 60 days

## v0.3 Market & Valuation Balance Parameters
- **Stock Daily Volatility**: Baseline 1.8% daily, scaling by regime multipliers ($0.75\times$ Calm, $1.0\times$ Normal, $2.2\times$ Stressed).
- **Trading Transaction Fee (`tradingFeeRate`)**: 0.1% (brokerage + Securities Transaction Tax).
- **Daily Circuit Limits**: $\pm 10\%$ max daily log return clamp on listed stocks ($\ln 0.9$ to $\ln 1.1$).
- **Valuation Circuit Clamp**: $\pm 6\%$ max daily move on private enterprise valuation.
- **Valuation Smoothing**: Trailing 30-day average EBITDA and revenue run-rate with 90%/10% EMA.
- **Empire 24 Baseline Index**: 24,500 points.

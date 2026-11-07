import { ProductLine } from '../core/types';
import { Rng } from '../dynamics/rng';

export function createDefaultProducts(day = 1): ProductLine[] {
  return [
    {
      id: 'prod_1',
      name: 'CloudScale Enterprise SaaS',
      dailyRevenue: 320000, // ₹3.2 L / day
      dailyCost: 110000,    // ₹1.1 L / day
      quality: 0.85,
      attractiveness: 0.8,
      launchDay: day,
    },
    {
      id: 'prod_2',
      name: 'OmniSecure Identity Guard',
      dailyRevenue: 180000, // ₹1.8 L / day
      dailyCost: 65000,     // ₹0.65 L / day
      quality: 0.8,
      attractiveness: 0.75,
      launchDay: day,
    },
  ];
}

export function stepProduct(
  product: ProductLine,
  rdLevel: number,
  brandingLevel: number,
  rng: Rng
): ProductLine {
  // Drift quality based on R&D
  const qualityTarget = Math.min(1.0, product.quality + 0.0005 * rdLevel);
  const quality = Math.max(0.1, qualityTarget + rng.normal() * 0.002);

  // Growth shock clamped to +/- 10% monthly equivalent (~0.3% daily)
  const growthRate = (0.0002 + 0.0003 * brandingLevel + (quality - 0.5) * 0.0005) + rng.studentT(5) * 0.002;
  const clampedDailyRate = Math.max(-0.005, Math.min(0.005, growthRate));

  const dailyRevenue = Math.round(Math.max(10000, product.dailyRevenue * (1 + clampedDailyRate)));
  const dailyCost = Math.round(product.dailyCost * (1 + clampedDailyRate * 0.5));

  return {
    ...product,
    quality,
    dailyRevenue,
    dailyCost,
  };
}

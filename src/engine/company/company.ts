import { Company, Money } from '../core/types';
import { GameEvent } from '../core/events';
import { Rng } from '../dynamics/rng';
import { createDefaultDepartments } from './departments';
import { createDefaultEmployees } from './employees';
import { createDefaultProjects, generateClientProject } from './projects';
import { createDefaultProducts, stepProduct } from './products';
import { createDefaultFinancialStatements, updateFinancialStatements, computeCompanyValuation } from './financials';

export function createInitialCompany(
  id: string,
  name: string,
  sector: string,
  ownerId: string,
  initialCash: Money
): Company {
  const departments = createDefaultDepartments();
  const employeesList = createDefaultEmployees();
  const projects = createDefaultProjects();
  const products = createDefaultProducts();
  const financialStatements = createDefaultFinancialStatements(initialCash);

  const initialEbitdaDaily = 149000;
  const valuation = computeCompanyValuation(initialEbitdaDaily * 365, 500000 * 365, initialCash, 0);

  return {
    id,
    name,
    sector,
    ownerId,
    listed: false,
    sharesOutstanding: 10000000,
    price: Math.max(1, Math.round(valuation / 10000000)),
    priceHistory: [Math.max(1, Math.round(valuation / 10000000))],
    financials: {
      revenueDaily: 500000,
      costsDaily: 351000,
      profitDaily: 149000,
      cash: initialCash,
      debt: 0,
      employees: employeesList.length,
    },
    departments,
    employeesList,
    projects,
    products,
    strategy: {
      brandingSpendDaily: 25000,
      rdSpendDaily: 35000,
      expansionMode: 'balanced',
      costCuttingActive: false,
      dividendPayoutRatio: 0.15,
    },
    financialStatements,
    quality: {
      management: 0.8,
      growth: 0.15,
      moat: 0.7,
      risk: 0.25,
    },
    dividendPolicy: 0.15,
  };
}

export function stepCompanyDaily(
  company: Company,
  day: number,
  rng: Rng
): {
  company: Company;
  events: GameEvent[];
  cashDelta: Money;
  charmDelta: number;
  reputationDelta: number;
} {
  const events: GameEvent[] = [];
  let charmDelta = 0;
  let reputationDelta = 0;

  const departments = { ...company.departments } as typeof company.departments;
  const employeesList = [...(company.employeesList || [])];
  let projects = [...(company.projects || [])];
  let products = [...(company.products || [])];
  const strategy = company.strategy || {
    brandingSpendDaily: 25000,
    rdSpendDaily: 35000,
    expansionMode: 'balanced',
    costCuttingActive: false,
    dividendPayoutRatio: 0.15,
  };

  // 1. Calculate Workforce Capacity from Employees
  const opsStaff = employeesList.filter((e) => e.department === 'operations' || e.department === 'rd');
  const totalWorkforceCapacity = opsStaff.reduce(
    (acc, emp) => acc + emp.skill * emp.productivity * (0.6 + 0.4 * emp.morale),
    0
  );

  const opsEfficiency = departments?.operations?.efficiency || 1.0;
  const dailyWorkUnits = Math.round(totalWorkforceCapacity * opsEfficiency * (0.9 + rng.next() * 0.2));

  // 2. Progress Active Projects
  const activeProjects = projects.filter((p) => p.status === 'active');
  let projectPayoutsCollected = 0;

  if (activeProjects.length > 0) {
    const unitsPerProject = Math.max(1, Math.floor(dailyWorkUnits / activeProjects.length));

    projects = projects.map((p) => {
      if (p.status !== 'active') return p;

      const newWork = p.workCompleted + unitsPerProject;
      if (newWork >= p.size) {
        // Project Completed!
        const defaulted = rng.next() < p.clientDefaultRisk;
        if (defaulted) {
          events.push({
            id: `ev_proj_def_${p.id}`,
            day,
            type: 'PROJECT_DISPUTE',
            title: `Client Payment Dispute: ${p.clientName}`,
            message: `${p.clientName} defaulted on final payment for ${p.name}. Received 40% settlement.`,
            importance: 2,
          });
          projectPayoutsCollected += Math.round(p.payout * 0.4);
          reputationDelta -= 1;
        } else {
          events.push({
            id: `ev_proj_comp_${p.id}`,
            day,
            type: 'PROJECT_DELIVERED',
            title: `Project Delivered: ${p.name}`,
            message: `Successfully delivered to ${p.clientName}. Received full payout of ₹${(p.payout / 10000000).toFixed(2)} Cr!`,
            importance: 2,
          });
          projectPayoutsCollected += p.payout;
          reputationDelta += 2;
          charmDelta += 1;
        }

        return { ...p, workCompleted: p.size, status: 'delivered' };
      }

      // Check deadline penalty if overdue
      if (day > p.deadlineDay && day % 7 === 0) {
        events.push({
          id: `ev_proj_overdue_${p.id}_${day}`,
          day,
          type: 'PROJECT_OVERDUE',
          title: `Deadline Exceeded: ${p.name}`,
          message: `${p.clientName} has flagged project delay. Penalties may apply.`,
          importance: 2,
        });
      }

      return { ...p, workCompleted: newWork };
    });
  }

  // 3. Marketing Proposals Generation
  const availableProjectsCount = projects.filter((p) => p.status === 'available').length;
  const mktLevel = departments?.marketing?.level || 1;
  const shouldSpawnProject = availableProjectsCount < 4 && (day % 6 === 0 || rng.next() < 0.25);

  if (shouldSpawnProject) {
    const newProposal = generateClientProject(day, mktLevel, rng);
    projects.push(newProposal);
    events.push({
      id: `ev_new_proj_${newProposal.id}`,
      day,
      type: 'PROJECT_PROPOSAL',
      title: `New Project Proposal: ${newProposal.name}`,
      message: `${newProposal.clientName} is offering ₹${(newProposal.payout / 10000000).toFixed(2)} Cr contract.`,
      importance: 1,
    });
  }

  // 4. Products Progression
  const rdLevel = departments?.rd?.level || 1;
  const brandingLevel = Math.min(5, Math.floor(strategy.brandingSpendDaily / 20000));

  products = products.map((prod) => stepProduct(prod, rdLevel, brandingLevel, rng));
  const productRevenueTotal = products.reduce((acc, p) => acc + p.dailyRevenue, 0);
  const productCostTotal = products.reduce((acc, p) => acc + p.dailyCost, 0);

  // 5. Operating Costs Breakdown
  const costCutMultiplier = strategy.costCuttingActive ? 0.8 : 1.0;

  const payrollDaily = employeesList.reduce((acc, emp) => acc + emp.salaryDaily, 0);
  const deptBudgetsDaily = Object.values(departments || {}).reduce(
    (acc, d) => acc + (d?.budgetDaily || 0),
    0
  ) * costCutMultiplier;

  const marketingSpendDaily = (departments?.marketing?.budgetDaily || 25000) + strategy.brandingSpendDaily;
  const rdSpendDaily = (departments?.rd?.budgetDaily || 40000) + strategy.rdSpendDaily;
  const overheadDaily = Math.round(50000 * costCutMultiplier);

  // Branding Charm Boost
  if (strategy.brandingSpendDaily > 0) {
    charmDelta += (strategy.brandingSpendDaily / 500000);
  }

  // 6. Net Financials for the Day
  const totalRevenue = productRevenueTotal + projectPayoutsCollected;
  const totalCogs = productCostTotal;
  const totalOpex = payrollDaily + deptBudgetsDaily + strategy.brandingSpendDaily + strategy.rdSpendDaily + overheadDaily;
  const ebitda = totalRevenue - totalCogs - totalOpex;
  const netIncome = Math.round(ebitda * 0.82); // after 18% tax / depreciation

  const currentCash = company.financials.cash + netIncome;

  const financialRecord = {
    day,
    revenue: totalRevenue,
    cogs: totalCogs,
    payroll: payrollDaily,
    rd: rdSpendDaily,
    marketing: marketingSpendDaily,
    overhead: overheadDaily,
    ebitda,
    netIncome,
    cashBalance: currentCash,
  };

  const updatedStatements = company.financialStatements
    ? updateFinancialStatements(company.financialStatements, financialRecord)
    : createDefaultFinancialStatements(currentCash);

  // Valuation Calculation:
  // Use normalized sustainable 30-day run-rate rather than multiplying a single day's
  // lump-sum milestone payout by 365 (which caused the 7,000 Cr spike bug).
  const history = updatedStatements.history30d;
  const count = Math.max(1, history.length);
  const avgDailyRevenue30d = history.reduce((acc, r) => acc + r.revenue, 0) / count;
  const avgDailyEbitda30d = history.reduce((acc, r) => acc + r.ebitda, 0) / count;

  const normalizedAnnualRevenue = avgDailyRevenue30d * 365;
  const normalizedAnnualEbitda = avgDailyEbitda30d * 365;

  const targetValuation = computeCompanyValuation(
    normalizedAnnualEbitda,
    normalizedAnnualRevenue,
    currentCash,
    company.financials.debt
  );

  // Exponential smoothing (EMA) and daily circuit clamp (max +/- 6% valuation move per day)
  const prevValuation = (company.price || 7) * company.sharesOutstanding;
  const smoothedValuation = Math.round(prevValuation * 0.90 + targetValuation * 0.10);
  const clampedValuation = Math.round(
    Math.min(prevValuation * 1.06, Math.max(prevValuation * 0.94, smoothedValuation))
  );

  const newPrice = Math.max(1, Math.round(clampedValuation / company.sharesOutstanding));
  const priceHistory = [...company.priceHistory, newPrice];
  if (priceHistory.length > 400) priceHistory.shift();

  const updatedCompany: Company = {
    ...company,
    price: newPrice,
    priceHistory,
    financials: {
      revenueDaily: totalRevenue,
      costsDaily: totalCogs + totalOpex,
      profitDaily: ebitda,
      cash: currentCash,
      debt: company.financials.debt,
      employees: employeesList.length,
    },
    departments,
    employeesList,
    projects,
    products,
    strategy,
    financialStatements: updatedStatements,
  };

  return {
    company: updatedCompany,
    events,
    cashDelta: netIncome,
    charmDelta,
    reputationDelta,
  };
}

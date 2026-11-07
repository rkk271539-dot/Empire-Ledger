import React, { useState } from 'react';
import { Card } from '../components/Card';
import { StatTile } from '../components/StatTile';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../utils/format';
import {
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  Zap,
  PackageCheck,
} from 'lucide-react';
import { DepartmentId, Department } from '../../engine';

export const CompanyTab: React.FC = () => {
  const { state, dispatch } = useGameStore();
  const { numberFormat, showToast } = useUIStore();

  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'departments' | 'employees' | 'projects' | 'products' | 'strategy'
  >('overview');

  // Hire employee modal state
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [hireDepartment, setHireDepartment] = useState<DepartmentId>('rd');
  const [hireRole, setHireRole] = useState('Senior Engineer');

  // Launch product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');

  const company = state.companies['company_player'];
  if (!company) {
    return (
      <div className="p-6 text-center text-gray-400">
        Company not found. Please initialize game.
      </div>
    );
  }

  const pl = company.financialStatements?.pl || {
    revenue: company.financials.revenueDaily,
    cogs: 175000,
    payroll: 66000,
    rd: 40000,
    marketing: 25000,
    overhead: 45000,
    ebitda: company.financials.profitDaily,
    netIncome: company.financials.profitDaily * 0.82,
  };

  const balanceSheet = company.financialStatements?.balanceSheet || {
    cash: company.financials.cash,
    accountsReceivable: 12500000,
    equipmentValuation: 35000000,
    totalAssets: company.financials.cash + 47500000,
    debt: 0,
    retainedEarnings: 15000000,
    totalEquity: company.financials.cash + 47500000,
  };

  const valuation = company.price * company.sharesOutstanding;
  const employees = company.employeesList || [];
  const projects = company.projects || [];
  const products = company.products || [];
  const departments = company.departments || {};
  const strategy = company.strategy || {
    brandingSpendDaily: 25000,
    rdSpendDaily: 35000,
    expansionMode: 'balanced',
    costCuttingActive: false,
    dividendPayoutRatio: 0.15,
  };

  const handleHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'HIRE_EMPLOYEE',
      department: hireDepartment,
      role: hireRole,
    });
    setIsHireModalOpen(false);
    showToast(`Hired new ${hireRole}!`, 'success');
  };

  const handleFire = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to terminate ${name}? Severance payout will apply.`)) {
      dispatch({ type: 'FIRE_EMPLOYEE', employeeId: id });
      showToast(`${name} departed.`, 'info');
    }
  };

  const handleTrain = (id: string) => {
    dispatch({ type: 'TRAIN_EMPLOYEE', employeeId: id });
  };

  const handlePromote = (id: string) => {
    dispatch({ type: 'PROMOTE_EMPLOYEE', employeeId: id });
  };

  const handleAcceptProject = (id: string) => {
    dispatch({ type: 'ACCEPT_PROJECT', projectId: id });
    showToast('Project contract signed and activated!', 'success');
  };

  const handleCancelProject = (id: string) => {
    if (window.confirm('Cancel this project? Client penalty will apply.')) {
      dispatch({ type: 'CANCEL_PROJECT', projectId: id });
      showToast('Project cancelled.', 'warning');
    }
  };

  const handleLaunchProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    dispatch({
      type: 'LAUNCH_PRODUCT',
      name: newProductName.trim(),
    });
    setNewProductName('');
    setIsProductModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Company Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-950/40 via-gray-900 to-gray-950 p-4 rounded-xl border border-blue-900/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              {company.name}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
              {company.sector}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Unlisted Private Enterprise · 100% Founder Controlled · Mumbai HQ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHireModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Hire Staff</span>
          </button>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-gray-800">
        {[
          { id: 'overview', label: 'Overview & P&L', icon: TrendingUp },
          { id: 'departments', label: 'Departments', icon: Briefcase },
          { id: 'employees', label: `Workforce (${employees.length})`, icon: Users },
          { id: 'projects', label: `Projects (${projects.filter((p) => p.status === 'active').length} Active)`, icon: PackageCheck },
          { id: 'products', label: `Products (${products.length})`, icon: Zap },
          { id: 'strategy', label: 'Strategy & Levers', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition min-h-[38px] ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: Overview & Financials */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile
              label="Enterprise Valuation"
              value={formatMoney(valuation, numberFormat)}
              subValue="Based on 12x EBITDA"
            />
            <StatTile
              label="Daily Revenue"
              value={formatMoney(company.financials.revenueDaily, numberFormat)}
              subValue={`~${formatMoney(company.financials.revenueDaily * 30, numberFormat)}/mo`}
              trend="up"
            />
            <StatTile
              label="Operating EBITDA"
              value={formatMoney(company.financials.profitDaily, numberFormat)}
              subValue={`Margin: ${((company.financials.profitDaily / Math.max(1, company.financials.revenueDaily)) * 100).toFixed(1)}%`}
              trend="up"
            />
            <StatTile
              label="Treasury Cash"
              value={formatMoney(company.financials.cash, numberFormat)}
              subValue="Zero debt liabilities"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* P&L Statement */}
            <Card title="Daily & Monthly Profit & Loss (P&L)" subtitle="Section 18A.5 Earnings Engine">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Total Gross Revenue</span>
                  <span className="font-bold text-gray-100 tabular-nums">
                    {formatMoney(pl.revenue, numberFormat)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-gray-400">
                  <span>Cost of Goods & Hosting (COGS)</span>
                  <span className="text-rose-400 tabular-nums">
                    -{formatMoney(pl.cogs, numberFormat)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-gray-400">
                  <span>Payroll (Workforce Salaries)</span>
                  <span className="text-rose-400 tabular-nums">
                    -{formatMoney(pl.payroll, numberFormat)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-gray-400">
                  <span>Marketing & Branding Spend</span>
                  <span className="text-rose-400 tabular-nums">
                    -{formatMoney(pl.marketing, numberFormat)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-gray-400">
                  <span>Research & Development (R&D)</span>
                  <span className="text-rose-400 tabular-nums">
                    -{formatMoney(pl.rd, numberFormat)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-gray-400">
                  <span>Operations & General Overhead</span>
                  <span className="text-rose-400 tabular-nums">
                    -{formatMoney(pl.overhead, numberFormat)}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-t border-gray-800 font-semibold text-emerald-400">
                  <span>Operating EBITDA</span>
                  <span className="tabular-nums">{formatMoney(pl.ebitda, numberFormat)}</span>
                </div>

                <div className="flex justify-between py-1.5 border-t border-gray-800/60 font-bold text-gray-100">
                  <span>Net Daily Income (Post-Tax)</span>
                  <span className="tabular-nums text-emerald-400">
                    {formatMoney(pl.netIncome, numberFormat)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Balance Sheet */}
            <Card title="Simplified Balance Sheet" subtitle="Capital & Asset Structure">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Liquid Treasury Cash</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {formatMoney(balanceSheet.cash, numberFormat)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-gray-400">
                  <span>Accounts Receivable (Client Invoices)</span>
                  <span className="tabular-nums">
                    {formatMoney(balanceSheet.accountsReceivable, numberFormat)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-gray-400">
                  <span>Equipment, Servers & Proprietary IP</span>
                  <span className="tabular-nums">
                    {formatMoney(balanceSheet.equipmentValuation, numberFormat)}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-t border-gray-800 font-semibold text-gray-200">
                  <span>Total Corporate Assets</span>
                  <span className="tabular-nums">
                    {formatMoney(balanceSheet.totalAssets, numberFormat)}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-gray-400">
                  <span>Debt / Liabilities</span>
                  <span className="tabular-nums text-emerald-400">₹0 (Debt-Free)</span>
                </div>

                <div className="flex justify-between py-1.5 border-t border-gray-800 font-bold text-blue-400">
                  <span>Total Shareholder Equity</span>
                  <span className="tabular-nums">
                    {formatMoney(balanceSheet.totalEquity, numberFormat)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Departments */}
      {activeSubTab === 'departments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.entries(departments) as [DepartmentId, Department][]).map(([key, dept]) => (
            <Card key={key} title={dept.name} subtitle={`Level ${dept.level} Department`}>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-gray-400">
                  <span>Daily Budget</span>
                  <span className="font-bold text-gray-100 tabular-nums">
                    {formatMoney(dept.budgetDaily, numberFormat)}/day
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-400">
                  <span>Efficiency Factor</span>
                  <span className="font-semibold text-emerald-400">
                    {(dept.efficiency * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-400">
                  <span>Assigned Staff</span>
                  <span className="font-semibold text-blue-400">
                    {employees.filter((e) => e.department === key).length} Employees
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() =>
                      dispatch({
                        type: 'SET_DEPARTMENT_BUDGET',
                        department: key as DepartmentId,
                        budgetDaily: Math.max(5000, dept.budgetDaily - 5000),
                      })
                    }
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-bold"
                  >
                    - ₹5k
                  </button>
                  <span className="text-[11px] text-gray-400">Budget Adjust</span>
                  <button
                    onClick={() =>
                      dispatch({
                        type: 'SET_DEPARTMENT_BUDGET',
                        department: key as DepartmentId,
                        budgetDaily: dept.budgetDaily + 5000,
                      })
                    }
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded text-xs font-bold"
                  >
                    + ₹5k
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* SUB-TAB 3: Employees Workforce */}
      {activeSubTab === 'employees' && (
        <Card
          title="Corporate Workforce"
          subtitle={`${employees.length} Full-Time Professionals on Payroll`}
          action={
            <button
              onClick={() => setIsHireModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Hire Employee</span>
            </button>
          }
        >
          <div className="space-y-2.5 overflow-x-auto">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="p-3 bg-gray-950/60 rounded-xl border border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-gray-100">{emp.name}</span>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-medium uppercase">
                      {emp.department}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Role: <span className="text-gray-300">{emp.role}</span> · Skill: Level {emp.skill}/10 · Salary: {formatMoney(emp.salaryDaily, numberFormat)}/day
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Morale Bar */}
                  <div className="w-24">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                      <span>Morale</span>
                      <span className="font-semibold text-emerald-400">{(emp.morale * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${emp.morale * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Employee Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTrain(emp.id)}
                      title="Train employee (+1 Skill, costs ₹50k)"
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-xs text-blue-400 rounded font-medium border border-gray-700"
                    >
                      Train
                    </button>
                    <button
                      onClick={() => handlePromote(emp.id)}
                      title="Promote employee (+1 Skill, +25% salary, 100% morale)"
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-xs text-emerald-400 rounded font-medium border border-gray-700"
                    >
                      Promote
                    </button>
                    <button
                      onClick={() => handleFire(emp.id, emp.name)}
                      title="Terminate employee"
                      className="p-1 bg-gray-800 hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* SUB-TAB 4: Projects */}
      {activeSubTab === 'projects' && (
        <div className="space-y-4">
          {/* Active Projects */}
          <Card title="Active Client Deliverables" subtitle="In-progress work managed by Operations & R&D">
            <div className="space-y-3">
              {projects.filter((p) => p.status === 'active').map((proj) => {
                const pct = Math.min(100, Math.round((proj.workCompleted / proj.size) * 100));

                return (
                  <div
                    key={proj.id}
                    className="p-3.5 bg-gray-950/70 rounded-xl border border-gray-800 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-100">{proj.name}</h4>
                        <span className="text-[11px] text-gray-400">Client: {proj.clientName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-bold text-emerald-400 tabular-nums">
                          {formatMoney(proj.payout, numberFormat)}
                        </span>
                        <div className="text-[10px] text-gray-400">
                          Deadline: Day {proj.deadlineDay}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                        <span>Progress: {proj.workCompleted}/{proj.size} Work Units</span>
                        <span className="font-bold text-blue-400">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleCancelProject(proj.id)}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Cancel Project
                      </button>
                    </div>
                  </div>
                );
              })}

              {projects.filter((p) => p.status === 'active').length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  No active projects currently in execution. Review proposals below to accept contracts!
                </p>
              )}
            </div>
          </Card>

          {/* Available Proposals */}
          <Card title="Available Client Proposals" subtitle="Marketing generated pipeline contracts">
            <div className="space-y-3">
              {projects.filter((p) => p.status === 'available').map((proj) => (
                <div
                  key={proj.id}
                  className="p-3.5 bg-gray-950/70 rounded-xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-gray-100">{proj.name}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Client: <span className="text-gray-300">{proj.clientName}</span> · Size: {proj.size} Units · Risk: {(proj.clientDefaultRisk * 100).toFixed(0)}%
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 tabular-nums">
                      {formatMoney(proj.payout, numberFormat)}
                    </span>
                    <button
                      onClick={() => handleAcceptProject(proj.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition active:scale-95"
                    >
                      Sign & Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* SUB-TAB 5: Products */}
      {activeSubTab === 'products' && (
        <Card
          title="Proprietary Product Lines"
          subtitle="Recurring daily revenue engines (volatility capped at ±10%/mo)"
          action={
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Launch Product</span>
            </button>
          }
        >
          <div className="space-y-3">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="p-4 bg-gray-950/60 rounded-xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-100 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    {prod.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Quality Rating: {(prod.quality * 100).toFixed(0)}/100 · Market Attractiveness: {(prod.attractiveness * 100).toFixed(0)}% · Live since Day {prod.launchDay}
                  </p>
                </div>

                <div className="text-right sm:border-l sm:border-gray-800 sm:pl-4">
                  <div className="text-xs font-bold text-emerald-400 tabular-nums">
                    +{formatMoney(prod.dailyRevenue, numberFormat)}/day
                  </div>
                  <div className="text-[11px] text-rose-400 tabular-nums mt-0.5">
                    -{formatMoney(prod.dailyCost, numberFormat)}/day opex
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* SUB-TAB 6: Strategy */}
      {activeSubTab === 'strategy' && (
        <Card title="Corporate Strategy & Growth Levers" subtitle="Direct resource allocation">
          <div className="space-y-5">
            {/* Branding Spend */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-gray-200">Daily Branding & PR Spend</span>
                <span className="font-bold text-blue-400 tabular-nums">
                  {formatMoney(strategy.brandingSpendDaily, numberFormat)}/day
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mb-2">
                Boosts founder charm and corporate reputation, increasing announcement impact.
              </p>
              <div className="flex items-center gap-2">
                {[0, 15000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => dispatch({ type: 'SET_STRATEGY', brandingSpendDaily: amt })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      strategy.brandingSpendDaily === amt
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {amt === 0 ? 'None' : formatMoney(amt, numberFormat)}
                  </button>
                ))}
              </div>
            </div>

            {/* R&D Spend */}
            <div className="pt-4 border-t border-gray-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-gray-200">Daily R&D Acceleration Budget</span>
                <span className="font-bold text-indigo-400 tabular-nums">
                  {formatMoney(strategy.rdSpendDaily, numberFormat)}/day
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mb-2">
                Advances product line quality and lowers future unit production costs.
              </p>
              <div className="flex items-center gap-2">
                {[10000, 35000, 75000, 150000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => dispatch({ type: 'SET_STRATEGY', rdSpendDaily: amt })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      strategy.rdSpendDaily === amt
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {formatMoney(amt, numberFormat)}
                  </button>
                ))}
              </div>
            </div>

            {/* Dividend Policy */}
            <div className="pt-4 border-t border-gray-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-gray-200">Dividend Payout Ratio</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  {(strategy.dividendPayoutRatio * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mb-2">
                Percent of daily corporate net income distributed directly to founder liquid cash.
              </p>
              <div className="flex items-center gap-2">
                {[0, 0.1, 0.25, 0.5].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => dispatch({ type: 'SET_STRATEGY', dividendPayoutRatio: pct })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      strategy.dividendPayoutRatio === pct
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {pct === 0 ? 'Reinvest All (0%)' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Cost Cutting Toggle */}
            <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-gray-200">Austerity & Cost Cutting Mode</span>
                <p className="text-[11px] text-gray-400">
                  Cuts department budgets and overhead by 20%, but slightly reduces workforce morale.
                </p>
              </div>
              <button
                onClick={() =>
                  dispatch({
                    type: 'SET_STRATEGY',
                    costCuttingActive: !strategy.costCuttingActive,
                  })
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  strategy.costCuttingActive
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {strategy.costCuttingActive ? 'Austerity Active' : 'Normal Operations'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Hire Modal */}
      {isHireModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 max-w-md w-full space-y-4">
            <h3 className="font-bold text-sm text-gray-100">Hire New Team Member</h3>
            <form onSubmit={handleHireSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Department</label>
                <select
                  value={hireDepartment}
                  onChange={(e) => setHireDepartment(e.target.value as DepartmentId)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100"
                >
                  <option value="operations">Operations & Execution</option>
                  <option value="rd">Engineering & R&D</option>
                  <option value="marketing">Marketing & Growth</option>
                  <option value="hr">Human Resources</option>
                  <option value="finance">Finance & Accounts</option>
                  <option value="management">Management</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Designation / Role</label>
                <input
                  type="text"
                  value={hireRole}
                  onChange={(e) => setHireRole(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100"
                  required
                />
              </div>

              <div className="text-[11px] text-gray-400 bg-gray-950/60 p-2.5 rounded border border-gray-800">
                Onboarding fee: ₹50,000. Daily salary will scale with generated candidate skill level.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHireModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-bold"
                >
                  Confirm Hire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 max-w-md w-full space-y-4">
            <h3 className="font-bold text-sm text-gray-100">Commercialize New Product Line</h3>
            <form onSubmit={handleLaunchProductSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Product Name</label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. NextGen Logistics Gateway"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-xs text-gray-100"
                  required
                />
              </div>

              <div className="text-[11px] text-gray-400 bg-gray-950/60 p-2.5 rounded border border-gray-800">
                Commercialization Capex: ₹5,00,000 (5 Lakh). Will unlock an independent recurring daily revenue stream.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-bold"
                >
                  Launch Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

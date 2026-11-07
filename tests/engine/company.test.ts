import { describe, it, expect } from 'vitest';
import { createInitialState, reduce } from '../../src/engine';

describe('Company & Economy Core (v0.2 Acceptance Criteria)', () => {
  it('initializes player company with departments, staff, products, and financials', () => {
    const state = createInitialState(123);
    const company = state.companies['company_player'];

    expect(company).toBeDefined();
    expect(company.name).toBe('Mehta Enterprises');
    expect(company.departments).toBeDefined();
    expect(Object.keys(company.departments || {}).length).toBe(6);
    expect(company.employeesList?.length).toBeGreaterThanOrEqual(8);
    expect(company.projects?.length).toBeGreaterThan(0);
    expect(company.products?.length).toBeGreaterThan(0);
    expect(company.financials.revenueDaily).toBeGreaterThan(0);
    expect(company.financials.profitDaily).toBeGreaterThan(0);
  });

  it('hires new employee, deducts onboarding cost, and updates headcount', () => {
    const state = createInitialState(123);
    const initialCash = state.companies['company_player'].financials.cash;
    const initialCount = state.companies['company_player'].employeesList?.length || 0;

    const res = reduce(state, {
      type: 'HIRE_EMPLOYEE',
      department: 'rd',
      role: 'Fullstack Dev',
      name: 'Aditya Birla',
      skill: 8,
      salaryDaily: 8000,
    });

    const updated = res.state.companies['company_player'];
    expect(updated.employeesList?.length).toBe(initialCount + 1);
    expect(updated.financials.cash).toBe(initialCash - 50000);
    expect(updated.employeesList?.some((e) => e.name === 'Aditya Birla')).toBe(true);
  });

  it('trains an employee to boost skill and morale', () => {
    const state = createInitialState(123);
    const company = state.companies['company_player'];
    const emp = company.employeesList![0];
    const initialSkill = emp.skill;

    const res = reduce(state, {
      type: 'TRAIN_EMPLOYEE',
      employeeId: emp.id,
    });

    const updatedEmp = res.state.companies['company_player'].employeesList?.find((e) => e.id === emp.id);
    expect(updatedEmp?.skill).toBe(Math.min(10, initialSkill + 1));
    expect(updatedEmp?.morale).toBeGreaterThanOrEqual(emp.morale);
  });

  it('runs company for 100 days producing sensible financials & delivering projects', () => {
    let state = createInitialState(456);

    // Run for 100 days
    const res = reduce(state, { type: 'ADVANCE_DAY', count: 100 });
    state = res.state;

    const company = state.companies['company_player'];
    expect(state.day).toBe(101);
    expect(company.priceHistory.length).toBeGreaterThan(30);
    expect(company.financials.revenueDaily).toBeGreaterThan(0);
    expect(company.financials.cash).toBeGreaterThan(0);

    // Verify projects were delivered or progressed
    const deliveredCount = company.projects?.filter((p) => p.status === 'delivered').length || 0;
    const activeOrCompleted = company.projects?.filter((p) => p.workCompleted > 0).length || 0;
    expect(deliveredCount + activeOrCompleted).toBeGreaterThan(0);

    // Verify net worth is computed from cash + company equity valuation
    expect(state.player.netWorth).toBeGreaterThan(0);
    expect(state.history.days.length).toBe(101);
  });

  it('handles SETUP_FOUNDER command to customize founder, company, wife, and rival', () => {
    const state = createInitialState(789);

    const res = reduce(state, {
      type: 'SETUP_FOUNDER',
      playerName: 'Rajiv Singhal',
      playerCity: 'Bengaluru',
      playerAvatar: 'data:image/png;base64,founder_test_avatar',
      companyName: 'Singhal Tech Horizons',
      companySector: 'tech',
      wifeName: 'Tara Singhal',
      wifeAvatar: 'data:image/png;base64,wife_test_avatar',
      rivalName: 'Devendra Ruia',
      rivalAvatar: 'data:image/png;base64,rival_test_avatar',
    });

    const next = res.state;
    expect(next.player.name).toBe('Rajiv Singhal');
    expect(next.player.city).toBe('Bengaluru');
    expect(next.player.avatarUrl).toBe('data:image/png;base64,founder_test_avatar');
    expect(next.companies['company_player'].name).toBe('Singhal Tech Horizons');
    expect(next.people['wife'].name).toBe('Tara Singhal');
    expect(next.people['wife'].avatarUrl).toBe('data:image/png;base64,wife_test_avatar');
    expect(next.people['rival'].name).toBe('Devendra Ruia');
    expect(next.people['rival'].avatarUrl).toBe('data:image/png;base64,rival_test_avatar');
    expect(next.flags.gameSetupCompleted).toBe(true);
  });
});

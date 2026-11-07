import { Department, DepartmentId } from '../core/types';

export function createDefaultDepartments(): Record<DepartmentId, Department> {
  return {
    marketing: {
      id: 'marketing',
      name: 'Marketing & Growth',
      level: 1,
      budgetDaily: 25000,
      efficiency: 1.0,
      staffCount: 3,
      autoManage: true,
    },
    hr: {
      id: 'hr',
      name: 'Human Resources & Talent',
      level: 1,
      budgetDaily: 15000,
      efficiency: 1.0,
      staffCount: 2,
      autoManage: true,
    },
    operations: {
      id: 'operations',
      name: 'Operations & Execution',
      level: 1,
      budgetDaily: 35000,
      efficiency: 1.0,
      staffCount: 5,
      autoManage: true,
    },
    rd: {
      id: 'rd',
      name: 'Engineering & R&D',
      level: 1,
      budgetDaily: 40000,
      efficiency: 1.0,
      staffCount: 6,
      autoManage: true,
    },
    finance: {
      id: 'finance',
      name: 'Finance & Accounts',
      level: 1,
      budgetDaily: 20000,
      efficiency: 1.0,
      staffCount: 2,
      autoManage: true,
    },
    management: {
      id: 'management',
      name: 'Executive Management',
      level: 1,
      budgetDaily: 25000,
      efficiency: 1.0,
      staffCount: 2,
      autoManage: true,
    },
  };
}

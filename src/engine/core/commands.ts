import { CompanyId, DepartmentId, Money } from './types';

export type Command =
  | { type: 'ADVANCE_SLOT' }
  | { type: 'ADVANCE_DAY'; count?: number }
  | { type: 'SET_SLOT'; slot: 0 | 1 | 2 | 3 }
  | { type: 'RENAME_PLAYER'; name: string }
  | { type: 'RESET_GAME'; seed?: number }
  | { type: 'BUY_SHARES'; companyId: CompanyId; shares: number }
  | { type: 'SELL_SHARES'; companyId: CompanyId; shares: number }
  | {
      type: 'SETUP_FOUNDER';
      playerName: string;
      playerCity: string;
      playerAvatar?: string;
      companyName: string;
      companySector: string;
      wifeName: string;
      wifeAvatar?: string;
      rivalName: string;
      rivalAvatar?: string;
    }
  | {
      type: 'HIRE_EMPLOYEE';
      department: DepartmentId;
      role: string;
      name?: string;
      skill?: number;
      salaryDaily?: Money;
    }
  | { type: 'FIRE_EMPLOYEE'; employeeId: string }
  | { type: 'TRAIN_EMPLOYEE'; employeeId: string }
  | { type: 'PROMOTE_EMPLOYEE'; employeeId: string }
  | { type: 'ACCEPT_PROJECT'; projectId: string }
  | { type: 'CANCEL_PROJECT'; projectId: string }
  | { type: 'SET_DEPARTMENT_BUDGET'; department: DepartmentId; budgetDaily: Money }
  | {
      type: 'SET_STRATEGY';
      brandingSpendDaily?: Money;
      rdSpendDaily?: Money;
      expansionMode?: 'conservative' | 'balanced' | 'aggressive';
      costCuttingActive?: boolean;
      dividendPayoutRatio?: number;
    }
  | { type: 'LAUNCH_PRODUCT'; name: string; initialCost?: Money };

import { Employee, DepartmentId } from '../core/types';
import { Rng } from '../dynamics/rng';

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Amit', 'Ananya', 'Arjun', 'Deepak', 'Divya', 'Gaurav', 'Isha', 'Karan',
  'Kavita', 'Manish', 'Neha', 'Nikhil', 'Pooja', 'Pranav', 'Priya', 'Rahul', 'Ria', 'Rohan',
  'Roshni', 'Sameer', 'Shreya', 'Siddharth', 'Sneha', 'Sunil', 'Tanvi', 'Varun', 'Vikas', 'Zoya'
];

const LAST_NAMES = [
  'Agarwal', 'Bansal', 'Chatterjee', 'Deshmukh', 'Gupta', 'Iyer', 'Jain', 'Kapoor', 'Kumar', 'Malhotra',
  'Mehta', 'Nair', 'Patel', 'Rao', 'Reddy', 'Saxena', 'Sharma', 'Singh', 'Singhania', 'Verma'
];

export function generateEmployeeName(rng: Rng): string {
  const fIdx = Math.floor(rng.next() * FIRST_NAMES.length);
  const lIdx = Math.floor(rng.next() * LAST_NAMES.length);
  return `${FIRST_NAMES[fIdx]} ${LAST_NAMES[lIdx]}`;
}

export function createDefaultEmployees(day = 1): Employee[] {
  return [
    {
      id: 'emp_1',
      name: 'Rohan Sharma',
      department: 'operations',
      role: 'Operations Lead',
      skill: 8,
      salaryDaily: 8000,
      morale: 0.85,
      hireDay: day,
      productivity: 1.2,
    },
    {
      id: 'emp_2',
      name: 'Neha Kapoor',
      department: 'rd',
      role: 'Principal Architect',
      skill: 9,
      salaryDaily: 11000,
      morale: 0.9,
      hireDay: day,
      productivity: 1.35,
    },
    {
      id: 'emp_3',
      name: 'Amit Verma',
      department: 'rd',
      role: 'Senior Software Engineer',
      skill: 7,
      salaryDaily: 7000,
      morale: 0.8,
      hireDay: day,
      productivity: 1.1,
    },
    {
      id: 'emp_4',
      name: 'Priya Iyer',
      department: 'marketing',
      role: 'Growth Marketing Lead',
      skill: 8,
      salaryDaily: 8500,
      morale: 0.88,
      hireDay: day,
      productivity: 1.25,
    },
    {
      id: 'emp_5',
      name: 'Karan Patel',
      department: 'marketing',
      role: 'Enterprise Sales Exec',
      skill: 6,
      salaryDaily: 6000,
      morale: 0.75,
      hireDay: day,
      productivity: 1.0,
    },
    {
      id: 'emp_6',
      name: 'Pooja Nair',
      department: 'hr',
      role: 'Head of People & Talent',
      skill: 8,
      salaryDaily: 7500,
      morale: 0.9,
      hireDay: day,
      productivity: 1.2,
    },
    {
      id: 'emp_7',
      name: 'Sameer Deshmukh',
      department: 'finance',
      role: 'Senior Financial Controller',
      skill: 8,
      salaryDaily: 9000,
      morale: 0.85,
      hireDay: day,
      productivity: 1.15,
    },
    {
      id: 'emp_8',
      name: 'Zoya Gupta',
      department: 'management',
      role: 'Agile Delivery Director',
      skill: 8,
      salaryDaily: 9500,
      morale: 0.92,
      hireDay: day,
      productivity: 1.25,
    },
  ];
}

export function createNewHire(
  department: DepartmentId,
  role: string,
  rng: Rng,
  day: number,
  customName?: string,
  customSkill?: number,
  customSalary?: number
): Employee {
  const name = customName || generateEmployeeName(rng);
  const skill = customSkill || Math.min(10, Math.max(3, Math.round(5 + rng.normal() * 1.8)));
  const salaryDaily = customSalary || Math.round(skill * 1000 + (rng.next() - 0.5) * 1000);

  return {
    id: `emp_${day}_${Math.floor(rng.next() * 100000)}`,
    name,
    department,
    role,
    skill,
    salaryDaily: Math.max(2000, salaryDaily),
    morale: 0.85,
    hireDay: day,
    productivity: 0.8 + skill * 0.05,
  };
}

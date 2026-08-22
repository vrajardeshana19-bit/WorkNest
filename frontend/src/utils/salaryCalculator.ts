import type { SalaryComponent, SalaryInfo } from '../types';

/** Business rules from WorkNest salary specification */
export const STANDARD_ALLOWANCE = 4167;
export const PF_RATE_PERCENT = 12;
export const PROFESSIONAL_TAX = 200;
export const PERFORMANCE_BONUS_RATE = 0.0833;
export const LTA_RATE = 0.08333;

export const SALARY_RULES = [
  'Basic — 50% of monthly wage',
  'House Rent Allowance (HRA) — 50% of Basic',
  'Standard Allowance — fixed ₹4,167',
  'Performance Bonus — 8.33% of wage',
  'Leave Travel Allowance (LTA) — 8.333% of wage',
  'Fixed Allowance — wage minus all other components',
  'PF contribution — 12% of Basic (employee & employer)',
  'Professional Tax — ₹200 per month',
] as const;

export interface SalaryCalculationResult {
  components: SalaryComponent[];
  pfEmployee: number;
  pfEmployer: number;
  totalComponents: number;
  exceedsWage: boolean;
}

export function calculateSalaryComponents(monthlyWage: number): SalaryCalculationResult {
  const wage = Math.max(0, Math.round(monthlyWage));

  const basic = Math.round(wage * 0.5);
  const hra = Math.round(basic * 0.5);
  const standardAllowance = STANDARD_ALLOWANCE;
  const performanceBonus = Math.round(wage * PERFORMANCE_BONUS_RATE);
  const lta = Math.round(wage * LTA_RATE);

  const otherTotal = basic + hra + standardAllowance + performanceBonus + lta;
  const fixedAllowance = Math.max(0, wage - otherTotal);

  const components: SalaryComponent[] = [
    {
      name: 'Basic',
      type: 'PERCENTAGE',
      value: 50,
      calculatedMonthlyAmount: basic,
      computationNote: '50% of Wage',
    },
    {
      name: 'House Rent Allowance',
      type: 'PERCENTAGE',
      value: 50,
      calculatedMonthlyAmount: hra,
      computationNote: '50% of Basic',
    },
    {
      name: 'Standard Allowance',
      type: 'FIXED',
      value: STANDARD_ALLOWANCE,
      calculatedMonthlyAmount: standardAllowance,
      computationNote: 'Fixed Amount',
    },
    {
      name: 'Performance Bonus',
      type: 'PERCENTAGE',
      value: 8.33,
      calculatedMonthlyAmount: performanceBonus,
      computationNote: '8.33% of Wage',
    },
    {
      name: 'Leave Travel Allowance',
      type: 'PERCENTAGE',
      value: 8.333,
      calculatedMonthlyAmount: lta,
      computationNote: '8.333% of Wage',
    },
    {
      name: 'Fixed Allowance',
      type: 'FIXED',
      value: fixedAllowance,
      calculatedMonthlyAmount: fixedAllowance,
      computationNote: 'Wage − other components',
    },
  ];

  const totalComponents = components.reduce((sum, c) => sum + c.calculatedMonthlyAmount, 0);

  return {
    components,
    pfEmployee: Math.round(basic * (PF_RATE_PERCENT / 100)),
    pfEmployer: Math.round(basic * (PF_RATE_PERCENT / 100)),
    totalComponents,
    exceedsWage: totalComponents > wage,
  };
}

export function buildSalaryInfo(
  monthlyWage: number,
  overrides?: Partial<Pick<SalaryInfo, 'workingDaysPerWeek' | 'breakTimeHours' | 'wageType'>>
): SalaryInfo {
  const calc = calculateSalaryComponents(monthlyWage);

  return {
    wageType: overrides?.wageType ?? 'Fixed wage',
    wageAmount: Math.max(0, Math.round(monthlyWage)),
    yearlyWage: Math.max(0, Math.round(monthlyWage)) * 12,
    workingDaysPerWeek: overrides?.workingDaysPerWeek ?? 5,
    breakTimeHours: overrides?.breakTimeHours ?? 1,
    components: calc.components,
    pfContribution: {
      employeePercent: PF_RATE_PERCENT,
      employerPercent: PF_RATE_PERCENT,
      calculatedEmployeeAmount: calc.pfEmployee,
      calculatedEmployerAmount: calc.pfEmployer,
    },
    taxDeductions: {
      professionalTax: PROFESSIONAL_TAX,
    },
  };
}

import type { PayrollRecord } from '../types';
import { apiFetch } from './httpClient';

interface BackendPayrollRecord {
  id: string;
  employee_id: string;
  login_id: string | null;
  employee_name: string | null;
  department: string | null;
  year: number;
  month: number;
  base_salary: number | string;
  gross_earning: number | string;
  overtime_hours: number | string;
  overtime_pay: number | string;
  unpaid_leave_days: number | string;
  unpaid_leave_deduction: number | string;
  pf_deduction: number | string;
  tax_deduction: number | string;
  other_deductions: number | string;
  net_payable: number | string;
  status: 'DRAFT' | 'PROCESSED' | 'PAID';
}

interface BackendPayrollSummary {
  year: number;
  month: number;
  total_employees_processed: number;
  total_gross_payout: number | string;
  total_net_payout: number | string;
  records: BackendPayrollRecord[];
  notification_emails_sent?: number;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function mapPayrollRecord(record: BackendPayrollRecord): PayrollRecord {
  return {
    id: record.id,
    employeeId: record.login_id ?? record.employee_id,
    employeeName: record.employee_name ?? 'Employee',
    designation: '—',
    department: record.department ?? '—',
    monthYear: `${MONTHS[record.month - 1] ?? 'Month'} ${record.year}`,
    baseSalary: toNumber(record.base_salary),
    overtimeHours: toNumber(record.overtime_hours),
    overtimePay: toNumber(record.overtime_pay),
    unpaidLeaveDays: toNumber(record.unpaid_leave_days),
    unpaidLeaveDeduction: toNumber(record.unpaid_leave_deduction),
    netPayable: toNumber(record.net_payable),
    status: record.status,
  };
}

export async function getMyPayrollRecords(): Promise<PayrollRecord[]> {
  const records = await apiFetch<BackendPayrollRecord[]>('/payroll/me');
  return records.map(mapPayrollRecord);
}

export async function getCompanyPayroll(year?: number, month?: number): Promise<PayrollRecord[]> {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));
  const query = params.toString();

  const summary = await apiFetch<BackendPayrollSummary>(`/payroll${query ? `?${query}` : ''}`);
  return summary.records.map(mapPayrollRecord);
}

export interface PayrollProcessResult {
  year: number;
  month: number;
  totalEmployeesProcessed: number;
  totalGrossPayout: number;
  totalNetPayout: number;
  notificationEmailsSent: number;
  records: PayrollRecord[];
}

export async function processCompanyPayroll(year: number, month: number): Promise<PayrollProcessResult> {
  const summary = await apiFetch<BackendPayrollSummary>('/payroll/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, month }),
  });

  return {
    year: summary.year,
    month: summary.month,
    totalEmployeesProcessed: summary.total_employees_processed,
    totalGrossPayout: toNumber(summary.total_gross_payout),
    totalNetPayout: toNumber(summary.total_net_payout),
    notificationEmailsSent: summary.notification_emails_sent ?? 0,
    records: summary.records.map(mapPayrollRecord),
  };
}

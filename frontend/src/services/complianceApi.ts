import type { NeedsAttentionAlerts } from '../types';
import { apiFetch } from './httpClient';

interface BackendComplianceAlert {
  employee_id: string;
  login_id: string;
  employee_name: string;
  department: string | null;
  daily_hours_today: number | string;
  weekly_overtime_hours: number | string;
  quarterly_overtime_hours: number | string;
  status: string;
  warning_message: string;
}

interface BackendComplianceAlertsResponse {
  total_alerts: number;
  approaching_count: number;
  exceeded_count: number;
  alerts: BackendComplianceAlert[];
}

function toNumber(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getComplianceAlerts(): Promise<NeedsAttentionAlerts> {
  const data = await apiFetch<BackendComplianceAlertsResponse>('/compliance/alerts');

  return {
    pendingLeaveCount: 0,
    employeesApproachingOvertime: data.alerts.map((alert) => ({
      employeeName: alert.employee_name,
      hoursThisMonth: toNumber(alert.quarterly_overtime_hours),
      maxAllowed: 144,
    })),
    payrollChangePercentage: 0,
  };
}

export interface HRDashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingLeaves: number;
}

export async function getHRDashboardStats(
  employees: Array<{ status: string }>,
  attendancePresentCount: number,
  pendingLeaves: number
): Promise<HRDashboardStats> {
  return {
    totalEmployees: employees.length,
    presentToday: attendancePresentCount,
    onLeave: employees.filter((employee) => employee.status === 'ON_LEAVE').length,
    pendingLeaves,
  };
}

import { apiFetch } from './httpClient';

export interface TimeOffBalances {
  paidTimeOff: number;
  sickLeave: number;
  year: number;
}

interface BackendTimeOffBalance {
  id: string;
  employee_id: string;
  year: number;
  paid_time_off_balance: number;
  sick_leave_balance: number;
}

export async function getMyTimeOffBalances(year?: number): Promise<TimeOffBalances> {
  const query = year ? `?year=${year}` : '';
  const data = await apiFetch<BackendTimeOffBalance>(`/time-off/balances/me${query}`);
  return {
    paidTimeOff: data.paid_time_off_balance,
    sickLeave: data.sick_leave_balance,
    year: data.year,
  };
}

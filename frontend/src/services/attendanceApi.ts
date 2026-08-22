import type { AttendanceRecord } from '../types';
import { getStoredToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

type BackendAttendanceStatus = 'CHECKED_IN' | 'CHECKED_OUT' | 'COMPLETE' | 'ABSENT';

interface BackendAttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  work_hours: number | string | null;
  extra_hours: number | string | null;
  status: BackendAttendanceStatus;
}

interface BackendTodayStatus {
  date: string;
  is_checked_in: boolean;
  check_in_at: string | null;
  check_out_at: string | null;
  since: string | null;
  status: BackendAttendanceStatus;
}

interface BackendAdminRow {
  employee_id: string;
  login_id: string;
  employee_name: string;
  department: string | null;
  date: string;
  check_in: string | null;
  check_out: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  work_hours: number | string | null;
  extra_hours: number | string | null;
  status: BackendAttendanceStatus;
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === 'string') return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(', ') || 'Request failed';
    }
  } catch {
    // ignore JSON parse errors
  }
  return 'Request failed';
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function formatDisplayTime(iso: string | null, fallback?: string | null): string | null {
  if (iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  if (!fallback) return null;
  const [hours, minutes] = fallback.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return fallback;
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function mapStatus(status: BackendAttendanceStatus): AttendanceRecord['status'] {
  if (status === 'ABSENT') return 'ABSENT';
  return 'PRESENT';
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapMyRecord(
  record: BackendAttendanceRecord,
  employeeId: string,
  employeeName: string,
  department: string
): AttendanceRecord {
  return {
    id: record.id,
    employeeId,
    employeeName,
    department,
    date: record.date,
    checkIn: formatDisplayTime(record.check_in, record.check_in_time),
    checkOut: formatDisplayTime(record.check_out, record.check_out_time),
    checkInAt: record.check_in,
    checkOutAt: record.check_out,
    workHours: toNumber(record.work_hours),
    extraHours: toNumber(record.extra_hours),
    status: mapStatus(record.status),
  };
}

function mapTodayStatus(
  status: BackendTodayStatus,
  employeeId: string,
  employeeName: string,
  department: string
): AttendanceRecord {
  return {
    id: `today-${status.date}`,
    employeeId,
    employeeName,
    department,
    date: status.date,
    checkIn: formatDisplayTime(status.check_in_at, status.since),
    checkOut: formatDisplayTime(status.check_out_at, null),
    checkInAt: status.check_in_at,
    checkOutAt: status.check_out_at,
    workHours: 0,
    extraHours: 0,
    status: mapStatus(status.status),
  };
}

function mapAdminRow(row: BackendAdminRow): AttendanceRecord {
  return {
    id: `${row.employee_id}-${row.date}`,
    employeeId: row.login_id,
    employeeName: row.employee_name,
    department: row.department ?? '—',
    date: row.date,
    checkIn: formatDisplayTime(row.check_in, row.check_in_time),
    checkOut: formatDisplayTime(row.check_out, row.check_out_time),
    checkInAt: row.check_in,
    checkOutAt: row.check_out,
    workHours: toNumber(row.work_hours),
    extraHours: toNumber(row.extra_hours),
    status: mapStatus(row.status),
  };
}

export function isAttendanceApiAvailable(): boolean {
  return !!getStoredToken();
}

export async function apiCheckIn(): Promise<AttendanceRecord> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/attendance/check-in`, {
    method: 'POST',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const record: BackendAttendanceRecord = await res.json();
  return mapMyRecord(record, '', '', '');
}

export async function apiCheckOut(): Promise<AttendanceRecord> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/attendance/check-out`, {
    method: 'POST',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const record: BackendAttendanceRecord = await res.json();
  return mapMyRecord(record, '', '', '');
}

export async function apiGetMyToday(): Promise<AttendanceRecord | null> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/attendance/me/today`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const status: BackendTodayStatus = await res.json();
  if (!status.check_in_at && status.status === 'ABSENT') {
    return null;
  }

  return mapTodayStatus(status, '', '', '');
}

export async function apiGetMyMonthly(year?: number, month?: number): Promise<AttendanceRecord[]> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));

  const query = params.toString();
  const res = await fetch(`${API_BASE}/attendance/me${query ? `?${query}` : ''}`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const body: { records: BackendAttendanceRecord[] } = await res.json();
  return body.records.map((record) => mapMyRecord(record, '', '', ''));
}

export async function apiGetDailyAttendance(date?: string): Promise<AttendanceRecord[]> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const params = date ? `?date=${date}` : '';
  const res = await fetch(`${API_BASE}/attendance${params}`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const body: { records: BackendAdminRow[] } = await res.json();
  return body.records.map(mapAdminRow);
}

export function enrichAttendanceRecord(
  record: AttendanceRecord,
  employeeId: string,
  employeeName: string,
  department = '—'
): AttendanceRecord {
  return {
    ...record,
    employeeId: record.employeeId || employeeId,
    employeeName: record.employeeName || employeeName,
    department: record.department || department,
  };
}

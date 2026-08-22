import type { LeaveRequest, LeaveStatus, SmartLeaveAnalysis, TimeOffType } from '../types';
import { apiFetch } from './httpClient';

type BackendLeaveType = 'PAID_TIME_OFF' | 'SICK_LEAVE' | 'UNPAID_LEAVE';
type BackendLeaveReason = 'PERSONAL' | 'VACATION' | 'MEDICAL' | 'EMERGENCY';
type BackendLeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface BackendLeaveRequest {
  id: string;
  employee_id: string;
  leave_type: BackendLeaveType;
  reason: BackendLeaveReason;
  start_date: string;
  end_date: string;
  status: BackendLeaveStatus;
  remarks: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

interface BackendSmartRecommendation {
  team_size: number;
  overlapping_leave_count: number;
  coverage_before: number;
  coverage_during: number;
  holiday_overlap: number;
  effective_leave_days: number;
  recommendation: string;
  reason: string;
}

export interface LeaveEmployeeContext {
  loginId: string;
  name: string;
  department: string;
}

function diffDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1);
}

function mapLeaveType(type: BackendLeaveType): TimeOffType {
  switch (type) {
    case 'SICK_LEAVE':
      return 'Sick Leave';
    case 'UNPAID_LEAVE':
      return 'Unpaid Leaves';
    default:
      return 'Paid Time Off';
  }
}

function mapLeaveStatus(status: BackendLeaveStatus): LeaveStatus {
  if (status === 'APPROVED' || status === 'REJECTED') return status;
  return 'PENDING';
}

function mapRecommendation(value: string): SmartLeaveAnalysis['recommendation'] {
  if (value === 'APPROVE') return 'APPROVE';
  if (value === 'REJECT') return 'REJECT';
  return 'APPROVE WITH CAUTION';
}

export function mapLeaveRequest(
  record: BackendLeaveRequest,
  employee?: LeaveEmployeeContext
): LeaveRequest {
  return {
    id: record.id,
    employeeId: employee?.loginId ?? record.employee_id,
    employeeName: employee?.name ?? 'Employee',
    department: employee?.department ?? '—',
    type: mapLeaveType(record.leave_type),
    startDate: record.start_date,
    endDate: record.end_date,
    allocationDays: diffDays(record.start_date, record.end_date),
    status: mapLeaveStatus(record.status),
    reason: record.remarks ?? record.reason,
    attachmentUrl: record.attachment_url ?? undefined,
    hasMedicalGuidance: record.leave_type === 'SICK_LEAVE',
    createdAt: record.created_at.split('T')[0],
  };
}

export function mapLeaveTypeToBackend(type: TimeOffType): {
  leave_type: BackendLeaveType;
  reason: BackendLeaveReason;
} {
  switch (type) {
    case 'Sick Time Off':
    case 'Sick Leave':
      return { leave_type: 'SICK_LEAVE', reason: 'MEDICAL' };
    case 'Unpaid Leaves':
    case 'Casual Leave':
      return { leave_type: 'UNPAID_LEAVE', reason: 'PERSONAL' };
    case 'Vacation':
      return { leave_type: 'PAID_TIME_OFF', reason: 'VACATION' };
    default:
      return { leave_type: 'PAID_TIME_OFF', reason: 'PERSONAL' };
  }
}

export async function getMyLeaveRequests(context: LeaveEmployeeContext): Promise<LeaveRequest[]> {
  const records = await apiFetch<BackendLeaveRequest[]>('/leaves/me');
  return records.map((record) => mapLeaveRequest(record, context));
}

export async function getAllLeaveRequests(
  employeeDirectory: Map<string, LeaveEmployeeContext>
): Promise<LeaveRequest[]> {
  const records = await apiFetch<BackendLeaveRequest[]>('/leaves');
  return records.map((record) => {
    const employee = employeeDirectory.get(record.employee_id);
    return mapLeaveRequest(record, employee);
  });
}

export async function createLeave(payload: {
  type: TimeOffType;
  startDate: string;
  endDate: string;
  reason?: string;
  attachmentUrl?: string;
}): Promise<LeaveRequest> {
  const mapped = mapLeaveTypeToBackend(payload.type);
  const record = await apiFetch<BackendLeaveRequest>('/leaves', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leave_type: mapped.leave_type,
      reason: mapped.reason,
      start_date: payload.startDate,
      end_date: payload.endDate,
      remarks: payload.reason ?? null,
      attachment_url: payload.attachmentUrl ?? null,
    }),
  });
  return mapLeaveRequest(record);
}

export async function approveLeaveRequest(leaveId: string): Promise<LeaveRequest> {
  const record = await apiFetch<BackendLeaveRequest>(`/leaves/${leaveId}/approve`, {
    method: 'PATCH',
  });
  return mapLeaveRequest(record);
}

export async function rejectLeaveRequest(leaveId: string): Promise<LeaveRequest> {
  const record = await apiFetch<BackendLeaveRequest>(`/leaves/${leaveId}/reject`, {
    method: 'PATCH',
  });
  return mapLeaveRequest(record);
}

export async function getLeaveRecommendation(
  leaveId: string,
  leaveRequest?: LeaveRequest
): Promise<SmartLeaveAnalysis> {
  const data = await apiFetch<BackendSmartRecommendation>(`/leaves/${leaveId}/recommendation`);

  return {
    leaveRequestId: leaveId,
    employeeName: leaveRequest?.employeeName ?? 'Employee',
    leaveDates: leaveRequest
      ? `${leaveRequest.startDate} → ${leaveRequest.endDate}`
      : '—',
    type: leaveRequest?.type ?? 'Paid Time Off',
    coverageBefore: data.coverage_before,
    coverageDuring: data.coverage_during,
    coverageAfter: 100,
    holidayOverlap:
      data.holiday_overlap > 0
        ? [{ date: '—', name: `${data.holiday_overlap} company holiday(s) in range` }]
        : [],
    effectiveLeaveDays: data.effective_leave_days,
    overlappingLeaves: Array.from({ length: data.overlapping_leave_count }, (_, index) => ({
      employeeName: `Teammate ${index + 1}`,
      dates: leaveRequest ? `${leaveRequest.startDate} → ${leaveRequest.endDate}` : '—',
      type: 'Leave',
    })),
    recommendation: mapRecommendation(data.recommendation),
    recommendationReason: data.reason,
  };
}

export async function getLeaveById(leaveId: string): Promise<LeaveRequest> {
  const record = await apiFetch<BackendLeaveRequest>(`/leaves/${leaveId}`);
  return mapLeaveRequest(record);
}

export function buildEmployeeDirectory(
  employees: Array<{ id: string; loginId: string; name: string; department: string }>
): Map<string, LeaveEmployeeContext> {
  return new Map(
    employees.map((employee) => [
      employee.id,
      {
        loginId: employee.loginId,
        name: employee.name,
        department: employee.department,
      },
    ])
  );
}

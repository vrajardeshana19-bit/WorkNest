import type {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  SmartLeaveAnalysis,
  PayrollRecord,
  Holiday,
  NeedsAttentionAlerts,
  SalaryInfo,
  LeaveStatus,
} from '../types';

import {
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS,
  SMART_LEAVE_ANALYSIS_DATA,
  INITIAL_PAYROLL,
  UPCOMING_HOLIDAYS,
  INITIAL_NEEDS_ATTENTION,
} from './mockData';
import { buildSalaryInfo } from '../utils/salaryCalculator';
import * as attendanceApi from './attendanceApi';
import * as complianceApi from './complianceApi';
import * as employeesApi from './employeesApi';
import * as holidaysApi from './holidaysApi';
import * as leaveApi from './leaveApi';
import * as payrollApi from './payrollApi';
import * as timeOffApi from './timeOffApi';
import { getStoredToken } from './authApi';

// In-memory persistent state during demo runtime
let employeesStore: Employee[] = [...INITIAL_EMPLOYEES];
let attendanceStore: AttendanceRecord[] = [...INITIAL_ATTENDANCE];
let leaveRequestsStore: LeaveRequest[] = [...INITIAL_LEAVE_REQUESTS];
let smartAnalysisStore: Record<string, SmartLeaveAnalysis> = { ...SMART_LEAVE_ANALYSIS_DATA };
let payrollStore: PayrollRecord[] = [...INITIAL_PAYROLL];
let holidaysStore: Holiday[] = [...UPCOMING_HOLIDAYS];

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * System Generated Login ID Generator
 * Format: LOI (First 2 letters of company) + JODO (First 2 letters of first & last name) + YEAR + SERIAL
 * Example: OIJODO20220001
 */
export function generateLoginId(
  companyName: string,
  fullName: string,
  yearOfJoining: number = 2026,
  serial: number = 1
): string {
  const compPrefix = companyName.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'OI';
  const nameParts = fullName.trim().split(/\s+/);
  let namePrefix = 'JODO';
  if (nameParts.length >= 2) {
    namePrefix = (nameParts[0].slice(0, 2) + nameParts[nameParts.length - 1].slice(0, 2)).toUpperCase();
  } else if (nameParts[0].length >= 4) {
    namePrefix = nameParts[0].slice(0, 4).toUpperCase();
  }
  const serialStr = serial.toString().padStart(4, '0');
  return `${compPrefix}${namePrefix}${yearOfJoining}${serialStr}`;
}

/**
 * Employees Service API
 * Endpoints: /api/employees, /api/employees/:id
 */
export async function getEmployees(query?: string, department?: string): Promise<Employee[]> {
  if (getStoredToken()) {
    let result = await employeesApi.listEmployees();

    if (department && department !== 'ALL') {
      result = result.filter((employee) => employee.department.toLowerCase() === department.toLowerCase());
    }

    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (employee) =>
          employee.name.toLowerCase().includes(q) ||
          employee.employeeCode.toLowerCase().includes(q) ||
          employee.loginId.toLowerCase().includes(q) ||
          employee.department.toLowerCase().includes(q) ||
          employee.designation.toLowerCase().includes(q)
      );
    }

    return result;
  }

  await delay(250);
  let result = [...employeesStore];

  if (department && department !== 'ALL') {
    result = result.filter((e) => e.department.toLowerCase() === department.toLowerCase());
  }

  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    result = result.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.loginId.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
    );
  }

  return result;
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  if (getStoredToken()) {
    const isUuid = /^[0-9a-f-]{36}$/i.test(id);
    if (isUuid) {
      return employeesApi.getEmployeeByUuid(id);
    }

    try {
      const me = await employeesApi.getMyProfile();
      if (me.loginId === id || me.employeeCode === id || me.id === id) {
        return me;
      }
    } catch {
      // continue with directory lookup
    }

    const employees = await employeesApi.listEmployees();
    const match = employees.find(
      (employee) => employee.loginId === id || employee.employeeCode === id || employee.id === id
    );
    if (!match) return null;
    return employeesApi.getEmployeeByUuid(match.id);
  }

  await delay(200);
  const emp = employeesStore.find(
    (e) => e.id === id || e.employeeCode === id || e.loginId === id || e.email === id
  );
  return emp ? { ...emp } : null;
}

/**
 * Attendance Service API
 * Endpoints: /api/attendance, /api/attendance/check-in, /api/attendance/check-out
 */
export async function getAttendance(
  employeeId?: string,
  department?: string,
  date?: string
): Promise<AttendanceRecord[]> {
  if (getStoredToken()) {
    const today = new Date().toISOString().split('T')[0];

    if (employeeId) {
      if (date === today) {
        const todayRecord = await attendanceApi.apiGetMyToday();
        if (!todayRecord) return [];
        return [attendanceApi.enrichAttendanceRecord(todayRecord, employeeId, '', '')];
      }

      const targetDate = date ? new Date(`${date}T00:00:00`) : new Date();
      const records = await attendanceApi.apiGetMyMonthly(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1
      );
      const enriched = records.map((record) =>
        attendanceApi.enrichAttendanceRecord(record, employeeId, '', '')
      );
      return date ? enriched.filter((record) => record.date === date) : enriched;
    }

    let records = await attendanceApi.apiGetDailyAttendance(date);
    if (department && department !== 'ALL') {
      records = records.filter(
        (record) => record.department.toLowerCase() === department.toLowerCase()
      );
    }
    return records;
  }

  await delay(200);
  let result = [...attendanceStore];

  if (employeeId) {
    result = result.filter((a) => a.employeeId === employeeId);
  }

  if (department && department !== 'ALL') {
    result = result.filter((a) => a.department.toLowerCase() === department.toLowerCase());
  }

  if (date) {
    result = result.filter((a) => a.date === date);
  }

  return result;
}

export async function checkIn(employeeId: string): Promise<AttendanceRecord> {
  if (getStoredToken()) {
    const record = await attendanceApi.apiCheckIn();
    return attendanceApi.enrichAttendanceRecord(record, employeeId, '', '');
  }

  await delay(300);
  const emp = employeesStore.find(
    (e) => e.id === employeeId || e.employeeCode === employeeId || e.loginId === employeeId
  );
  if (!emp) throw new Error('Employee not found');

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const todayStr = now.toISOString().split('T')[0];

  let record = attendanceStore.find((a) => a.employeeId === emp.id && a.date === todayStr);

  if (record) {
    record.checkIn = timeStr;
    record.status = 'PRESENT';
  } else {
    record = {
      id: `att-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      date: todayStr,
      checkIn: timeStr,
      checkOut: null,
      workHours: 0.1,
      extraHours: 0.0,
      status: 'PRESENT',
    };
    attendanceStore.unshift(record);
  }

  // Update employee status to PRESENT
  emp.status = 'PRESENT';

  return { ...record };
}

export async function checkOut(employeeId: string): Promise<AttendanceRecord> {
  if (getStoredToken()) {
    const record = await attendanceApi.apiCheckOut();
    return attendanceApi.enrichAttendanceRecord(record, employeeId, '', '');
  }

  await delay(300);
  const emp = employeesStore.find(
    (e) => e.id === employeeId || e.employeeCode === employeeId || e.loginId === employeeId
  );
  if (!emp) throw new Error('Employee not found');

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const todayStr = now.toISOString().split('T')[0];

  const record = attendanceStore.find((a) => a.employeeId === emp.id && a.date === todayStr);
  if (!record) throw new Error('No active check-in record found for today');

  record.checkOut = timeStr;
  record.workHours = 8.5;
  record.extraHours = 0.5;

  return { ...record };
}

/**
 * Leave / Time Off Service API
 */
export async function getLeaveRequests(employeeId?: string, status?: LeaveStatus): Promise<LeaveRequest[]> {
  if (getStoredToken()) {
    let result: LeaveRequest[];

    if (employeeId) {
      const me = await employeesApi.getMyProfile();
      result = await leaveApi.getMyLeaveRequests({
        loginId: me.loginId,
        name: me.name,
        department: me.department,
      });
    } else {
      const employees = await employeesApi.listEmployees();
      const directory = leaveApi.buildEmployeeDirectory(
        employees.map((employee) => ({
          id: employee.id,
          loginId: employee.loginId,
          name: employee.name,
          department: employee.department,
        }))
      );
      result = await leaveApi.getAllLeaveRequests(directory);
    }

    if (status) {
      result = result.filter((request) => request.status === status);
    }

    return result;
  }

  await delay(250);
  let result = [...leaveRequestsStore];

  if (employeeId) {
    result = result.filter((l) => l.employeeId === employeeId);
  }

  if (status) {
    result = result.filter((l) => l.status === status);
  }

  return result;
}

export async function getSmartLeaveAnalysis(leaveRequestId: string): Promise<SmartLeaveAnalysis> {
  if (getStoredToken()) {
    let leaveRequest: LeaveRequest | undefined;
    try {
      leaveRequest = await leaveApi.getLeaveById(leaveRequestId);
    } catch {
      leaveRequest = undefined;
    }
    return leaveApi.getLeaveRecommendation(leaveRequestId, leaveRequest);
  }

  await delay(300);
  const analysis = smartAnalysisStore[leaveRequestId];

  if (analysis) {
    return { ...analysis };
  }

  // Dynamic fallback analysis
  const req = leaveRequestsStore.find((l) => l.id === leaveRequestId);
  const isSick = req?.type === 'Sick Time Off' || req?.type === 'Emergency Leave';

  return {
    leaveRequestId,
    employeeName: req?.employeeName || 'Rahul Sharma',
    leaveDates: req ? `${req.startDate} → ${req.endDate}` : '25 Aug → 27 Aug',
    type: req?.type || 'Paid Time Off',
    coverageBefore: 90,
    coverageDuring: isSick ? 75 : 68,
    coverageAfter: 90,
    holidayOverlap: [
      { date: '26 Aug', name: 'Company Holiday' },
    ],
    effectiveLeaveDays: req?.allocationDays || 2,
    overlappingLeaves: [
      { employeeName: 'Aman', dates: '25–26 Aug', type: 'Sick Time Off' },
      { employeeName: 'Priya', dates: '27 Aug', type: 'Casual Leave' },
    ],
    recommendation: isSick ? 'APPROVE WITH CAUTION' : 'APPROVE WITH CAUTION',
    recommendationReason: 'Team coverage falls to 68%. 26 Aug is a company holiday.',
  };
}

export async function createLeaveRequest(
  payload: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>
): Promise<LeaveRequest> {
  if (getStoredToken()) {
    return leaveApi.createLeave({
      type: payload.type,
      startDate: payload.startDate,
      endDate: payload.endDate,
      reason: payload.reason,
      attachmentUrl: payload.attachmentUrl,
    });
  }

  await delay(350);
  const id = `lr-${Date.now().toString().slice(-4)}`;
  const newReq: LeaveRequest = {
    ...payload,
    id,
    status: 'PENDING',
    createdAt: new Date().toISOString().split('T')[0],
  };

  leaveRequestsStore.unshift(newReq);
  return { ...newReq };
}

export async function approveLeave(leaveRequestId: string): Promise<LeaveRequest> {
  if (getStoredToken()) {
    return leaveApi.approveLeaveRequest(leaveRequestId);
  }

  await delay(300);
  const req = leaveRequestsStore.find((l) => l.id === leaveRequestId);
  if (!req) throw new Error('Leave request not found');

  req.status = 'APPROVED';

  // Update employee status if leave covers today
  const emp = employeesStore.find((e) => e.id === req.employeeId || e.name === req.employeeName);
  if (emp) {
    emp.status = 'ON_LEAVE';
  }

  // Recalculate mock payroll automatically
  const payroll = payrollStore.find((p) => p.employeeId === req.employeeId || p.employeeName === req.employeeName);
  if (payroll && req.type !== 'Work From Home' && req.type !== 'Sick Time Off') {
    payroll.unpaidLeaveDays += req.allocationDays;
    payroll.unpaidLeaveDeduction += Math.round((payroll.baseSalary / 30) * req.allocationDays);
    payroll.netPayable = payroll.baseSalary + payroll.overtimePay - payroll.unpaidLeaveDeduction;
  }

  return { ...req };
}

export async function rejectLeave(leaveRequestId: string): Promise<LeaveRequest> {
  if (getStoredToken()) {
    return leaveApi.rejectLeaveRequest(leaveRequestId);
  }

  await delay(300);
  const req = leaveRequestsStore.find((l) => l.id === leaveRequestId);
  if (!req) throw new Error('Leave request not found');

  req.status = 'REJECTED';
  return { ...req };
}

/**
 * Payroll Service API
 */
export async function getPayroll(employeeId?: string): Promise<PayrollRecord[]> {
  if (getStoredToken()) {
    if (employeeId) {
      return payrollApi.getMyPayrollRecords();
    }
    return payrollApi.getCompanyPayroll();
  }

  await delay(200);
  if (employeeId) {
    return payrollStore.filter(
      (p) => p.employeeId === employeeId || p.employeeId === `OIRASH20220001`
    );
  }
  return [...payrollStore];
}

export async function updateSalaryConfig(
  employeeId: string,
  updatedSalaryInfo: SalaryInfo
): Promise<Employee> {
  if (getStoredToken()) {
    await employeesApi.updateEmployeeSalary(
      employeeId,
      employeesApi.buildSalaryPayload(updatedSalaryInfo.wageAmount)
    );
    return employeesApi.getEmployeeByUuid(employeeId);
  }

  await delay(300);
  const emp = employeesStore.find(
    (e) => e.id === employeeId || e.employeeCode === employeeId || e.loginId === employeeId
  );
  if (!emp) throw new Error('Employee not found');

  emp.salaryInfo = buildSalaryInfo(updatedSalaryInfo.wageAmount, {
    workingDaysPerWeek: updatedSalaryInfo.workingDaysPerWeek,
    breakTimeHours: updatedSalaryInfo.breakTimeHours,
    wageType: updatedSalaryInfo.wageType,
  });

  // Update base salary in payroll record
  const payroll = payrollStore.find((p) => p.employeeId === emp.id);
  if (payroll) {
    payroll.baseSalary = updatedSalaryInfo.wageAmount;
    payroll.netPayable = payroll.baseSalary + payroll.overtimePay - payroll.unpaidLeaveDeduction;
  }

  return { ...emp };
}

export async function getHolidays(): Promise<Holiday[]> {
  if (getStoredToken()) {
    return holidaysApi.listHolidays(new Date().getFullYear());
  }

  await delay(150);
  return [...holidaysStore];
}

export async function getNeedsAttentionAlerts(): Promise<NeedsAttentionAlerts> {
  if (getStoredToken()) {
    const [alerts, leaves] = await Promise.all([
      complianceApi.getComplianceAlerts(),
      getLeaveRequests(undefined, 'PENDING'),
    ]);

    return {
      ...alerts,
      pendingLeaveCount: leaves.length,
    };
  }

  await delay(200);
  const pendingCount = leaveRequestsStore.filter((l) => l.status === 'PENDING').length;
  return {
    ...INITIAL_NEEDS_ATTENTION,
    pendingLeaveCount: pendingCount,
  };
}

export async function getTimeOffBalances() {
  if (getStoredToken()) {
    return timeOffApi.getMyTimeOffBalances();
  }

  await delay(150);
  return {
    paidTimeOff: 24,
    sickLeave: 7,
    year: new Date().getFullYear(),
  };
}

export async function getHRDashboardStats() {
  if (getStoredToken()) {
    const [employees, attendance, pendingLeaves] = await Promise.all([
      employeesApi.listEmployees(),
      attendanceApi.apiGetDailyAttendance(),
      getLeaveRequests(undefined, 'PENDING'),
    ]);

    const presentToday = attendance.filter((record) => record.checkIn).length;
    return complianceApi.getHRDashboardStats(employees, presentToday, pendingLeaves.length);
  }

  return {
    totalEmployees: 124,
    presentToday: 98,
    onLeave: 9,
    pendingLeaves: 7,
  };
}

export async function createHoliday(payload: {
  name: string;
  date: string;
  description?: string;
}): Promise<Holiday> {
  if (getStoredToken()) {
    return holidaysApi.createHoliday(payload);
  }
  throw new Error('Not authenticated');
}

export async function deleteHoliday(holidayId: string): Promise<void> {
  if (getStoredToken()) {
    return holidaysApi.deleteHoliday(holidayId);
  }
  throw new Error('Not authenticated');
}

export async function processPayroll(year: number, month: number) {
  if (getStoredToken()) {
    return payrollApi.processCompanyPayroll(year, month);
  }
  throw new Error('Not authenticated');
}

export async function seedDemoData() {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/setup/seed-demo`, {
    method: 'POST',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === 'string' ? body.detail : 'Failed to seed demo data');
  }
  return res.json() as Promise<{
    message: string;
    holidays_added: number;
    salaries_updated: number;
    payroll_records_processed: number;
  }>;
}

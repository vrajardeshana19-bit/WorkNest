import type { Employee, EmployeeStatus } from '../types';
import { buildSalaryInfo } from '../utils/salaryCalculator';
import { apiFetch } from './httpClient';

interface BackendCompany {
  id: string;
  name: string;
  initials: string;
  logo_url: string | null;
}

interface BackendEmployeeResponse {
  id: string;
  login_id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  profile_picture: string | null;
  date_of_joining: string;
  company: BackendCompany;
  display_status: EmployeeStatus;
  about: string | null;
  job_love: string | null;
  interests: string | null;
  skills: string | null;
  certifications: string | null;
  date_of_birth: string | null;
  mailing_address: string | null;
  personal_email: string | null;
  gender: string | null;
  marital_status: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  ifsc_code: string | null;
  pan_no: string | null;
  uid_no: string | null;
  emp_code: string | null;
}

interface BackendEmployeeListItem {
  id: string;
  login_id: string;
  first_name: string;
  last_name: string;
  department: string | null;
  profile_picture: string | null;
  display_status: EmployeeStatus;
}

interface BackendSalaryStructure {
  wage_type: string;
  base_salary: number | string;
  hra: number | string;
  standard_allowance: number | string;
  performance_bonus: number | string;
  lta: number | string;
  fixed_allowance: number | string;
  pf_employee: number | string;
  pf_employer: number | string;
  professional_tax: number | string;
  total_gross: number | string;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitCsv(value: string | null | undefined): string[] {
  if (!value) return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function mapStatus(status: EmployeeStatus): EmployeeStatus {
  if (status === 'ON_LEAVE' || status === 'ABSENT' || status === 'PRESENT') return status;
  return 'ABSENT';
}

export function mapEmployeeResponse(data: BackendEmployeeResponse, salaryWage?: number): Employee {
  const name = `${data.first_name} ${data.last_name}`.trim();
  const wage = salaryWage ?? 50000;

  return {
    id: data.id,
    employeeCode: data.emp_code ?? data.login_id,
    loginId: data.login_id,
    name,
    email: data.email,
    phone: data.phone ?? '—',
    avatar: data.profile_picture ?? undefined,
    designation: data.designation ?? '—',
    department: data.department ?? '—',
    manager: '—',
    location: '—',
    company: data.company.name,
    status: mapStatus(data.display_status),
    dateOfJoining: data.date_of_joining,
    dob: data.date_of_birth ?? '—',
    address: data.mailing_address ?? '—',
    nationality: '—',
    personalEmail: data.personal_email ?? data.email,
    gender: data.gender ?? '—',
    maritalStatus: data.marital_status ?? '—',
    bankDetails: {
      bankName: data.bank_name ?? '—',
      accountNumber: data.bank_account_number ?? '—',
      ifscCode: data.ifsc_code ?? '—',
    },
    securityDetails: {
      panNumber: data.pan_no ?? '—',
      uanNumber: data.uid_no ?? '—',
      employeeCode: data.emp_code ?? data.login_id,
    },
    salaryInfo: buildSalaryInfo(wage),
    resumeSummary: {
      bio: data.about ?? 'Profile details will appear here once updated.',
      skills: splitCsv(data.skills),
      whatILoveAboutMyJob: data.job_love ?? '—',
      interestsAndHobbies: data.interests ?? '—',
      certifications: splitCsv(data.certifications),
      experience: [],
      education: [],
    },
  };
}

export function mapEmployeeListItem(item: BackendEmployeeListItem): Employee {
  const name = `${item.first_name} ${item.last_name}`.trim();

  return {
    id: item.id,
    employeeCode: item.login_id,
    loginId: item.login_id,
    name,
    email: '',
    phone: '—',
    avatar: item.profile_picture ?? undefined,
    designation: '—',
    department: item.department ?? '—',
    manager: '—',
    location: '—',
    company: 'WorkNest',
    status: mapStatus(item.display_status),
    dateOfJoining: '—',
    dob: '—',
    address: '—',
    nationality: '—',
    personalEmail: '—',
    gender: '—',
    maritalStatus: '—',
    bankDetails: { bankName: '—', accountNumber: '—', ifscCode: '—' },
    securityDetails: { panNumber: '—', uanNumber: '—', employeeCode: item.login_id },
    salaryInfo: buildSalaryInfo(50000),
    resumeSummary: {
      bio: '—',
      skills: [],
      whatILoveAboutMyJob: '—',
      interestsAndHobbies: '—',
      certifications: [],
      experience: [],
      education: [],
    },
  };
}

function mapSalaryToWage(salary: BackendSalaryStructure): number {
  const gross = toNumber(salary.total_gross);
  if (gross > 0) return gross;
  return toNumber(salary.base_salary) * 2 || 50000;
}

export async function getMyProfile(): Promise<Employee> {
  const data = await apiFetch<BackendEmployeeResponse>('/employees/me');
  return mapEmployeeResponse(data);
}

export async function getEmployeeByUuid(employeeId: string): Promise<Employee> {
  const data = await apiFetch<BackendEmployeeResponse>(`/employees/${employeeId}`);

  try {
    const salary = await apiFetch<BackendSalaryStructure>(`/salary/${employeeId}`);
    return mapEmployeeResponse(data, mapSalaryToWage(salary));
  } catch {
    return mapEmployeeResponse(data);
  }
}

export async function listEmployees(): Promise<Employee[]> {
  const items = await apiFetch<BackendEmployeeListItem[]>('/employees');
  return items.map(mapEmployeeListItem);
}

export async function getMyCompanyId(): Promise<string> {
  const data = await apiFetch<{ company: { id: string } }>('/employees/me');
  return data.company.id;
}

export interface CreateEmployeePayload {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfJoining: string;
  department?: string;
  designation?: string;
  role?: 'EMPLOYEE' | 'HR' | 'ADMIN';
}

export interface CreateEmployeeResult {
  loginId: string;
  email: string;
  temporaryPassword?: string;
  message: string;
  credentialsEmailSent: boolean;
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<CreateEmployeeResult> {
  const result = await apiFetch<{
    login_id: string;
    email: string;
    temporary_password?: string;
    message: string;
    credentials_email_sent?: boolean;
  }>('/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_id: payload.companyId,
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone ?? null,
      date_of_joining: payload.dateOfJoining,
      department: payload.department ?? null,
      designation: payload.designation ?? null,
      role: payload.role ?? 'EMPLOYEE',
    }),
  });

  return {
    loginId: result.login_id,
    email: result.email,
    temporaryPassword: result.temporary_password,
    message: result.message,
    credentialsEmailSent: result.credentials_email_sent ?? false,
  };
}

export async function updateEmployeeSalary(
  employeeId: string,
  payload: Record<string, unknown>
): Promise<void> {
  await apiFetch(`/salary/${employeeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function buildSalaryPayload(wageAmount: number) {
  const basic = Math.round(wageAmount * 0.5);
  const hra = Math.round(basic * 0.5);
  const standardAllowance = 4167;
  const performanceBonus = Math.round(wageAmount * 0.0833);
  const lta = Math.round(wageAmount * 0.08333);
  const fixedAllowance = Math.max(0, wageAmount - (basic + hra + standardAllowance + performanceBonus + lta));
  const pf = Math.round(basic * 0.12);

  return {
    wage_type: 'MONTHLY',
    base_salary: basic,
    hra,
    standard_allowance: standardAllowance,
    performance_bonus: performanceBonus,
    lta,
    fixed_allowance: fixedAllowance,
    pf_employee: pf,
    pf_employer: pf,
    professional_tax: 200,
  };
}

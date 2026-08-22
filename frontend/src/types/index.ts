export type Role = 'EMPLOYEE' | 'HR' | 'ADMIN';

export type EmployeeStatus = 'PRESENT' | 'ON_LEAVE' | 'ABSENT';

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export interface SecurityDetails {
  panNumber: string;
  uanNumber: string;
  employeeCode: string;
}

export interface SalaryComponent {
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  calculatedMonthlyAmount: number;
  computationNote?: string;
}

export interface PfContribution {
  employeePercent: number;
  employerPercent: number;
  calculatedEmployeeAmount: number;
  calculatedEmployerAmount: number;
}

export interface TaxDeductions {
  professionalTax: number;
}

export interface SalaryInfo {
  wageType: 'MONTHLY' | 'YEARLY' | 'Fixed wage';
  wageAmount: number;
  yearlyWage: number;
  workingDaysPerWeek: number;
  breakTimeHours: number;
  components: SalaryComponent[];
  pfContribution: PfContribution;
  taxDeductions: TaxDeductions;
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
}

export interface ResumeSummary {
  bio: string;
  skills: string[];
  whatILoveAboutMyJob: string;
  interestsAndHobbies: string;
  certifications: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
}

export interface Employee {
  id: string;
  employeeCode: string; // System generated Login ID: e.g. OIJODO20220001
  loginId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  designation: string;
  department: string;
  manager: string;
  location: string;
  company: string;
  status: EmployeeStatus;
  dateOfJoining: string;
  dob: string;
  address: string;
  nationality: string;
  personalEmail: string;
  gender: string;
  maritalStatus: string;
  bankDetails: BankDetails;
  securityDetails: SecurityDetails;
  salaryInfo: SalaryInfo;
  resumeSummary: ResumeSummary;
}

export interface User {
  id: string;
  name: string;
  email: string;
  loginId: string;
  role: Role;
  avatar?: string;
  employeeId: string;
  companyName: string;
  companyLogo?: string;
  isFirstLogin?: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  workHours: number;
  extraHours: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';
}

export type TimeOffType =
  | 'Paid Time Off'
  | 'Sick Time Off'
  | 'Sick Leave'
  | 'Vacation'
  | 'Casual Leave'
  | 'Work From Home'
  | 'Unpaid Leaves'
  | 'Emergency Leave';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type RecommendationType = 'APPROVE' | 'APPROVE WITH CAUTION' | 'REJECT';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department: string;
  type: TimeOffType;
  startDate: string;
  endDate: string;
  allocationDays: number;
  status: LeaveStatus;
  reason: string;
  attachmentUrl?: string;
  hasMedicalGuidance?: boolean;
  createdAt: string;
}

export interface OverlappingLeave {
  employeeName: string;
  dates: string;
  type: string;
}

export interface SmartLeaveAnalysis {
  leaveRequestId: string;
  employeeName: string;
  leaveDates: string;
  type: TimeOffType;
  coverageBefore: number;
  coverageDuring: number;
  coverageAfter: number;
  holidayOverlap: { date: string; name: string }[];
  effectiveLeaveDays: number;
  overlappingLeaves: OverlappingLeave[];
  recommendation: RecommendationType;
  recommendationReason: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  monthYear: string;
  baseSalary: number;
  overtimeHours: number;
  overtimePay: number;
  unpaidLeaveDays: number;
  unpaidLeaveDeduction: number;
  netPayable: number;
  status: 'DRAFT' | 'PROCESSED' | 'PAID';
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  day: string;
  isOptional?: boolean;
}

export interface NeedsAttentionAlerts {
  pendingLeaveCount: number;
  employeesApproachingOvertime: {
    employeeName: string;
    hoursThisMonth: number;
    maxAllowed: number;
  }[];
  payrollChangePercentage: number;
}

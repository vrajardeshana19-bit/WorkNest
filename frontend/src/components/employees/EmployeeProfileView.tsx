import React, { useState } from 'react';
import type { Employee, SalaryInfo } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MaskedField } from '../common/MaskedField';
import { updateSalaryConfig } from '../../services/api';
import { buildSalaryInfo, SALARY_RULES, calculateSalaryComponents } from '../../utils/salaryCalculator';
import {
  User,
  FileText,
  Shield,
  DollarSign,
  Lock,
  Award,
  Briefcase,
  Save,
  ShieldCheck,
  Heart,
  Sparkles,
} from 'lucide-react';

interface EmployeeProfileViewProps {
  employee: Employee;
  isReadOnly?: boolean;
  onUpdate?: () => void;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  employee,
  isReadOnly = true,
  onUpdate,
}) => {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'resume' | 'private' | 'salary' | 'security'>('resume');

  // Editable salary state for ADMIN role
  const [salaryConfig, setSalaryConfig] = useState<SalaryInfo>(employee.salaryInfo);
  const [isSavingSalary, setIsSavingSalary] = useState(false);

  // Phone privacy mask toggle
  const [showFullPhone, setShowFullPhone] = useState(false);

  const isAdmin = role === 'ADMIN';

  const handleWageChange = (newWage: number) => {
    setSalaryConfig(
      buildSalaryInfo(newWage, {
        workingDaysPerWeek: salaryConfig.workingDaysPerWeek,
        breakTimeHours: salaryConfig.breakTimeHours,
        wageType: salaryConfig.wageType,
      })
    );
  };

  const salaryTotals = calculateSalaryComponents(salaryConfig.wageAmount);

  const handleSaveSalary = async () => {
    if (!isAdmin) return;
    setIsSavingSalary(true);
    try {
      await updateSalaryConfig(employee.id, salaryConfig);
      showToast('Salary Structure Saved!', 'success', 'Updated component amounts automatically based on defined wage.');
      if (onUpdate) onUpdate();
    } catch {
      showToast('Failed to update salary config', 'error');
    } finally {
      setIsSavingSalary(false);
    }
  };

  // Mask phone for privacy
  const getMaskedPhone = (phoneStr: string) => {
    if (!phoneStr) return '—';
    if (showFullPhone || isAdmin) return phoneStr;
    return phoneStr.replace(/\d(?=\d{4})/g, '•');
  };

  // Generate Clean SVG Initials Avatar (No broken picture dependencies)
  const getInitials = (name: string) => {
    if (!name) return 'WN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Profile Header matching Excalidraw Image 3 Wireframe */}
      <div className="wn-card p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          {/* Avatar / Initials */}
          <div className="w-20 h-20 rounded-lg bg-slate-100 border-2 border-blue-600/50 flex items-center justify-center font-bold text-2xl text-slate-800 shadow-sm shrink-0">
            {getInitials(employee.name)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-slate-800">{employee.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-wn-secondary">
                ID: {employee.loginId || employee.employeeCode}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">{employee.designation}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 mt-3 text-xs text-slate-600 bg-white/50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-600 uppercase block font-semibold">Company</span>
                <span className="font-medium text-slate-700 truncate block">{employee.company}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase block font-semibold">Department</span>
                <span className="font-medium text-slate-700 block">{employee.department}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase block font-semibold">Manager</span>
                <span className="font-medium text-slate-700 block">{employee.manager}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase block font-semibold">Email</span>
                <span className="font-medium text-slate-700 truncate block">{employee.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase block font-semibold">Mobile</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-slate-700">{getMaskedPhone(employee.phone)}</span>
                  {!isAdmin && (
                    <button
                      onClick={() => setShowFullPhone(!showFullPhone)}
                      className="text-[9px] text-wn-secondary hover:underline ml-1"
                    >
                      {showFullPhone ? 'Hide' : 'Show'}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase block font-semibold">Location</span>
                <span className="font-medium text-slate-700 block">{employee.location}</span>
              </div>
            </div>
          </div>
        </div>

        {isReadOnly && (
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center gap-1.5 shrink-0 self-start">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>View-Only Mode</span>
          </div>
        )}
      </div>

      {/* Tabs Bar matching Excalidraw Wireframes */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('resume')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'resume'
              ? 'border-blue-600 text-wn-secondary bg-slate-500/5'
              : 'border-transparent text-slate-600 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4 text-wn-secondary" />
          <span>Resume</span>
        </button>

        <button
          onClick={() => setActiveTab('private')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'private'
              ? 'border-blue-600 text-wn-secondary bg-slate-500/5'
              : 'border-transparent text-slate-600 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4 text-wn-secondary" />
          <span>Private Info</span>
        </button>

        {/* ADMIN-ONLY Salary Info Tab */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('salary')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'salary'
                ? 'border-blue-600 text-wn-secondary bg-slate-500/5'
                : 'border-transparent text-wn-secondary/80 hover:text-wn-secondary'
            }`}
          >
            <DollarSign className="w-4 h-4 text-wn-secondary" />
            <span className="flex items-center gap-1.5">
              <span>Salary Info</span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-wn-secondary font-extrabold border border-blue-100">
                ADMIN ONLY
              </span>
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
            activeTab === 'security'
              ? 'border-blue-600 text-wn-secondary bg-slate-500/5'
              : 'border-transparent text-slate-600 hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4 text-wn-secondary" />
          <span>Security</span>
        </button>
      </div>

      {/* Tab Contents */}
      {/* 1. Resume Tab (Exact layout from Image 3 Wireframe) */}
      {activeTab === 'resume' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* About */}
            <div className="wn-card p-6">
              <h3 className="text-xs font-bold text-slate-600 font-medium mb-2">About</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{employee.resumeSummary.bio}</p>
            </div>

            {/* What I love about my job */}
            <div className="wn-card p-6">
              <h3 className="text-xs font-bold text-slate-600 font-medium mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-700 fill-rose-500/20" />
                <span>What I love about my job</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {employee.resumeSummary.whatILoveAboutMyJob || 'Building scalable enterprise systems that make HR workflow seamless and automated.'}
              </p>
            </div>

            {/* My interests and hobbies */}
            <div className="wn-card p-6">
              <h3 className="text-xs font-bold text-slate-600 font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>My interests and hobbies</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {employee.resumeSummary.interestsAndHobbies || 'Chess, tech reading, running, and listening to classical music.'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Skills */}
            <div className="wn-card p-6">
              <h3 className="text-xs font-bold text-slate-600 font-medium mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {employee.resumeSummary.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-wn-secondary"
                  >
                    + {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="wn-card p-6">
              <h3 className="text-xs font-bold text-slate-600 font-medium mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-wn-secondary" />
                <span>Certifications</span>
              </h3>
              <div className="space-y-2">
                {employee.resumeSummary.certifications.map((cert, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                    🏆 {cert}
                  </div>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="wn-card p-6">
              <h3 className="text-xs font-bold text-slate-600 font-medium mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-wn-secondary" />
                <span>Experience</span>
              </h3>
              <div className="space-y-2">
                {employee.resumeSummary.experience.map((exp, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800">{exp.title}</h4>
                    <p className="text-[11px] text-slate-600">
                      {exp.company} • <span className="text-wn-secondary font-semibold">{exp.duration}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Private Info Tab (Exact layout from Image 4 Wireframe) */}
      {activeTab === 'private' && (
        <div className="wn-card p-6">
          <h3 className="text-xs font-bold text-slate-600 font-medium mb-4">Private Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-600 block uppercase font-medium">Date of Birth</span>
              <span className="text-xs font-semibold text-slate-700 mt-0.5 block">{employee.dob}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-600 block uppercase font-medium">Date of Joining</span>
              <span className="text-xs font-semibold text-slate-700 mt-0.5 block">{employee.dateOfJoining}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-600 block uppercase font-medium">Nationality</span>
              <span className="text-xs font-semibold text-slate-700 mt-0.5 block">{employee.nationality}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-600 block uppercase font-medium">Gender</span>
              <span className="text-xs font-semibold text-slate-700 mt-0.5 block">{employee.gender}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-600 block uppercase font-medium">Marital Status</span>
              <span className="text-xs font-semibold text-slate-700 mt-0.5 block">{employee.maritalStatus}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-600 block uppercase font-medium">Personal Email</span>
              <span className="text-xs font-semibold text-slate-700 mt-0.5 block truncate">
                {employee.personalEmail}
              </span>
            </div>
            <div className="md:col-span-2 lg:col-span-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-600 block uppercase font-medium">Residing Address</span>
              <span className="text-xs font-semibold text-slate-700 mt-0.5 block">{employee.address}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADMIN-ONLY Salary Info Tab (Exact layout & math from Image 3 & 4 Wireframes) */}
      {activeTab === 'salary' && isAdmin && (
        <div className="wn-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-wn-secondary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-wn-secondary" />
                <span>Salary Information</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define wage type, schedule, components, and deductions. Amounts auto-calculate from fixed monthly wage.
              </p>
            </div>
            <button
              onClick={handleSaveSalary}
              disabled={isSavingSalary || salaryTotals.exceedsWage}
              className="flex items-center gap-2 px-4 py-2 bg-wn-secondary hover:bg-wn-secondary/90 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>

          {/* Important — business rules from specification */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <h4 className="text-xs font-bold text-slate-800 font-medium mb-3">Important</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-600">
              {SALARY_RULES.map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-slate-500 mt-3 border-t border-slate-200 pt-3">
              Component values update automatically when monthly wage changes. Total components must not exceed the
              defined wage.
            </p>
          </div>

          {/* Wage Type & Monthly/Yearly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">Wage Type</span>
              <span className="text-sm font-extrabold text-slate-700 mt-1 block">{salaryConfig.wageType}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Monthly Wage (₹)</span>
              <input
                type="number"
                value={salaryConfig.wageAmount}
                onChange={(e) => handleWageChange(Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-wn-secondary focus:outline-none focus:border-blue-600"
              />
              <span className="text-[9px] text-slate-600 mt-1 block">/ Month</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">Yearly Wage (₹)</span>
              <span className="text-base font-mono font-bold text-slate-800 mt-1 block">
                ₹{salaryConfig.yearlyWage.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-600 block">/ Yearly</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">Working Schedule</span>
              <span className="text-xs font-bold text-slate-700 mt-1 block">
                {salaryConfig.workingDaysPerWeek} Days/Week ({salaryConfig.breakTimeHours} hr break)
              </span>
            </div>
          </div>

          {/* Salary Components List */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 font-medium mb-3">
              Salary Components Breakdown
            </h4>
            <div className="space-y-2">
              {salaryConfig.components.map((comp, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-700">{comp.name}</span>
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-mono">
                      {comp.computationNote ??
                        (comp.type === 'PERCENTAGE' ? `${comp.value}% computation` : 'Fixed Amount')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-wn-secondary text-sm">
                      ₹{comp.calculatedMonthlyAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-600 block">/ month</span>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 border border-blue-100 text-xs font-bold">
                <span className="text-slate-800">Total Components</span>
                <span className="font-mono text-slate-800">
                  ₹{salaryTotals.totalComponents.toLocaleString()} / ₹{salaryConfig.wageAmount.toLocaleString()}
                </span>
              </div>

              {salaryTotals.exceedsWage && (
                <p className="text-xs text-rose-600 font-medium">
                  Total components exceed monthly wage. Adjust wage or review calculations.
                </p>
              )}
            </div>
          </div>

          {/* Provident Fund & Tax Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h5 className="text-xs font-bold text-slate-600 uppercase">Provident Fund (PF) Contribution</h5>
              <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
                <span>Employee PF ({salaryConfig.pfContribution.employeePercent}% of Basic):</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{salaryConfig.pfContribution.calculatedEmployeeAmount.toLocaleString()} / month
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Employer PF ({salaryConfig.pfContribution.employerPercent}% of Basic):</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{salaryConfig.pfContribution.calculatedEmployerAmount.toLocaleString()} / month
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h5 className="text-xs font-bold text-slate-600 uppercase">Tax Deductions</h5>
              <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
                <span>Professional Tax:</span>
                <span className="font-mono font-bold text-rose-600">
                  ₹{salaryConfig.taxDeductions.professionalTax.toLocaleString()} / month
                </span>
              </div>
              <p className="text-[10px] text-slate-600">Deducted from gross monthly salary.</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Security & Banking Tab */}
      {activeTab === 'security' && (
        <div className="wn-card p-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-600 font-medium mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-wn-secondary" />
              <span>Bank Account Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-600 block uppercase font-medium">Bank Name</span>
                <span className="text-xs font-semibold text-slate-700 mt-0.5 block">
                  {employee.bankDetails.bankName}
                </span>
              </div>
              <MaskedField label="Bank Account Number" value={employee.bankDetails.accountNumber} />
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-600 block uppercase font-medium">IFSC Code</span>
                <span className="text-xs font-mono font-semibold text-slate-700 mt-0.5 block">
                  {employee.bankDetails.ifscCode}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-600 font-medium mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Government & Security Identifiers</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MaskedField label="PAN Card Number" value={employee.securityDetails.panNumber} />
              <MaskedField label="UAN Number" value={employee.securityDetails.uanNumber} />
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-600 block uppercase font-medium">System Employee Code</span>
                <span className="text-xs font-mono font-bold text-wn-secondary mt-0.5 block">
                  {employee.loginId || employee.securityDetails.employeeCode}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

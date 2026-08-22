import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getPayroll, processPayroll } from '../services/api';
import type { PayrollRecord } from '../types';
import { downloadPayslip, getCurrentPayrollPeriod } from '../utils/payslipGenerator';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { ArrowDownRight, ArrowUpRight, ShieldCheck, Download, PlayCircle } from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const period = getCurrentPayrollPeriod();

  const isEmployeeRole = role === 'EMPLOYEE';
  const isAdmin = role === 'ADMIN';
  const canProcessPayroll = role === 'HR' || role === 'ADMIN';

  const loadPayroll = async () => {
    setIsLoading(true);
    try {
      const empId = isEmployeeRole ? user?.employeeId : undefined;
      const data = await getPayroll(empId);
      setPayrollRecords(data);
    } catch {
      showToast('Error loading payroll records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, [user, role]);

  const handleDownloadPayslip = (record: PayrollRecord) => {
    try {
      downloadPayslip(record, user?.companyName || 'WorkNest');
      showToast('Payslip opened', 'success', 'Use Print → Save as PDF in the print dialog.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to open payslip', 'error');
    }
  };

  const handleProcessPayroll = async () => {
    setIsProcessing(true);
    try {
      const result = await processPayroll(period.year, period.month);
      showToast(
        'Payroll processed',
        'success',
        `${result.totalEmployeesProcessed} employees · Net payout ₹${result.totalNetPayout.toLocaleString('en-IN')}${
          result.notificationEmailsSent > 0
            ? ` · ${result.notificationEmailsSent} payslip email${result.notificationEmailsSent === 1 ? '' : 's'} sent`
            : ''
        }`
      );
      loadPayroll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Payroll processing failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <LoadingSpinner label="Calculating payroll deductions & net payable..." />;

  const myPayroll = payrollRecords.find(
    (p) => p.employeeId === user?.employeeId || p.employeeName === user?.name
  ) || payrollRecords[0];

  return (
    <div className="space-y-6">
      <div className="wn-page-header flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="wn-page-title">Payroll</h1>
          <p className="wn-page-subtitle">
            {isEmployeeRole
              ? 'View your salary breakdown and download payslips.'
              : 'Process monthly payroll and manage compensation records.'}
          </p>
        </div>

        {canProcessPayroll && (
          <button
            onClick={handleProcessPayroll}
            disabled={isProcessing}
            className="wn-btn-primary self-start md:self-auto"
          >
            <PlayCircle className="w-4 h-4" />
            {isProcessing ? 'Processing...' : `Process ${period.label}`}
          </button>
        )}

        {myPayroll && isEmployeeRole && (
          <button
            onClick={() => handleDownloadPayslip(myPayroll)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 text-slate-800 rounded-xl text-xs font-bold shadow-sm self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Download Payslip</span>
          </button>
        )}
      </div>

      {isEmployeeRole && !myPayroll && (
        <EmptyState
          title="No payroll processed yet"
          description={`Payroll for ${period.label} has not been run yet. Contact HR or ask admin to process payroll.`}
        />
      )}

      {isEmployeeRole && myPayroll && (
        <div className="space-y-6">
          <div className="wn-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-sm text-slate-500">{period.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold font-mono text-wn-secondary">
                  ₹{myPayroll.netPayable.toLocaleString()}
                </span>
                <span className="text-xs text-slate-600">INR</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">Processed payroll for {period.label}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={myPayroll.status === 'PAID' ? 'success' : 'info'}>
                {myPayroll.status === 'PROCESSED' ? 'PROCESSED (Ready)' : myPayroll.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Base Salary */}
            <div className="wn-card p-5">
              <span className="text-xs font-semibold text-slate-600 uppercase">Base Monthly Salary</span>
              <div className="flex items-center gap-1 mt-2 text-xl font-bold font-mono text-slate-800">
                <span>₹{myPayroll.baseSalary.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">Fixed monthly wage component</p>
            </div>

            {/* Overtime Pay */}
            <div className="wn-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase">Overtime Addition</span>
                <span className="text-wn-secondary font-bold text-xs flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+₹{myPayroll.overtimePay.toLocaleString()}</span>
                </span>
              </div>
              <div className="mt-2 text-xl font-bold font-mono text-wn-secondary">
                +{myPayroll.overtimeHours} hrs
              </div>
              <p className="text-[11px] text-slate-600 mt-1">Calculated at 1.5x standard hourly wage</p>
            </div>

            {/* Unpaid Leave Deduction */}
            <div className="wn-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase">Unpaid Leave Deduction</span>
                <span className="text-rose-700 font-bold text-xs flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>-₹{myPayroll.unpaidLeaveDeduction.toLocaleString()}</span>
                </span>
              </div>
              <div className="mt-2 text-xl font-bold font-mono text-rose-700">
                {myPayroll.unpaidLeaveDays} Days
              </div>
              <p className="text-[11px] text-slate-600 mt-1">Auto-deducted post leave approval recalculation</p>
            </div>
          </div>
        </div>
      )}

      {/* Admin / HR Company-wide Payroll Table */}
      {(!isEmployeeRole || isAdmin) && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-800" />
              <span>Company Payroll Master Register — {period.label}</span>
            </h3>
            {isAdmin && (
              <span className="text-[10px] uppercase font-bold text-wn-secondary bg-slate-100 px-2 py-0.5 rounded border border-blue-100">
                Admin Master View
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Base Salary</th>
                  <th className="py-3.5 px-4">Overtime Pay</th>
                  <th className="py-3.5 px-4">Leave Deduction</th>
                  <th className="py-3.5 px-4">Net Payable</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {payrollRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-slate-500">
                      No payroll records for this period. Run payroll calculation from the admin panel.
                    </td>
                  </tr>
                ) : (
                  payrollRecords.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-100/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-800 block">{p.employeeName}</strong>
                      <span className="text-[10px] text-slate-600">{p.designation}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{p.department}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold">₹{p.baseSalary.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono text-wn-secondary font-semibold">
                      +₹{p.overtimePay.toLocaleString()} ({p.overtimeHours}h)
                    </td>
                    <td className="py-3.5 px-4 font-mono text-rose-700 font-semibold">
                      -₹{p.unpaidLeaveDeduction.toLocaleString()} ({p.unpaidLeaveDays}d)
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-wn-secondary text-sm">
                      ₹{p.netPayable.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={p.status === 'PROCESSED' ? 'success' : 'warning'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownloadPayslip(p)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Payslip
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

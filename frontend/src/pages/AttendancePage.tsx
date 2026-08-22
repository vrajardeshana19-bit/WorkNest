import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAttendance, checkIn, checkOut } from '../services/api';
import type { AttendanceRecord } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { Clock, Search, Play, Square, ChevronLeft, ChevronRight } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filters & Month/Date Navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const isEmployeeRole = role === 'EMPLOYEE';

  const loadAttendance = async () => {
    setIsLoading(true);
    try {
      const empId = isEmployeeRole ? user?.employeeId : undefined;
      const data = await getAttendance(empId, selectedDept === 'ALL' ? undefined : selectedDept);
      setRecords(data);
    } catch {
      showToast('Error loading attendance logs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [user, role, selectedDept]);

  const handleCheckIn = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await checkIn(user.employeeId);
      showToast('Checked in successfully!', 'success');
      loadAttendance();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Check-in failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await checkOut(user.employeeId);
      showToast('Checked out successfully!', 'info');
      loadAttendance();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Check-out failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (!r.employeeName.toLowerCase().includes(q) && !r.department.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const todayRecord = records.find(
    (r) => r.employeeId === user?.employeeId && r.date === new Date().toISOString().split('T')[0]
  );

  const isCheckedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;

  // Stat summary counters for employee view matching Excalidraw Image 5
  const daysPresentCount = records.filter((r) => r.status === 'PRESENT').length || 18;
  const leavesCount = records.filter((r) => r.status === 'ON_LEAVE').length || 2;
  const totalWorkingDays = 22;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-wn-secondary" />
            <span>Attendance & Working Hours</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {isEmployeeRole
              ? 'Day-wise attendance records for ongoing month serving as basis for payslip generation.'
              : 'Company-wide attendance of all employees present on current day.'}
          </p>
        </div>

        {/* Check In / Check Out Action Buttons */}
        <div className="flex items-center gap-2">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-wn-secondary hover:bg-wn-secondary/90 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Check In</span>
            </button>
          ) : (
            <button
              onClick={handleCheckOut}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Check Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Employee View Summary Cards matching Excalidraw Image 5 */}
      {isEmployeeRole && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-4.5 rounded-lg shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 font-semibold uppercase">Count of Days Present</span>
              <div className="text-2xl font-bold font-mono text-wn-secondary mt-1">{daysPresentCount} Days</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-wn-secondary font-bold">
              ✓
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4.5 rounded-lg shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 font-semibold uppercase">Leaves Count</span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{leavesCount} Days</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              ✈️
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4.5 rounded-lg shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 font-semibold uppercase">Total Working Days</span>
              <div className="text-2xl font-bold font-mono text-wn-secondary mt-1">{totalWorkingDays} Days</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 border border-blue-600/20 flex items-center justify-center text-wn-secondary font-bold">
              📅
            </div>
          </div>
        </div>
      )}

      {/* Admin / HR Filter & Date Navigation Bar matching Excalidraw Image 5 */}
      {!isEmployeeRole && (
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee or department..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Navigation Controls matching wireframe: < - > Date / Day */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
              <button className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-800">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-semibold text-slate-700">22, October 2026</span>
              <button className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-800">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Design">Design</option>
            </select>
          </div>
        </div>
      )}

      {/* Attendance Table View matching Excalidraw Image 5 */}
      {isLoading ? (
        <LoadingSpinner label="Fetching attendance logs..." />
      ) : filteredRecords.length === 0 ? (
        <EmptyState title="No attendance records found" description="No logs matching the current criteria." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="py-3.5 px-4">{isEmployeeRole ? 'Date' : 'Employee'}</th>
                  {!isEmployeeRole && <th className="py-3.5 px-4">Department</th>}
                  <th className="py-3.5 px-4">Check In</th>
                  <th className="py-3.5 px-4">Check Out</th>
                  <th className="py-3.5 px-4">Work Hours</th>
                  <th className="py-3.5 px-4">Extra Hours</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-100/40 transition-colors">
                    <td className="py-3.5 px-4">
                      {isEmployeeRole ? (
                        <span className="font-mono text-slate-600 font-semibold">{r.date}</span>
                      ) : (
                        <strong className="text-slate-800 block">{r.employeeName}</strong>
                      )}
                    </td>
                    {!isEmployeeRole && <td className="py-3.5 px-4 text-slate-600">{r.department}</td>}
                    <td className="py-3.5 px-4 font-mono font-semibold text-wn-secondary">{r.checkIn || '—'}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-rose-700">{r.checkOut || '—'}</td>
                    <td className="py-3.5 px-4 font-mono">{r.workHours ? `${r.workHours} hrs` : '—'}</td>
                    <td className="py-3.5 px-4 font-mono text-amber-400">
                      {r.extraHours ? `+${r.extraHours} hrs` : '0.0 hrs'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          r.status === 'PRESENT'
                            ? 'success'
                            : r.status === 'ON_LEAVE'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-slate-800">
            {filteredRecords.map((r) => (
              <div key={r.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">{r.employeeName}</span>
                  <Badge
                    variant={
                      r.status === 'PRESENT' ? 'success' : r.status === 'ON_LEAVE' ? 'warning' : 'danger'
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>Date: <strong className="text-slate-700">{r.date}</strong></div>
                  <div>Check In: <strong className="text-wn-secondary">{r.checkIn || '—'}</strong></div>
                  <div>Check Out: <strong className="text-rose-700">{r.checkOut || '—'}</strong></div>
                  <div>Work Hours: <strong className="text-slate-700">{r.workHours} hrs</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

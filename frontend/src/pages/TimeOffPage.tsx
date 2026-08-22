import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getLeaveRequests, getSmartLeaveAnalysis, approveLeave, rejectLeave, getHolidays, getTimeOffBalances } from '../services/api';
import type { TimeOffBalances } from '../services/timeOffApi';
import type { LeaveRequest, SmartLeaveAnalysis, Holiday } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { NewLeaveModal } from '../components/timeoff/NewLeaveModal';
import { SmartLeaveAnalysisModal } from '../components/timeoff/SmartLeaveAnalysisModal';
import { LeaveCalendarPanel } from '../components/timeoff/LeaveCalendarPanel';
import type { CalendarViewMode } from '../utils/calendarUtils';
import {
  CalendarDays,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const TimeOffPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [balances, setBalances] = useState<TimeOffBalances | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('month');
  const [calendarReferenceDate, setCalendarReferenceDate] = useState(() => new Date());

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SmartLeaveAnalysis | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  // Active leave type tab matching wireframe: Paid Time Off | Sick Time Off
  const [activeLeaveTab, setActiveLeaveTab] = useState<'Paid Time Off' | 'Sick Time Off'>('Paid Time Off');

  const isEmployeeRole = role === 'EMPLOYEE';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const empId = isEmployeeRole ? user?.employeeId : undefined;
      const [data, holidayData, balanceData] = await Promise.all([
        getLeaveRequests(empId),
        getHolidays(),
        isEmployeeRole ? getTimeOffBalances() : Promise.resolve(null),
      ]);
      setLeaveRequests(data);
      setHolidays(holidayData);
      setBalances(balanceData);
    } catch {
      showToast('Error loading time off requests', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, role]);

  const handleOpenAnalysis = async (leaveId: string) => {
    try {
      const analysisData = await getSmartLeaveAnalysis(leaveId);
      setSelectedAnalysis(analysisData);
      setIsAnalysisModalOpen(true);
    } catch {
      showToast('Could not load leave analysis', 'error');
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      await approveLeave(leaveId);
      showToast('Leave Approved', 'success', 'Employee notified via email.');
      loadData();
    } catch {
      showToast('Failed to approve', 'error');
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      await rejectLeave(leaveId);
      showToast('Leave Rejected', 'info', 'Employee notified via email.');
      loadData();
    } catch {
      showToast('Failed to reject', 'error');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'WN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const filteredRequests = leaveRequests.filter((l) => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (
        !l.employeeName.toLowerCase().includes(q) &&
        !l.type.toLowerCase().includes(q) &&
        !l.department.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const calendarLeaves = leaveRequests.filter(
    (l) => l.status === 'APPROVED' || l.status === 'PENDING'
  );

  return (
    <div className="space-y-6">
      {/* Header Banner matching wireframe: Time Off heading + Allocation + NEW button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-wn-secondary" />
            <span>Time Off</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {isEmployeeRole
              ? 'View your time off records and request new leaves.'
              : 'Employees can view only their own time off records, while Admins and HR Officers can view time off records & approve/reject them for all employees.'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {!isEmployeeRole && (
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              Allocation
            </span>
          )}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-wn-secondary hover:bg-wn-secondary/90 text-white rounded-xl text-xs font-bold shadow-sm shadow-slate-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>NEW</span>
          </button>
        </div>
      </div>

      {/* Leave Type Tabs matching wireframe: Paid Time Off | Sick Time Off with days available */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveLeaveTab('Paid Time Off')}
          className={`p-5 rounded-lg border shadow-sm text-left transition-all ${
            activeLeaveTab === 'Paid Time Off'
              ? 'bg-slate-100 border-blue-200'
              : 'bg-white border-slate-200 hover:border-slate-200'
          }`}
        >
          <h3 className="text-sm font-bold text-slate-800">Paid Time Off</h3>
          <div className="mt-2">
            <span className="text-2xl font-extrabold font-mono text-wn-secondary">{balances?.paidTimeOff ?? 0}</span>
            <span className="text-xs text-slate-600 ml-1.5">Days Available</span>
          </div>
        </button>

        <button
          onClick={() => setActiveLeaveTab('Sick Time Off')}
          className={`p-5 rounded-lg border shadow-sm text-left transition-all ${
            activeLeaveTab === 'Sick Time Off'
              ? 'bg-amber-100 border-amber-300'
              : 'bg-white border-slate-200 hover:border-slate-200'
          }`}
        >
          <h3 className="text-sm font-bold text-slate-800">Sick Time Off</h3>
          <div className="mt-2">
            <span className="text-2xl font-extrabold font-mono text-amber-800">{String(balances?.sickLeave ?? 0).padStart(2, '0')}</span>
            <span className="text-xs text-slate-600 ml-1.5">Days Available</span>
          </div>
        </button>
      </div>

      {/* Leave & Holiday Calendar with Recent Month / Quarterly / 12 Months views */}
      <LeaveCalendarPanel
        leaves={calendarLeaves}
        holidays={holidays}
        viewMode={calendarViewMode}
        referenceDate={calendarReferenceDate}
        onViewModeChange={setCalendarViewMode}
        onReferenceDateChange={setCalendarReferenceDate}
      />

      {/* Admin/HR: Search Bar */}
      {!isEmployeeRole && (
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, type, or department..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Requests Table / Queue */}
      {isLoading ? (
        <LoadingSpinner label="Loading time off records..." />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title="No leave requests"
          description="There are currently no time off requests to display."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {/* Desktop Table View matching wireframe: Name | Start Date | End Date | Time off Type | Status (+ Reject/Approve) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Start Date</th>
                  <th className="py-3.5 px-4">End Date</th>
                  <th className="py-3.5 px-4">Time off Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  {!isEmployeeRole && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-100/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-blue-200 flex items-center justify-center font-bold text-[10px] text-slate-800">
                          {getInitials(req.employeeName)}
                        </div>
                        <div>
                          <strong className="text-slate-800 block">{req.employeeName}</strong>
                          <span className="text-[10px] text-slate-600">{req.department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{req.startDate}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{req.endDate}</td>
                    <td className="py-3.5 px-4 font-semibold text-wn-secondary">{req.type}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'danger' : 'warning'
                        }
                      >
                        {req.status}
                      </Badge>
                    </td>
                    {!isEmployeeRole && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Reject & Approve buttons matching wireframe red/green circles */}
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleReject(req.id)}
                                className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 border border-rose-300 flex items-center justify-center text-rose-700 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-100 border border-blue-100 flex items-center justify-center text-wn-secondary transition-colors"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleOpenAnalysis(req.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-100 text-wn-secondary border border-blue-100 rounded-lg text-xs font-semibold transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Analysis</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-slate-800">
            {filteredRequests.map((req) => (
              <div key={req.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-blue-200 flex items-center justify-center font-bold text-[10px] text-slate-800">
                      {getInitials(req.employeeName)}
                    </div>
                    <span className="font-bold text-sm text-slate-800">{req.employeeName}</span>
                  </div>
                  <Badge
                    variant={
                      req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'danger' : 'warning'
                    }
                  >
                    {req.status}
                  </Badge>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    <strong className="text-slate-700">{req.type}</strong> ({req.allocationDays} days)
                  </p>
                  <p className="font-mono">
                    {req.startDate} → {req.endDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEmployeeRole && req.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="flex-1 py-2 bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex-1 py-2 bg-slate-100 text-wn-secondary rounded-lg text-xs font-semibold"
                      >
                        Approve
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleOpenAnalysis(req.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 text-wn-secondary rounded-lg text-xs font-semibold"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Analysis</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Time Off Request Modal */}
      <NewLeaveModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Smart Leave Analysis Modal */}
      {selectedAnalysis && (
        <SmartLeaveAnalysisModal
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          analysis={selectedAnalysis}
          onActionComplete={loadData}
        />
      )}
    </div>
  );
};

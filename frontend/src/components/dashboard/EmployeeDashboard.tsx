import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { checkIn, checkOut, getAttendance, getLeaveRequests, getHolidays, getTimeOffBalances } from '../../services/api';
import type { AttendanceRecord, LeaveRequest, Holiday } from '../../types';
import type { TimeOffBalances } from '../../services/timeOffApi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Badge } from '../common/Badge';
import { Clock, Calendar, Flame, Plane, Play, Square } from 'lucide-react';

export const EmployeeDashboard: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [balances, setBalances] = useState<TimeOffBalances | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Live timer for check-in elapsed hours
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [attData, leaveData, holData, balanceData] = await Promise.all([
        getAttendance(user.employeeId, undefined, todayStr),
        getLeaveRequests(user.employeeId),
        getHolidays(),
        getTimeOffBalances(),
      ]);

      setAttendance(attData[0] || null);
      setLeaves(leaveData);
      setHolidays(holData.slice(0, 3));
      setBalances(balanceData);

      if (attData[0]?.checkInAt && !attData[0]?.checkOut) {
        setElapsedSeconds(Math.floor((Date.now() - new Date(attData[0].checkInAt!).getTime()) / 1000));
      } else if (attData[0]?.checkIn && !attData[0]?.checkOut) {
        setElapsedSeconds(Math.floor(attData[0].workHours * 3600));
      }
    } catch {
      showToast('Error loading dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Live seconds ticker when checked in
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (attendance?.checkIn && !attendance?.checkOut) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [attendance]);

  const handleCheckIn = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const record = await checkIn(user.employeeId);
      setAttendance(record);
      setElapsedSeconds(0);
      showToast('Checked in successfully!', 'success', `Check-in recorded at ${record.checkIn}`);
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
      const record = await checkOut(user.employeeId);
      setAttendance(record);
      showToast('Checked out successfully!', 'info', `Check-out recorded at ${record.checkOut}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Check-out failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatElapsed = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) return <LoadingSpinner label="Loading employee dashboard..." />;

  const isCheckedIn = !!attendance?.checkIn && !attendance?.checkOut;

  return (
    <div className="space-y-6">
      <div className="wn-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="wn-page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="wn-page-subtitle">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <Badge variant={isCheckedIn ? 'success' : 'neutral'} icon={<Clock className="w-3.5 h-3.5" />}>
          {isCheckedIn ? 'Checked in' : 'Not checked in'}
        </Badge>
      </div>

      {/* Attendance Check In / Out Card & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Action Widget */}
        <div className="wn-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">Today's Attendance</h3>
              <span className="text-xs text-slate-600 font-mono">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="my-6 text-center">
              <div className="text-3xl font-mono font-bold text-slate-900 tracking-widest bg-slate-100 py-3 rounded-xl border border-slate-200 shadow-inner">
                {formatElapsed(elapsedSeconds)}
              </div>
              <p className="text-xs text-slate-600 mt-2">Active Working Timer</p>
            </div>

            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-600">Check In Time:</span>
                <span className="font-semibold text-slate-700">{attendance?.checkIn || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Check Out Time:</span>
                <span className="font-semibold text-slate-700">{attendance?.checkOut || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Extra / Overtime Hours:</span>
                <span className="font-semibold text-amber-400">+{attendance?.extraHours || 0} hrs</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-wn-secondary hover:bg-wn-secondary/90 disabled:opacity-50 shadow-sm shadow-slate-200 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Check In Now</span>
              </button>
            ) : (
              <button
                onClick={handleCheckOut}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 shadow-sm shadow-rose-600/30 transition-all"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Check Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Leave Balances Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="wn-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-blue-300/20 flex items-center justify-center text-slate-800">
                <Calendar className="w-5 h-5" />
              </div>
              <Badge variant="info">Paid Leave</Badge>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-800">{balances?.paidTimeOff ?? 0}</span>
              <span className="text-xs text-slate-600 ml-1.5">Days Available</span>
              <p className="text-xs text-slate-600 mt-1">Annual Paid Time Off allocation</p>
            </div>
            <button
              onClick={() => onNavigate('timeoff')}
              className="mt-4 text-xs font-semibold text-slate-800 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <span>Apply for Time Off →</span>
            </button>
          </div>

          <div className="wn-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <Badge variant="warning">Sick Leave</Badge>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-800">{String(balances?.sickLeave ?? 0).padStart(2, '0')}</span>
              <span className="text-xs text-slate-600 ml-1.5">Days Available</span>
              <p className="text-xs text-slate-600 mt-1">Medical leave with certificate upload option</p>
            </div>
            <button
              onClick={() => onNavigate('timeoff')}
              className="mt-4 text-xs font-semibold text-amber-400 hover:text-amber-800 flex items-center gap-1 transition-colors"
            >
              <span>Request Medical Leave →</span>
            </button>
          </div>

          {/* Pending Leave Requests Overview */}
          <div className="md:col-span-2 wn-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-600 font-medium">My Leave Requests</h4>
              <button
                onClick={() => onNavigate('timeoff')}
                className="text-xs text-slate-800 hover:underline font-medium"
              >
                View All
              </button>
            </div>

            {leaves.length === 0 ? (
              <p className="text-xs text-slate-600 py-3">No pending or recent leave requests.</p>
            ) : (
              <div className="space-y-2">
                {leaves.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-700">{l.type}</span>
                      <p className="text-[11px] text-slate-600">
                        {l.startDate} to {l.endDate} ({l.allocationDays} days)
                      </p>
                    </div>
                    <Badge
                      variant={
                        l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'
                      }
                    >
                      {l.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Company Holidays */}
      <div className="wn-card p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Plane className="w-4 h-4 text-slate-800" />
          <span>Upcoming Company Holidays</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {holidays.map((h) => (
            <div key={h.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-slate-800 font-bold text-xs flex flex-col items-center justify-center border border-blue-300/20">
                <span>{new Date(h.date).getDate()}</span>
                <span className="text-[9px] uppercase">
                  {new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700">{h.name}</h4>
                <p className="text-[11px] text-slate-600">{h.day}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

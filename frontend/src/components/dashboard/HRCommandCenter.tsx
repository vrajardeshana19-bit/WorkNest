import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getLeaveRequests,
  getNeedsAttentionAlerts,
  getSmartLeaveAnalysis,
  getHRDashboardStats,
  seedDemoData,
} from '../../services/api';
import type { LeaveRequest, NeedsAttentionAlerts, SmartLeaveAnalysis } from '../../types';
import type { HRDashboardStats } from '../../services/complianceApi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Badge } from '../common/Badge';
import { SmartLeaveAnalysisModal } from '../timeoff/SmartLeaveAnalysisModal';
import {
  AlertTriangle,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Database,
  MoreHorizontal,
} from 'lucide-react';

export const HRCommandCenter: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const { role } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [alerts, setAlerts] = useState<NeedsAttentionAlerts | null>(null);
  const [stats, setStats] = useState<HRDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SmartLeaveAnalysis | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [leaveData, alertsData, statsData] = await Promise.all([
        getLeaveRequests(),
        getNeedsAttentionAlerts(),
        getHRDashboardStats(),
      ]);
      setLeaveRequests(leaveData.filter((r) => r.status === 'PENDING').slice(0, 5));
      setAlerts(alertsData);
      setStats(statsData);
    } catch {
      showToast('Error loading dashboard', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const result = await seedDemoData();
      showToast('Sample data loaded', 'success', `${result.holidays_added} holidays · ${result.payroll_records_processed} payroll records`);
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load sample data', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenAnalysis = async (leaveId: string) => {
    try {
      const analysisData = await getSmartLeaveAnalysis(leaveId);
      setSelectedAnalysis(analysisData);
      setIsAnalysisModalOpen(true);
    } catch {
      showToast('Could not load leave analysis', 'error');
    }
  };

  if (isLoading) return <LoadingSpinner label="Loading workforce data..." />;

  const totalEmployees = stats?.totalEmployees ?? 0;
  const presentToday = stats?.presentToday ?? 0;
  const pendingLeaves = stats?.pendingLeaves ?? alerts?.pendingLeaveCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="wn-page-header flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="wn-page-title">Workforce Overview</h1>
          <p className="wn-page-subtitle">Connected attendance, leave, and payroll intelligence.</p>
        </div>
        {(role === 'ADMIN' || role === 'HR') && (
          <button onClick={handleSeedDemo} disabled={isSeeding} className="wn-btn-secondary text-sm">
            <Database className="w-4 h-4" />
            {isSeeding ? 'Loading...' : 'Load sample data'}
          </button>
        )}
      </div>

      <div className="wn-card glass-panel p-5 md:p-6">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-wn-outline-variant/25">
          <h2 className="text-lg font-semibold text-wn-primary font-[family-name:var(--font-geist)]">Workforce Overview</h2>
          <MoreHorizontal className="w-5 h-5 text-wn-on-surface-variant" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="wn-stat-tile">
            <p className="wn-kpi-label mb-1">Total Employees</p>
            <p className="wn-kpi-value text-wn-primary">{totalEmployees.toLocaleString()}</p>
          </div>
          <div className="wn-stat-tile">
            <p className="wn-kpi-label mb-1">Active Today</p>
            <p className="wn-kpi-value text-wn-secondary">{presentToday.toLocaleString()}</p>
          </div>
          <div className="wn-stat-tile">
            <p className="wn-kpi-label mb-1">Pending Approvals</p>
            <p className="wn-kpi-value text-wn-error">{pendingLeaves.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="wn-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-wn-primary font-[family-name:var(--font-geist)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Needs attention
            </h3>
            <Badge variant="warning">Action required</Badge>
          </div>
          <div className="space-y-3 flex-1">
            <div className="p-3 rounded-lg bg-wn-surface-container-low border border-wn-outline-variant/20">
              <p className="text-sm font-medium text-wn-on-surface">{pendingLeaves} leave request{pendingLeaves === 1 ? '' : 's'} pending</p>
              <p className="text-xs text-wn-on-surface-variant mt-1">Team coverage analysis ready for review.</p>
            </div>
            <div className="p-3 rounded-lg bg-wn-surface-container-low border border-wn-outline-variant/20">
              <p className="text-sm font-medium text-wn-on-surface">
                {alerts?.employeesApproachingOvertime.length ?? 0} employees near overtime limits
              </p>
            </div>
          </div>
          <button onClick={() => onNavigate('timeoff')} className="wn-btn-secondary w-full mt-4 text-sm">
            Go to time off <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="lg:col-span-2 wn-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-wn-primary font-[family-name:var(--font-geist)]">Leave requests</h3>
              <p className="text-sm text-wn-on-surface-variant mt-0.5">Review impact before approving</p>
            </div>
            <button onClick={() => onNavigate('timeoff')} className="text-sm text-wn-secondary hover:underline font-medium">
              View all
            </button>
          </div>

          <div className="space-y-3">
            {leaveRequests.length === 0 ? (
              <p className="text-sm text-wn-on-surface-variant py-8 text-center">No pending leave requests.</p>
            ) : (
              leaveRequests.map((req) => {
                const recType = req.status === 'REJECTED' ? 'REJECT' : req.type === 'Work From Home' ? 'APPROVE' : 'CAUTION';
                const recBadge =
                  recType === 'APPROVE' ? (
                    <Badge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>Approve</Badge>
                  ) : recType === 'CAUTION' ? (
                    <Badge variant="warning" icon={<AlertTriangle className="w-3 h-3" />}>Review</Badge>
                  ) : (
                    <Badge variant="danger" icon={<XCircle className="w-3 h-3" />}>Reject</Badge>
                  );

                return (
                  <div key={req.id} className="p-4 rounded-lg bg-wn-surface-container-low border border-wn-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-wn-secondary-container/20 flex items-center justify-center text-xs font-semibold text-wn-secondary">
                        {req.employeeName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-wn-primary">{req.employeeName}</p>
                        <p className="text-xs text-wn-on-surface-variant font-mono mt-0.5">
                          {req.startDate} → {req.endDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {recBadge}
                      <button onClick={() => handleOpenAnalysis(req.id)} className="wn-btn-primary text-xs px-3 py-1.5">
                        <Eye className="w-3.5 h-3.5" /> Review impact
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

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

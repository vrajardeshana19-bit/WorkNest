import React, { useState } from 'react';
import type { SmartLeaveAnalysis } from '../../types';
import { useToast } from '../../context/ToastContext';
import { approveLeave, rejectLeave } from '../../services/api';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import {
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';

interface SmartLeaveAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: SmartLeaveAnalysis;
  onActionComplete?: () => void;
}

export const SmartLeaveAnalysisModal: React.FC<SmartLeaveAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  onActionComplete,
}) => {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approveLeave(analysis.leaveRequestId);
      showToast('Leave Request Approved!', 'success', `${analysis.employeeName} notified via email.`);
      if (onActionComplete) onActionComplete();
      onClose();
    } catch {
      showToast('Error approving leave request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await rejectLeave(analysis.leaveRequestId);
      showToast('Leave Request Rejected', 'warning', `${analysis.employeeName} notified via email.`);
      if (onActionComplete) onActionComplete();
      onClose();
    } catch {
      showToast('Error rejecting leave request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRecommendationBadge = () => {
    if (analysis.recommendation === 'APPROVE') {
      return (
        <Badge variant="success" icon={<CheckCircle2 className="w-4 h-4" />}>
          RECOMMENDATION: APPROVE
        </Badge>
      );
    }
    if (analysis.recommendation === 'APPROVE WITH CAUTION') {
      return (
        <Badge variant="warning" icon={<AlertTriangle className="w-4 h-4" />}>
          RECOMMENDATION: APPROVE WITH CAUTION
        </Badge>
      );
    }
    return (
      <Badge variant="danger" icon={<XCircle className="w-4 h-4" />}>
        RECOMMENDATION: REJECT
      </Badge>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Leave Analysis"
      subtitle="Don't just approve leave. Understand its impact."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <div className="rounded-lg bg-wn-surface-container-low p-4 border border-wn-outline-variant/20">
          <div className="mb-2 flex justify-between items-end">
            <span className="wn-kpi-label">Project coverage</span>
            <span className={`text-sm font-semibold font-[family-name:var(--font-geist)] ${analysis.coverageDuring < 75 ? 'text-wn-error' : 'text-wn-secondary'}`}>
              {analysis.coverageDuring < 75 ? `Dropping to ${analysis.coverageDuring}%` : `${analysis.coverageDuring}% coverage`}
            </span>
          </div>
          <div className="w-full bg-wn-surface-container rounded-full h-2 mb-1">
            <div
              className={`h-2 rounded-full ${analysis.coverageDuring < 75 ? 'bg-wn-error' : 'bg-wn-secondary'}`}
              style={{ width: `${Math.min(100, analysis.coverageDuring)}%` }}
            />
          </div>
          <p className="text-xs text-wn-on-surface-variant mt-2">{analysis.recommendationReason}</p>
        </div>

        {/* Team Coverage Percentage Gauge */}
        <div className="bg-slate-100 p-5 rounded-lg border border-slate-200">
          <h4 className="text-xs font-bold text-slate-600 font-medium mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-800" />
            <span>Team Coverage Impact</span>
          </h4>

          <div className="grid grid-cols-3 gap-3 text-center">
            {/* Before */}
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-600 uppercase font-semibold block">Before Leave</span>
              <span className="text-xl font-bold font-mono text-wn-secondary mt-1 block">
                {analysis.coverageBefore}%
              </span>
            </div>

            {/* During */}
            <div
              className={`p-3 rounded-xl border ${
                analysis.coverageDuring >= 80
                  ? 'bg-emerald-100 border-blue-100 text-wn-secondary'
                  : analysis.coverageDuring >= 60
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-rose-100 border-rose-300 text-rose-700'
              }`}
            >
              <span className="text-[10px] uppercase font-bold block flex items-center justify-center gap-1">
                <span>During Leave</span>
                {analysis.coverageDuring < 80 && <TrendingDown className="w-3 h-3" />}
              </span>
              <span className="text-2xl font-extrabold font-mono mt-1 block">
                {analysis.coverageDuring}%
              </span>
            </div>

            {/* After */}
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-600 uppercase font-semibold block">After Leave</span>
              <span className="text-xl font-bold font-mono text-wn-secondary mt-1 block">
                {analysis.coverageAfter}%
              </span>
            </div>
          </div>
        </div>

        {/* Holiday Overlap & Overlapping Co-workers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Holiday Overlap */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-600 font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-wn-secondary" />
              <span>Holiday Overlap</span>
            </h4>
            {analysis.holidayOverlap.length === 0 ? (
              <p className="text-xs text-slate-600">No company holiday overlaps.</p>
            ) : (
              <div className="space-y-1.5">
                {analysis.holidayOverlap.map((h, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-white border border-slate-200 text-slate-700">
                    <span className="font-bold text-slate-800">{h.date}</span> — {h.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overlapping Leaves */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-600 font-medium mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Overlapping Team Leaves</span>
            </h4>
            {analysis.overlappingLeaves.length === 0 ? (
              <p className="text-xs text-slate-600">No overlapping leaves in this department.</p>
            ) : (
              <div className="space-y-1.5">
                {analysis.overlappingLeaves.map((o, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-white border border-slate-200 flex justify-between">
                    <span className="font-semibold text-slate-700">{o.employeeName}</span>
                    <span className="text-slate-600 font-mono">{o.dates} ({o.type})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Smart Recommendation Banner */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">{getRecommendationBadge()}</div>
          <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-800 block mb-1">Reason & Insight:</strong>
            {analysis.recommendationReason}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-100 border border-rose-300 hover:bg-rose-200 transition-all disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Leave</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-wn-secondary hover:bg-wn-secondary/90 shadow-sm shadow-slate-200 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Leave</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

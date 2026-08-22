import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createLeaveRequest } from '../../services/api';
import type { TimeOffType } from '../../types';
import { Modal } from '../common/Modal';
import { Calendar, Upload, AlertCircle, FileCheck, Send, X } from 'lucide-react';

interface NewLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewLeaveModal: React.FC<NewLeaveModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState<TimeOffType>('Paid Time Off');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculated allocation days
  const calculateAllocation = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 1);
  };

  const allocationDays = calculateAllocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const isSickType = type === 'Sick Time Off' || type === 'Sick Leave';

    if (isSickType && !attachmentName) {
      showToast('Medical Certificate Recommended', 'warning', 'Please attach a doctor certificate for Sick Leave.');
    }

    setIsSubmitting(true);
    try {
      await createLeaveRequest({
        employeeId: user.employeeId,
        employeeName: user.name,
        employeeAvatar: '',
        department: 'Engineering',
        type,
        startDate,
        endDate,
        allocationDays,
        reason: reason || `${type} request for ${allocationDays} days.`,
        attachmentUrl: attachmentName || undefined,
        hasMedicalGuidance: isSickType,
      });
      showToast('Leave Request Submitted!', 'success', 'HR will perform team coverage analysis.');
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit leave request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Time off Type Request"
      maxWidth="lg"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Employee Field matching wireframe */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-600">Employee</label>
          <span className="text-xs font-bold text-wn-secondary bg-slate-100 px-3 py-1 rounded-lg border border-blue-100">
            [{user?.name || 'Employee'}]
          </span>
        </div>

        {/* Time off Type matching wireframe: [Paid time off] */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-600">Time off Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TimeOffType)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 min-w-[180px]"
          >
            <option value="Paid Time Off">Paid Time Off</option>
            <option value="Sick Time Off">Sick Leave</option>
            <option value="Casual Leave">Unpaid Leaves</option>
          </select>
        </div>

        {/* Validity Period matching wireframe: May 13 To May 14 */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-2">Validity Period</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Calendar className="w-4 h-4 text-slate-600 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>
            <span className="text-xs text-slate-600 font-bold">To</span>
            <div className="relative flex-1">
              <Calendar className="w-4 h-4 text-slate-600 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Allocation matching wireframe: 01.00 Days */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
          <label className="text-xs font-semibold text-slate-600">Allocation</label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono text-wn-secondary">
              {allocationDays.toFixed(2).padStart(5, '0')}
            </span>
            <span className="text-xs text-slate-600">Days</span>
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Brief reason for time off request..."
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Sick Leave Guidance Banner */}
        {(type === 'Sick Time Off' || type === 'Sick Leave') && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Medical Guidance:</strong>
              Please attach a certified doctor prescription or hospital discharge summary.
            </div>
          </div>
        )}

        {/* Attachment matching wireframe: 📎 (For sick leave certificate) */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">
            Attachment
            <span className="text-slate-600 ml-1">(For sick leave certificate)</span>
          </label>
          <div className="relative border border-dashed border-slate-200 bg-white rounded-xl p-3 text-center hover:border-blue-600 transition-colors">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={handleFileUpload}
            />
            {attachmentName ? (
              <div className="flex items-center justify-center gap-2 text-xs text-wn-secondary">
                <FileCheck className="w-4 h-4" />
                <span className="font-semibold">{attachmentName}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                <Upload className="w-4 h-4" />
                <span>Click to upload certificate</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit / Discard buttons matching wireframe */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-wn-secondary hover:bg-wn-secondary/90 disabled:opacity-50 shadow-md transition-all"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-100 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

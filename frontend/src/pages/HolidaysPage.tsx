import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getHolidays, createHoliday, deleteHoliday } from '../services/api';
import type { Holiday } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { Calendar, Plus, Trash2, Sparkles } from 'lucide-react';

export const HolidaysPage: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const canManage = role === 'HR' || role === 'ADMIN';

  const loadHolidays = async () => {
    setIsLoading(true);
    try {
      const data = await getHolidays();
      setHolidays(data);
    } catch {
      showToast('Failed to load holidays', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createHoliday({ name, date, description: description || undefined });
      showToast('Holiday added', 'success');
      setIsModalOpen(false);
      setName('');
      setDescription('');
      loadHolidays();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add holiday', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (holidayId: string) => {
    if (!confirm('Remove this holiday?')) return;
    try {
      await deleteHoliday(holidayId);
      showToast('Holiday removed', 'info');
      loadHolidays();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete holiday', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-wn-secondary" />
            Company Holidays
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage the company holiday calendar used in leave planning and attendance.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-wn-secondary hover:bg-wn-secondary/90 text-white rounded-xl text-xs font-bold shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Holiday
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading holiday calendar..." />
      ) : holidays.length === 0 ? (
        <EmptyState
          title="No holidays configured"
          description="Add company holidays so employees and HR can plan leave accurately."
          actionText={canManage ? 'Add First Holiday' : undefined}
          onAction={canManage ? () => setIsModalOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex items-start justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 font-bold flex flex-col items-center justify-center border border-blue-100">
                  <span>{new Date(`${holiday.date}T00:00:00`).getDate()}</span>
                  <span className="text-[9px] uppercase">
                    {new Date(`${holiday.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{holiday.name}</h3>
                  <p className="text-xs text-slate-600">{holiday.day}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{holiday.date}</p>
                </div>
              </div>
              {canManage && (
                <button
                  onClick={() => handleDelete(holiday.id)}
                  className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                  aria-label="Delete holiday"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Company Holiday" maxWidth="md">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="wn-label block mb-1.5">Holiday Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="wn-input px-3 py-2 text-sm"
              placeholder="Independence Day"
            />
          </div>
          <div>
            <label className="wn-label block mb-1.5">Date</label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="wn-input px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="wn-label block mb-1.5">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="wn-input px-3 py-2 text-sm"
              placeholder="National holiday"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-wn-secondary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Holiday'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

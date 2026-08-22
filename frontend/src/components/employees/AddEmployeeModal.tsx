import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { createEmployee, getMyCompanyId } from '../../services/employeesApi';
import type { Role } from '../../types';
import { Modal } from '../common/Modal';
import { UserPlus, Copy, CheckCircle2 } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('Software Engineer');
  const [dateOfJoining, setDateOfJoining] = useState(today);
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    loginId: string;
    email: string;
    temporaryPassword?: string;
    credentialsEmailSent: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCreatedCredentials(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const companyId = await getMyCompanyId();
      const result = await createEmployee({
        companyId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        designation: designation.trim() || undefined,
        dateOfJoining,
        role,
      });

      setCreatedCredentials({
        loginId: result.loginId,
        email: result.email,
        temporaryPassword: result.temporaryPassword,
        credentialsEmailSent: result.credentialsEmailSent,
        message: result.message,
      });
      showToast(
        'Employee created',
        'success',
        result.credentialsEmailSent
          ? `Credentials emailed to ${result.email}`
          : 'Email failed — share credentials manually'
      );
      onSuccess();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create employee', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = async () => {
    if (!createdCredentials) return;
    const text = [
      `Login ID: ${createdCredentials.loginId}`,
      `Email: ${createdCredentials.email}`,
      createdCredentials.temporaryPassword
        ? `Temporary Password: ${createdCredentials.temporaryPassword}`
        : 'Temporary password sent via email.',
    ].join('\n');
    await navigator.clipboard.writeText(text);
    showToast('Credentials copied', 'success');
  };

  if (createdCredentials) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Employee Created" maxWidth="md">
        <div className="space-y-4">
          <div
            className={`flex items-center gap-2 rounded-xl p-4 border ${
              createdCredentials.credentialsEmailSent
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-amber-800 bg-amber-50 border-amber-200'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm">{createdCredentials.message}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm font-mono">
            <div><span className="text-slate-500">Login ID:</span> {createdCredentials.loginId}</div>
            <div><span className="text-slate-500">Email:</span> {createdCredentials.email}</div>
            {createdCredentials.temporaryPassword && (
              <div><span className="text-slate-500">Temp Password:</span> {createdCredentials.temporaryPassword}</div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={copyCredentials}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-wn-secondary text-white text-xs font-bold"
            >
              <Copy className="w-4 h-4" />
              Copy Credentials
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee" maxWidth="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="wn-label block mb-1.5">First Name</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="wn-input px-3 py-2 text-sm"
              placeholder="John"
            />
          </div>
          <div>
            <label className="wn-label block mb-1.5">Last Name</label>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="wn-input px-3 py-2 text-sm"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label className="wn-label block mb-1.5">Work Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="wn-input px-3 py-2 text-sm"
            placeholder="john.doe@company.com"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="wn-label block mb-1.5">Department</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="wn-input px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="wn-label block mb-1.5">Designation</label>
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="wn-input px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="wn-label block mb-1.5">Date of Joining</label>
            <input
              required
              type="date"
              value={dateOfJoining}
              onChange={(e) => setDateOfJoining(e.target.value)}
              className="wn-input px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="wn-label block mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="wn-input px-3 py-2 text-sm"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR Officer</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
        </div>

        <div>
          <label className="wn-label block mb-1.5">Phone (optional)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="wn-input px-3 py-2 text-sm"
            placeholder="+91 98765 43210"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-wn-secondary hover:bg-wn-secondary/90 text-white text-sm font-bold disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" />
          {isSubmitting ? 'Creating...' : 'Create Employee & Send Credentials'}
        </button>
      </form>
    </Modal>
  );
};

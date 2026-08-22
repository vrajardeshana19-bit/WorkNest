import React from 'react';
import type { Employee } from '../../types';
import { Plane, Mail, Phone, MapPin } from 'lucide-react';

interface EmployeeCardProps {
  employee: Employee;
  onClick: () => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onClick }) => {
  const getStatusIndicator = () => {
    if (employee.status === 'PRESENT') {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"
          title="Present & Checked In"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Present</span>
        </span>
      );
    }
    if (employee.status === 'ON_LEAVE') {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300"
          title="On Approved Leave"
        >
          <Plane className="w-3.5 h-3.5" />
          <span>On Leave</span>
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300"
        title="Absent Without Approval"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
        <span>Absent</span>
      </span>
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'WN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 hover:border-blue-600/50 p-5 rounded-lg shadow-sm hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Clean Initials Avatar */}
          <div className="w-14 h-14 rounded-lg bg-slate-100 border-2 border-blue-200 flex items-center justify-center font-bold text-lg text-slate-800 group-hover:scale-105 transition-all shadow-md">
            {getInitials(employee.name)}
          </div>
          <div>{getStatusIndicator()}</div>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-800 group-hover:text-wn-secondary transition-colors">
            {employee.name}
          </h3>
          <p className="text-xs font-medium text-slate-600">{employee.designation}</p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
            {employee.department}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>••••••••{employee.phone.slice(-2)}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="truncate">{employee.location}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
        <span>ID: <strong className="text-slate-600 font-mono">{employee.loginId || employee.employeeCode}</strong></span>
        <span className="text-slate-800 group-hover:underline font-semibold">View Profile →</span>
      </div>
    </div>
  );
};

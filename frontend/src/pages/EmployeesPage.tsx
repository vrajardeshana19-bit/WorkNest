import React, { useState, useEffect } from 'react';
import { getEmployees, getEmployeeById } from '../services/api';
import type { Employee } from '../types';
import { EmployeeCard } from '../components/employees/EmployeeCard';
import { EmployeeProfileView } from '../components/employees/EmployeeProfileView';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { Search, Filter, UserPlus } from 'lucide-react';
import { AddEmployeeModal } from '../components/employees/AddEmployeeModal';
import { useAuth } from '../context/AuthContext';

export const EmployeesPage: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Selected employee for profile modal view
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const canAddEmployee = role === 'HR' || role === 'ADMIN';

  const loadData = async (query: string, dept: string) => {
    setIsLoading(true);
    try {
      const data = await getEmployees(query, dept);
      setEmployees(data);
    } catch {
      showToast('Failed to load employees', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(searchQuery, selectedDept);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedDept]);

  const departments = ['ALL', 'Engineering', 'Human Resources', 'Design', 'Product', 'Marketing'];

  return (
    <div className="space-y-6">
      <div className="wn-page-header flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="wn-page-title">Employees</h1>
          <p className="wn-page-subtitle">Directory of all employees in your organization.</p>
        </div>
        {canAddEmployee && (
          <button onClick={() => setIsAddModalOpen(true)} className="wn-btn-primary self-start">
            <UserPlus className="w-4 h-4" />
            Add employee
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, or role..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-blue-300 transition-colors"
          />
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-600 shrink-0 hidden sm:inline" />
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDept === dept
                  ? 'bg-wn-secondary text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-700 border border-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Cards Grid */}
      {isLoading ? (
        <LoadingSpinner label="Searching employee directory..." />
      ) : employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Try adjusting your search criteria or department filter."
          actionText="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedDept('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {employees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onClick={async () => {
                try {
                  const fullProfile = await getEmployeeById(emp.id);
                  if (!fullProfile) {
                    showToast('Employee profile not found', 'error');
                    return;
                  }
                  setSelectedEmp(fullProfile);
                  setIsProfileModalOpen(true);
                } catch {
                  showToast('Failed to load employee profile', 'error');
                }
              }}
            />
          ))}
        </div>
      )}

      {/* View-Only Profile Modal */}
      {selectedEmp && (
        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title={`Employee Profile — ${selectedEmp.name}`}
          subtitle={`Employee Code: ${selectedEmp.employeeCode} • Department: ${selectedEmp.department}`}
          maxWidth="3xl"
        >
          <EmployeeProfileView employee={selectedEmp} isReadOnly={true} />
        </Modal>
      )}

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => loadData(searchQuery, selectedDept)}
      />
    </div>
  );
};

import React from 'react';
import type { Holiday, LeaveRequest } from '../../types';
import type { CalendarViewMode } from '../../utils/calendarUtils';
import {
  DAY_NAMES,
  MONTH_NAMES,
  getCalendarPeriodLabel,
  getHolidayForDate,
  getLeaveForDate,
  getMonthGrid,
  getQuarterMonths,
  getYearMonths,
  isSameDay,
  shiftReferenceDate,
  toDateKey,
} from '../../utils/calendarUtils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface LeaveCalendarPanelProps {
  leaves: LeaveRequest[];
  holidays: Holiday[];
  viewMode: CalendarViewMode;
  referenceDate: Date;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onReferenceDateChange: (date: Date) => void;
}

const VIEW_OPTIONS: { id: CalendarViewMode; label: string }[] = [
  { id: 'month', label: 'Recent Month' },
  { id: 'quarter', label: 'Quarterly' },
  { id: 'year', label: '12 Months' },
];

function DayCell({
  date,
  day,
  isCurrentMonth,
  leaves,
  holidays,
  compact = false,
}: {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  leaves: LeaveRequest[];
  holidays: Holiday[];
  compact?: boolean;
}) {
  const today = new Date();
  const isToday = isSameDay(date, today);
  const holiday = getHolidayForDate(date, holidays);
  const leave = getLeaveForDate(date, leaves);

  const minH = compact ? 'min-h-[28px]' : 'min-h-[50px]';
  const textSize = compact ? 'text-[8px]' : 'text-[9px]';
  const daySize = compact ? 'text-[10px]' : 'text-xs';

  let cellClass =
    'p-1.5 rounded-lg border flex flex-col justify-between transition-all ' +
    (isCurrentMonth ? '' : 'opacity-40 ');

  if (isToday) {
    cellClass += 'bg-slate-100 border-blue-600 text-slate-900 font-bold';
  } else if (holiday) {
    cellClass += 'bg-amber-100 border-amber-300 text-amber-900';
  } else if (leave) {
    cellClass += 'bg-slate-100 border-blue-200 text-slate-800';
  } else {
    cellClass += 'bg-slate-50 border-slate-200 text-slate-700';
  }

  return (
    <div className={`${cellClass} ${minH}`} title={holiday?.name ?? leave?.type ?? toDateKey(date)}>
      <span className={`text-left font-mono font-semibold ${daySize}`}>{day}</span>
      {!compact && isToday && <span className={`${textSize} font-bold text-wn-secondary`}>TODAY</span>}
      {!compact && holiday && <span className={`${textSize} truncate font-medium`}>Holiday</span>}
      {!compact && leave && !holiday && (
        <span className={`${textSize} truncate font-medium text-wn-secondary`}>Leave</span>
      )}
      {compact && (holiday || leave) && (
        <span
          className={`mx-auto mt-0.5 w-1.5 h-1.5 rounded-full ${
            holiday ? 'bg-amber-500' : 'bg-slate-500'
          }`}
        />
      )}
    </div>
  );
}

function MonthGrid({
  year,
  month,
  leaves,
  holidays,
  compact = false,
  showHeader = true,
}: {
  year: number;
  month: number;
  leaves: LeaveRequest[];
  holidays: Holiday[];
  compact?: boolean;
  showHeader?: boolean;
}) {
  const cells = getMonthGrid(year, month);

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      {showHeader && (
        <h4 className={`font-bold text-slate-800 ${compact ? 'text-[10px] mb-1' : 'text-xs mb-2'}`}>
          {MONTH_NAMES[month]} {year}
        </h4>
      )}
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className={`font-bold text-slate-600 uppercase ${
              compact ? 'text-[8px] p-0.5' : 'text-[10px] p-2'
            }`}
          >
            {compact ? d.charAt(0) : d}
          </div>
        ))}
        {cells.map((cell) => (
          <DayCell
            key={toDateKey(cell.date)}
            date={cell.date}
            day={cell.day}
            isCurrentMonth={cell.isCurrentMonth}
            leaves={leaves}
            holidays={holidays}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

export const LeaveCalendarPanel: React.FC<LeaveCalendarPanelProps> = ({
  leaves,
  holidays,
  viewMode,
  referenceDate,
  onViewModeChange,
  onReferenceDateChange,
}) => {
  const periodLabel = getCalendarPeriodLabel(referenceDate, viewMode);

  const handleNavigate = (direction: -1 | 1) => {
    onReferenceDateChange(shiftReferenceDate(referenceDate, viewMode, direction));
  };

  return (
    <div className="wn-card p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h3 className="text-xs font-bold text-slate-700 font-medium flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-wn-secondary" />
          <span>Leave & Holiday Calendar</span>
        </h3>

        <div className="flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onViewModeChange(option.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                viewMode === option.id
                  ? 'bg-wn-secondary text-white border-blue-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-blue-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
        <button
          type="button"
          onClick={() => handleNavigate(-1)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors"
          aria-label="Previous period"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-900">{periodLabel}</span>
        <button
          type="button"
          onClick={() => handleNavigate(1)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors"
          aria-label="Next period"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {viewMode === 'month' && (
        <MonthGrid
          year={referenceDate.getFullYear()}
          month={referenceDate.getMonth()}
          leaves={leaves}
          holidays={holidays}
        />
      )}

      {viewMode === 'quarter' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getQuarterMonths(referenceDate).map((monthDate) => (
            <div
              key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
              className="bg-slate-50/50 border border-slate-200 rounded-xl p-3"
            >
              <MonthGrid
                year={monthDate.getFullYear()}
                month={monthDate.getMonth()}
                leaves={leaves}
                holidays={holidays}
                compact
              />
            </div>
          ))}
        </div>
      )}

      {viewMode === 'year' && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {getYearMonths(referenceDate).map((monthDate) => (
            <div
              key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
              className="bg-slate-50/50 border border-slate-200 rounded-xl p-2.5"
            >
              <MonthGrid
                year={monthDate.getFullYear()}
                month={monthDate.getMonth()}
                leaves={leaves}
                holidays={holidays}
                compact
                showHeader
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-[11px] text-slate-700 pt-3 border-t border-slate-200">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-wn-secondary" />
          <span>Today</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Approved / Pending Leave</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Company Holiday</span>
        </span>
      </div>
    </div>
  );
};

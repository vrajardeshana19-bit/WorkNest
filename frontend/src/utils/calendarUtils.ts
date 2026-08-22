import type { Holiday, LeaveRequest } from '../types';

export type CalendarViewMode = 'month' | 'quarter' | 'year';

export interface CalendarDayCell {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatQuarterLabel(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

export function formatYearLabel(date: Date): string {
  return `${date.getFullYear()}`;
}

export function getMonthGrid(year: number, month: number): CalendarDayCell[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarDayCell[] = [];

  for (let i = 0; i < startOffset; i += 1) {
    const d = new Date(year, month, -startOffset + i + 1);
    cells.push({ date: d, day: d.getDate(), isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), day, isCurrentMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - startOffset - daysInMonth + 1;
    const d = new Date(year, month + 1, nextDay);
    cells.push({ date: d, day: d.getDate(), isCurrentMonth: false });
  }

  return cells;
}

export function getQuarterMonths(reference: Date): Date[] {
  const quarterStartMonth = Math.floor(reference.getMonth() / 3) * 3;
  return [0, 1, 2].map((offset) => new Date(reference.getFullYear(), quarterStartMonth + offset, 1));
}

export function getYearMonths(reference: Date): Date[] {
  return Array.from({ length: 12 }, (_, i) => new Date(reference.getFullYear(), i, 1));
}

export function shiftReferenceDate(reference: Date, mode: CalendarViewMode, direction: -1 | 1): Date {
  const next = new Date(reference);
  if (mode === 'month') {
    next.setMonth(next.getMonth() + direction);
  } else if (mode === 'quarter') {
    next.setMonth(next.getMonth() + direction * 3);
  } else {
    next.setFullYear(next.getFullYear() + direction);
  }
  return next;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isDateInLeaveRange(date: Date, leave: LeaveRequest): boolean {
  const start = parseIsoDate(leave.startDate);
  const end = parseIsoDate(leave.endDate);
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function getLeaveForDate(date: Date, leaves: LeaveRequest[]): LeaveRequest | undefined {
  return leaves.find((leave) => isDateInLeaveRange(date, leave));
}

export function getHolidayForDate(date: Date, holidays: Holiday[]): Holiday | undefined {
  const key = toDateKey(date);
  return holidays.find((holiday) => holiday.date === key);
}

export function getCalendarPeriodLabel(reference: Date, mode: CalendarViewMode): string {
  if (mode === 'month') return formatMonthYear(reference);
  if (mode === 'quarter') return formatQuarterLabel(reference);
  return formatYearLabel(reference);
}

export { MONTH_NAMES, DAY_NAMES };

import type { Holiday } from '../types';
import { apiFetch } from './httpClient';

interface BackendHoliday {
  id: string;
  name: string;
  date: string;
  description: string | null;
}

function weekdayLabel(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
}

function mapHoliday(record: BackendHoliday): Holiday {
  return {
    id: record.id,
    name: record.name,
    date: record.date,
    day: weekdayLabel(record.date),
    isOptional: false,
  };
}

export async function listHolidays(year?: number): Promise<Holiday[]> {
  const query = year ? `?year=${year}` : '';
  const records = await apiFetch<BackendHoliday[]>(`/holidays${query}`);
  return records.map(mapHoliday).sort((a, b) => a.date.localeCompare(b.date));
}

export async function listUpcomingHolidays(limit = 6): Promise<Holiday[]> {
  const today = new Date().toISOString().split('T')[0];
  const holidays = await listHolidays(new Date().getFullYear());
  return holidays.filter((holiday) => holiday.date >= today).slice(0, limit);
}

export interface CreateHolidayPayload {
  name: string;
  date: string;
  description?: string;
}

export async function createHoliday(payload: CreateHolidayPayload): Promise<Holiday> {
  const record = await apiFetch<BackendHoliday>('/holidays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.name,
      date: payload.date,
      description: payload.description ?? null,
    }),
  });
  return mapHoliday(record);
}

export async function deleteHoliday(holidayId: string): Promise<void> {
  await apiFetch(`/holidays/${holidayId}`, { method: 'DELETE' });
}

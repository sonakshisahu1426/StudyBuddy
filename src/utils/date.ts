import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from 'date-fns';

/**
 * Returns today's date formatted as YYYY-MM-DD in local browser time.
 * Prevents UTC timezone drift issues where UTC midnight is yesterday or tomorrow locally.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Noon prevents DST shifts
}

export function formatReadableDate(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? parseLocalDateString(dateInput) : dateInput;
    return format(d, 'EEEE, MMMM d, yyyy');
  } catch {
    return String(dateInput);
  }
}

export function formatShortDate(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? parseLocalDateString(dateInput) : dateInput;
    return format(d, 'MMM d');
  } catch {
    return String(dateInput);
  }
}

export function isDateToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

export function isDateOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = getTodayDateString();
  return dateStr < today;
}

export function getGreetingForTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
};

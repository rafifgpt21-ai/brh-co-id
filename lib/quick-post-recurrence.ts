export const MAX_RECURRING_AGENDA_OCCURRENCES = 200;
export const MAX_RECURRING_AGENDA_RANGE_DAYS = 730;

export type RecurrenceError = "invalid-range" | "range-too-long" | "too-many";

export type RecurringAgendaDatesResult = {
  dates: string[];
  error?: RecurrenceError;
};

function parseCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatCalendarDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getRecurringAgendaDates(
  startDate: string,
  endDate: string,
  weekdays: readonly number[],
): RecurringAgendaDatesResult {
  const start = parseCalendarDate(startDate);
  const end = parseCalendarDate(endDate);
  if (!start || !end || end < start) return { dates: [], error: "invalid-range" };

  const rangeDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (rangeDays > MAX_RECURRING_AGENDA_RANGE_DAYS) {
    return { dates: [], error: "range-too-long" };
  }

  const selectedWeekdays = new Set(
    weekdays.filter((weekday) => Number.isInteger(weekday) && weekday >= 0 && weekday <= 6),
  );
  const dates: string[] = [];

  for (let offset = 0; offset < rangeDays; offset += 1) {
    const date = new Date(start.getTime() + offset * 86_400_000);
    if (!selectedWeekdays.has(date.getUTCDay())) continue;

    dates.push(formatCalendarDate(date));
    if (dates.length > MAX_RECURRING_AGENDA_OCCURRENCES) {
      return { dates, error: "too-many" };
    }
  }

  return { dates };
}

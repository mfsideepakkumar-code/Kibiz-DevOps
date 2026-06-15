// Week math for timesheets / goal sheet. Weeks start Monday
// (company_config.work_week_start default 'monday'). UTC-based, consistent with
// the timer/goal date handling (see the company-timezone open question).

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday (week_start) of the week containing `date`. */
export function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

export function weekEnd(weekStart: string): string {
  return addDays(weekStart, 6);
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** The N most recent week_start dates, newest first, including the week of `from`. */
export function recentWeeks(from: string, count: number): string[] {
  const start = mondayOf(from);
  return Array.from({ length: count }, (_, i) => addDays(start, -7 * i));
}

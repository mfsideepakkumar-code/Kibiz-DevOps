// Pure timer math (no I/O). A web timer captures start/end; on stop the elapsed
// span is turned into one or more time entries (CLAUDE.md rule 10):
//  · a span crossing midnight splits into one entry per day (DB/server level)
//  · a span over 12h is capped at 12h (auto-stop) and flagged for review
//  · a span under 1 minute is discarded (spec §TIME ENTRIES)
//
// NOTE (open question): midnight boundaries use UTC here. Correct local-day
// splitting needs a company timezone — company_config has no tz field yet.
// Flagged in TASKS.md; revisit when a tz config lands.

export const TWELVE_HOURS_MINUTES = 12 * 60;

export type TimerSegment = {
  workDate: string; // YYYY-MM-DD (UTC)
  startIso: string;
  endIso: string;
  minutes: number;
};

function utcDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

export function computeTimerSegments(
  start: Date,
  end: Date,
  maxMinutes: number = TWELVE_HOURS_MINUTES,
): { segments: TimerSegment[]; autoStopped: boolean } {
  const totalMs = end.getTime() - start.getTime();
  // Under one minute → discarded entirely.
  if (totalMs < 60_000) return { segments: [], autoStopped: false };

  let effectiveEnd = end;
  let autoStopped = false;
  if (totalMs > maxMinutes * 60_000) {
    effectiveEnd = new Date(start.getTime() + maxMinutes * 60_000);
    autoStopped = true;
  }

  const segments: TimerSegment[] = [];
  let segStart = start;
  while (segStart < effectiveEnd) {
    const nextMidnight = new Date(
      Date.UTC(
        segStart.getUTCFullYear(),
        segStart.getUTCMonth(),
        segStart.getUTCDate() + 1,
        0,
        0,
        0,
        0,
      ),
    );
    const segEnd = nextMidnight < effectiveEnd ? nextMidnight : effectiveEnd;
    const minutes = Math.round((segEnd.getTime() - segStart.getTime()) / 60_000);
    if (minutes >= 1) {
      segments.push({
        workDate: utcDateString(segStart),
        startIso: segStart.toISOString(),
        endIso: segEnd.toISOString(),
        minutes,
      });
    }
    segStart = segEnd;
  }
  return { segments, autoStopped };
}

/** Seconds → "HH:MM:SS" (hours may exceed 24). */
export function formatElapsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

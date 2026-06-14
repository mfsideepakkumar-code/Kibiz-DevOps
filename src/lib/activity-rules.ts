// Pure validation rules for time entries (Activities). Duration-first, raw
// minutes (schema.md / spec §TIME ENTRIES). The DB has the hard CHECKs
// (duration_minutes > 0, billable requires description); these mirror them for
// friendly client/server messages before the round-trip.

export function toMinutes(
  hours: number | null | undefined,
  minutes: number | null | undefined,
): number {
  return Math.round((hours ?? 0) * 60 + (minutes ?? 0));
}

export function splitMinutes(total: number): { hours: number; minutes: number } {
  const whole = Math.max(0, Math.round(total));
  return { hours: Math.floor(whole / 60), minutes: whole % 60 };
}

export function activityValidationError(input: {
  durationMinutes: number;
  billable: boolean;
  description: string | null | undefined;
  hasTask: boolean;
}): string | null {
  const { durationMinutes, billable, description, hasTask } = input;
  // Minimum 1 minute; under a minute is discarded (spec). Manual entries never
  // create sub-minute rows.
  if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
    return "Duration must be at least 1 minute.";
  }
  // Description required on billable = true, and on project-level entries
  // (task_id null) regardless of billable.
  const needsDescription = billable || !hasTask;
  if (needsDescription && !description?.trim()) {
    return billable
      ? "A description is required for billable time."
      : "A description is required when logging to a project without a task.";
  }
  return null;
}

// States in which the entry owner may still edit/delete (Gate 2 not yet passed).
export const EDITABLE_STATES = ["draft", "rejected"] as const;

export function isOwnerEditable(state: string): boolean {
  return (EDITABLE_STATES as readonly string[]).includes(state);
}

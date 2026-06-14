# fm-activity-reference.md — observed FileMaker Activity__Web structure

Reference only (from a stakeholder-supplied Activity__Web report export, 2026-06-14).
Confirms how time entries live in FileMaker today; informs P1-08 (Activities) and
P1-15 (WF-009 sync). The authoritative sync contract is schema.md §FM Sync — this
doc just records the source-of-truth shape we are syncing into.

## Observed per-record columns
- Billed (flag) — invoiced yet or not → maps to our time_entries.state = 'billed'
- Date_Act (date) — the activity/work date → time_entries.work_date
- Exported, Exported_Date — accounting export flag/date (NOT our FM sync; likely the
  QuickBooks/accounting export path — C-2 is blocked, do not build against this)
- Hours (DECIMAL hours, e.g. 2.6, 0.5, 0.33, 4.5) — FileMaker stores decimal hours.
  We store raw integer MINUTES; WF-009 sends MILLISECONDS (minutes × 60000) and the
  FM script divides by 3,600,000 (ADR-020). Do not send decimal hours.
- Notes (free text) — the work description → time_entries.description.
  REMINDER (schema.md, intentional swap): our description → FM $Description (Notes),
  our task title (Summary) → FM $BillingNotes. Do not "fix" the swap.
- Project_Name, StaffName, TicketName — DENORMALIZED display strings in FM.
- ProjectID (e.g. 10094, 62, 141) — FM project key (FM "ID_Project").
- StaffID (e.g. 1004, 1062) — FM internal staff key. WF-009 resolves staff by
  Staff::Email_ClickUp = our user email/fm_email, NOT by this numeric id.
- TicketID — FM ticket key → tickets.fm_ticket_id (written back on ticket.approved).
- Sum/total columns (e.g. 2522.8, 6047.14, and a constant 3524.34 across rows) are
  report SUMMARY/aggregate fields, not per-record data — ignore for the record shape.

## Takeaways for our build
- Our time_entries schema already covers this: work_date, duration_minutes (raw),
  description, denormalized project_id/ticket_id, user_id, state, fm_sync_status.
- StaffID/ProjectID/TicketID are FM-internal numeric keys; our sync maps by
  email (staff) and fm_client_id / fm_ticket_id (project/ticket) — already in schema.
- "Exported" ≠ our fm_sync_status. Keep accounting export out of scope (C-2).

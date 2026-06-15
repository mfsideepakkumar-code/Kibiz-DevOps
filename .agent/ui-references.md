# ui-references.md — Approved UI Reference Baselines

Per the CLAUDE.md UI standard, every UI task must be checked against an approved
reference screen before it can be marked done. This file is the register of
approved baselines. When no prior reference exists, the first stakeholder-approved
implementation becomes the reference for that screen and all screens that reuse
its layout pattern.

| Screen | Route | Spec | Approved | Approver | Reference |
| --- | --- | --- | --- | --- | --- |
| Clients & Projects (single-screen admin) | `/admin/clients` | FR-17.10 · ADR-025 | 2026-06-14 | Stakeholder (Deepak) | Implementation at commit `88622d3` (P1-05) |
| Client Pricing | `/admin/pricing` | screen inventory · security.md | 2026-06-14 | inherits admin pattern | P1-06 |
| Tickets list + detail | `/tickets`, `/tickets/[id]` | screen inventory (Tickets, Ticket Detail) | PENDING | — | P1-07, built from spec |
| Operations Queue | `/ops-queue` | screen inventory (Operations Queue) | PENDING | — | P1-07, built from spec |

## Notes

- **Clients & Projects** establishes the canonical single-screen admin pattern
  (left nav · vertical tabs · right contextual sidebar; slide-over edits; no
  page-hops/modal-chains). Subsequent admin screens that reuse this pattern
  (e.g. P1-06 Client Pricing surfaces) inherit this approval and are checked
  against it.
- Screenshot capture of the authenticated screen is deferred until email login
  is re-enabled in Supabase (see P1-05 ACTION REQUIRED in TASKS.md). The
  approved baseline in the meantime is the spec (FR-17.10/ADR-025) + the merged
  implementation at the commit above.

## App shell & theme baseline (2026-06-15)

Stakeholder directed "match the prototype." The global chrome is now the approved baseline:
- Left **sidebar** app shell (white) with grouped nav (Work / Manage / Insights / Admin), lucide icons, indigo active state; top bar carries the live timer; sign-out in the sidebar footer.
- **Indigo** primary/accent, white cards on a light cool-gray background, soft card shadows, pill status badges, monospace/tabular time — matching ki-b-iz-dev-ops.vercel.app.
- All values via design tokens (globals.css); two font weights (400/500) retained; semantic status palette unchanged.
- This supersedes the earlier "pending" notes for /tickets, /ops-queue, etc. — those screens inherit the approved shell/theme.

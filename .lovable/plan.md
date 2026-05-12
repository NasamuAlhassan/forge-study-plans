# Forge — Cleanup, Onboarding & Polish Plan

This is large, so I'll ship it in 4 sequential phases. Each phase ends in a working app you can test before I move on.

## Phase 1 — Demo/Real separation + bug fixes (foundation)

Goal: a real account is empty and honest; the landing page demo stays flashy.

- **Strict demo gating**: Remove every `EVENTS`/`SUBJECTS` fallback inside authenticated routes (`dashboard.index`, `dashboard.calendar`, `dashboard.analytics`, `WeekCalendar`, etc.). Demo data only renders inside landing page components.
- **Empty states**: Build reusable `<EmptyState>` for Calendar, Analytics, Study Plan, Today's Agenda, Upcoming Tasks — each with a clear CTA ("Add event", "Add courses", "Generate plan").
- **Real streak**: Add `study_sessions` table (user_id, started_at, ended_at, completed). Replace hardcoded streak in `StatsGrid` with a `useStreak()` hook computing real consecutive days. New accounts show 0.
- **Fix Analytics Y-axis**: Clamp `domain={[0, 'auto']}` on the "Hours per day" chart and stop allowing negative values.
- **Fix broken buttons**:
  - `AIRecommendations` → "Regenerate" calls a new `regenerateRecommendations` server fn using real events.
  - `TodaysAgenda` → "View week" `<Link to="/dashboard/calendar">`.
- **Remove default seed plans**: Audit `dashboard.study-plan.tsx` and signup flow for any auto-insert; remove.

## Phase 2 — Onboarding, Settings, manual event entry

- **Onboarding wizard** (`/onboarding`, gated after first login if profile incomplete):
  1. Welcome
  2. Add courses (name, difficulty, credit hours) — repeatable rows
  3. Optional: import timetable / skip
  4. Done → dashboard
- **Schema**: add `difficulty` and `credit_hours` already exists on `subjects`; add `difficulty text` column. Add `profiles.onboarded_at`.
- **Settings page** (`/dashboard/settings`):
  - Profile (display name, university, major)
  - Courses (CRUD list, "New Semester" → wipes subjects + events with confirmation)
  - Notification preferences
  - Theme
- **Manual "Add event" dialog**: New `AddEventDialog` with title, course (from subjects), day, start/end, type, recurrence (none / weekly / daily). Add buttons on Calendar and Study Plan pages.
- **No-clash logic**: Helper `findConflicts(newEvent, existingEvents)`. AI plan generation + timetable import skip or flag conflicts. Manual add shows warning + "save anyway".
- **Recurrence scope prompt**: When editing a recurring event, ask "Only today / This week / All future".
- **Duplicate week button** on Calendar with confirm dialog.
- **Empty Analytics with course placeholders**: Show one card per subject with "0h logged" until real sessions exist.

## Phase 3 — Floating Ask Forge, Notifications, Focus Mode, Export

- **Floating Ask Forge**: Remove `/dashboard/ask` route from sidebar/mobile nav. Add `<AskForgeFloating>` mounted in dashboard layout — bottom-right FAB → slide-up `Sheet` chat panel. Reuses existing `askForge` server fn.
- **Notifications system**:
  - `useNotifications()` hook scans events every minute → fires sonner toasts (10-min pre-class, missed-session w/ reschedule action, morning summary at first load of day, streak milestones).
  - Notification bell in `Topbar` with unread count → dropdown history panel (stored in `notifications` table).
  - Toasts: bottom-right, 6s auto-dismiss, closeable (sonner config).
- **Focus Mode**: Full-screen overlay on session start. Countdown, subject name, pulsing bg. Pomodoro toggle (25/5). Strict mode = `beforeunload` + route block via TanStack `blocker`. Pause/End controls. On end → insert into `study_sessions` (drives streak + analytics).
- **Export**:
  - PDF: render calendar to PDF via `jspdf` + `html2canvas` or react-to-pdf.
  - ICS: generate `.ics` strings for events, downloadable.

## Phase 4 — Mobile polish

- Replace dashboard sidebar with bottom tab bar at `< md`.
- Audit Calendar (touch DnD via `react-big-calendar` touch backend), Analytics (stack charts), Study Plan, Onboarding for overflow / fixed widths.
- Verify on 390px viewport.

## Technical notes

- **DB migrations needed** (Phase 1 + 2):
  - `study_sessions` table (id, user_id, subject_id, started_at, ended_at, duration_min, completed) + RLS
  - `notifications` table (id, user_id, type, title, body, read_at, created_at) + RLS
  - `subjects.difficulty text` column
  - `profiles.onboarded_at timestamptz`
- **No new external services** — uses existing Lovable Cloud + Lovable AI.
- **Files touched**: ~25 across phases. No business logic ripped out without replacement.

---

**Recommendation: start with Phase 1** — it's the most important (real users currently see fake data) and unblocks everything else. Approve and I'll ship it, then check in before Phase 2.
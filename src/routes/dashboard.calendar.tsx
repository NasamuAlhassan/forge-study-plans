import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Topbar } from "@/components/dashboard/Topbar";
import { WeekCalendar } from "@/components/dashboard/WeekCalendar";
import { SessionEditDialog, type EditableSession } from "@/components/dashboard/SessionEditDialog";
import {
  useSchedule,
  updateEvent,
  deleteEvent,
  dayToIndex,
  timeToMinutes,
  minutesToTime,
  indexToDay,
} from "@/hooks/use-schedule";
import type { EventBlock } from "@/lib/demo-data";

export const Route = createFileRoute("/dashboard/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { events, subjects, hasData, refetch } = useSchedule();
  const [editing, setEditing] = useState<EventBlock | null>(null);
  const props = hasData ? { events, subjects } : {};

  const intensityFromNotes = (n?: string | null): EditableSession["intensity"] =>
    n === "deep" || n === "moderate" || n === "light" ? n : "moderate";

  const initial: EditableSession | null = editing
    ? {
        day: indexToDay(editing.day),
        start: minutesToTime(editing.start),
        end: minutesToTime(editing.end),
        subject: subjects.find((s) => s.id === editing.subjectId)?.name ?? editing.title,
        focus: editing.title,
        intensity: intensityFromNotes((editing as EventBlock & { notes?: string }).notes),
      }
    : null;

  return (
    <>
      <Topbar
        title="Calendar"
        subtitle={hasData ? "Click any block to edit it." : "Sample week — import a timetable to see your own."}
      />
      <main className="p-6">
        <WeekCalendar
          {...props}
          onEventClick={(e) => hasData && setEditing(e)}
        />
      </main>

      <SessionEditDialog
        open={!!editing}
        initial={initial}
        title="Edit calendar block"
        onClose={() => setEditing(null)}
        onSave={async (updated) => {
          if (!editing) return;
          try {
            await updateEvent(editing.id, {
              title: updated.focus || updated.subject,
              day_of_week: dayToIndex(updated.day),
              start_minute: timeToMinutes(updated.start),
              end_minute: timeToMinutes(updated.end),
              notes: updated.intensity,
            });
            await refetch();
            toast.success("Calendar updated");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update");
          }
        }}
        onDelete={async () => {
          if (!editing) return;
          try {
            await deleteEvent(editing.id);
            await refetch();
            toast.success("Block removed");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete");
          }
        }}
      />
    </>
  );
}

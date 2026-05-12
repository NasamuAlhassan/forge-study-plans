import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Topbar } from "@/components/dashboard/Topbar";
import { BigCalendar, type BigCalendarChange } from "@/components/dashboard/BigCalendar";
import { SessionEditDialog, type EditableSession } from "@/components/dashboard/SessionEditDialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useSchedule, updateEvent, deleteEvent, dayToIndex,
  timeToMinutes, minutesToTime, indexToDay, deleteAllEvents,
} from "@/hooks/use-schedule";
import { useAuth } from "@/hooks/use-auth";
import type { EventBlock } from "@/lib/demo-data";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CalendarPlus } from "lucide-react";

export const Route = createFileRoute("/dashboard/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { user } = useAuth();
  const { events, subjects, hasData, refetch } = useSchedule();
  const [editing, setEditing] = useState<EventBlock | null>(null);

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

  const handleChange = async (c: BigCalendarChange) => {
    if (!hasData) return;
    try {
      await updateEvent(c.eventId, {
        day_of_week: c.day_of_week,
        start_minute: c.start_minute,
        end_minute: c.end_minute,
      });
      await refetch();
      toast.success("Moved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to move");
    }
  };

  const handleResetAll = async () => {
    if (!user) return;
    try {
      await deleteAllEvents(user.id);
      await refetch();
      toast.success("Calendar cleared");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to clear");
    }
  };

  return (
    <>
      <Topbar
        title="Calendar"
        subtitle={hasData ? "Drag blocks to reschedule. Click to edit." : "Empty calendar — add an event or import a timetable to begin."}
      />
      <main className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasData && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300">
                  <Trash2 className="h-4 w-4 mr-1" /> Reset calendar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-400" /> Clear all events?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes every block on your calendar. You can re-import your timetable or generate a new plan afterwards.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAll} className="bg-rose-500 hover:bg-rose-600">
                    Yes, clear everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {hasData ? (
          <BigCalendar
            events={events}
            subjects={subjects}
            onChange={handleChange}
            onSelectEvent={(e) => setEditing(e)}
          />
        ) : (
          <EmptyState
            icon={CalendarPlus}
            title="No events yet"
            description="Import a timetable, generate a study plan, or add events manually to fill your week."
            ctaLabel="Import timetable"
            ctaTo="/dashboard/import"
          />
        )}
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

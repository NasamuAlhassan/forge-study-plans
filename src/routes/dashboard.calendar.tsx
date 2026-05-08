import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/dashboard/Topbar";
import { WeekCalendar } from "@/components/dashboard/WeekCalendar";
import { useSchedule } from "@/hooks/use-schedule";

export const Route = createFileRoute("/dashboard/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { events, subjects, hasData } = useSchedule();
  const props = hasData ? { events, subjects } : {};
  return (
    <>
      <Topbar title="Calendar" subtitle={hasData ? "Your live weekly schedule." : "Sample week — import a timetable to see your own."} />
      <main className="p-6">
        <WeekCalendar {...props} />
      </main>
    </>
  );
}

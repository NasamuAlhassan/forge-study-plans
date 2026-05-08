import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/dashboard/Topbar";
import { WeekCalendar } from "@/components/dashboard/WeekCalendar";

export const Route = createFileRoute("/dashboard/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <>
      <Topbar title="Calendar" subtitle="Drag, resize, and color-code your week." />
      <main className="p-6">
        <WeekCalendar />
      </main>
    </>
  );
}

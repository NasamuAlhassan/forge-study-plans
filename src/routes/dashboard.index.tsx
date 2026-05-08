import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/dashboard/Topbar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { TodaysAgenda } from "@/components/dashboard/TodaysAgenda";
import { AIRecommendations } from "@/components/dashboard/AIRecommendations";
import { WeekCalendar } from "@/components/dashboard/WeekCalendar";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  return (
    <>
      <Topbar title="Welcome back, Amara" subtitle="Here's your week at a glance." />
      <main className="p-6 space-y-6">
        <StatsGrid />
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <WeekCalendar />
          <div className="space-y-6">
            <TodaysAgenda />
            <AIRecommendations />
          </div>
        </div>
      </main>
    </>
  );
}

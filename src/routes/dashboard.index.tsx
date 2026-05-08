import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/dashboard/Topbar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { TodaysAgenda } from "@/components/dashboard/TodaysAgenda";
import { AIRecommendations } from "@/components/dashboard/AIRecommendations";
import { WeekCalendar } from "@/components/dashboard/WeekCalendar";
import { useSchedule } from "@/hooks/use-schedule";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const { user } = useAuth();
  const { events, subjects, hasData } = useSchedule();
  const name = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there";

  // Use real data when present, else fall back to the demo schedule for visual richness.
  const calProps = hasData ? { events, subjects } : {};

  return (
    <>
      <Topbar title={`Welcome back, ${name}`} subtitle="Here's your week at a glance." />
      <main className="p-6 space-y-6">
        <StatsGrid />
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <WeekCalendar {...calProps} />
          <div className="space-y-6">
            <TodaysAgenda {...calProps} />
            <AIRecommendations />
          </div>
        </div>
      </main>
    </>
  );
}

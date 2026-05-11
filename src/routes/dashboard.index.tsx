import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/dashboard/Topbar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { TodaysAgenda } from "@/components/dashboard/TodaysAgenda";
import { AIRecommendations } from "@/components/dashboard/AIRecommendations";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { WeeklySummary } from "@/components/dashboard/WeeklySummary";
import { BigCalendar } from "@/components/dashboard/BigCalendar";
import { useSchedule } from "@/hooks/use-schedule";
import { useScheduleStats } from "@/hooks/use-schedule-stats";
import { useAuth } from "@/hooks/use-auth";
import { EVENTS, SUBJECTS } from "@/lib/demo-data";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const { user } = useAuth();
  const { events, subjects, hasData } = useSchedule();
  const name = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there";

  const dEvents = hasData ? events : EVENTS;
  const dSubjects = hasData ? subjects : SUBJECTS;
  const stats = useScheduleStats(dEvents, dSubjects);

  return (
    <>
      <Topbar title={`Welcome back, ${name}`} subtitle="Here's your week at a glance." />
      <main className="p-4 sm:p-6 space-y-6">
        <StatsGrid />

        <WeeklySummary
          totalStudyHours={stats.totalStudyHours}
          consistency={stats.consistency}
          completed={stats.completed}
          sessionsTotal={stats.sessionsTotal}
          todayBlocks={stats.todayBlocks}
          todayHours={stats.todayHours}
          trend={stats.trend}
        />

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <BigCalendar events={dEvents} subjects={dSubjects} />
          <div className="space-y-6">
            <TodaysAgenda events={dEvents} subjects={dSubjects} />
            <UpcomingTasks items={stats.upcoming} subjects={dSubjects} />
            <AIRecommendations />
          </div>
        </div>
      </main>
    </>
  );
}

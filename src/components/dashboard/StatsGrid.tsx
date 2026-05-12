import { useState, useMemo } from "react";
import { ArrowUpRight, Brain, Clock, Flame, Target, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useSchedule } from "@/hooks/use-schedule";
import { useScheduleStats } from "@/hooks/use-schedule-stats";
import { useStreak } from "@/hooks/use-streak";

type Stat = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  accent: string;
  detail: {
    headline: string;
    summary: string;
    insights: string[];
    series: Array<{ d: string; v: number }>;
    seriesLabel: string;
  };
};

export function StatsGrid() {
  const [open, setOpen] = useState<Stat | null>(null);
  const { events, subjects } = useSchedule();
  const stats = useScheduleStats(events, subjects);
  const { streak, totalSessions } = useStreak();

  const data: Stat[] = useMemo(() => {
    const completionPct = stats.sessionsTotal > 0
      ? Math.round((stats.completed / stats.sessionsTotal) * 100)
      : 0;
    const focusScore = totalSessions === 0
      ? 0
      : Math.min(100, Math.round((stats.consistency * 0.6) + (completionPct * 0.4)));

    return [
      {
        label: "Study hours this week",
        value: `${stats.totalStudyHours}h`,
        delta: stats.totalStudyHours > 0 ? `${stats.todayHours}h today` : "Add a session",
        icon: Clock,
        accent: "from-indigo-500 to-purple-500",
        detail: {
          headline: stats.totalStudyHours > 0
            ? `You've logged ${stats.totalStudyHours}h of focused work this week`
            : "No study time logged yet",
          summary: stats.totalStudyHours > 0
            ? "Keep blocks short, frequent, and tied to a clear goal."
            : "Start a focus session from the calendar to begin building your data.",
          insights: [],
          seriesLabel: "Hours per day",
          series: stats.perDay.map((p) => ({ d: p.d, v: p.h })),
        },
      },
      {
        label: "Streak",
        value: streak === 1 ? "1 day" : `${streak} days`,
        delta: streak > 0 ? "Keep it alive" : "Start today",
        icon: Flame,
        accent: "from-amber-500 to-rose-500",
        detail: {
          headline: streak > 0 ? `${streak}-day streak` : "No streak yet",
          summary: streak > 0
            ? "A streak is consecutive days with at least one completed study session."
            : "Complete one focus session today to start your streak.",
          insights: [],
          seriesLabel: "Daily activity",
          series: stats.perDay.map((p) => ({ d: p.d, v: p.h > 0 ? 1 : 0 })),
        },
      },
      {
        label: "Focus score",
        value: `${focusScore}`,
        delta: focusScore > 0 ? `${stats.consistency}% consistency` : "—",
        icon: Target,
        accent: "from-blue-500 to-cyan-500",
        detail: {
          headline: focusScore > 0 ? "Composite of consistency + completion" : "Not enough data yet",
          summary: "Focus score blends how often you study and how reliably you complete planned sessions.",
          insights: [],
          seriesLabel: "Hours per day",
          series: stats.perDay.map((p) => ({ d: p.d, v: p.h })),
        },
      },
      {
        label: "Sessions completed",
        value: stats.sessionsTotal === 0 ? "0" : `${stats.completed} / ${stats.sessionsTotal}`,
        delta: stats.sessionsTotal === 0 ? "No sessions planned" : `${completionPct}%`,
        icon: Brain,
        accent: "from-violet-500 to-fuchsia-500",
        detail: {
          headline: stats.sessionsTotal === 0 ? "No planned sessions" : "Adherence to your plan",
          summary: stats.sessionsTotal === 0
            ? "Generate a study plan or add study blocks to track adherence."
            : `You've completed ${stats.completed} of ${stats.sessionsTotal} planned sessions.`,
          insights: [],
          seriesLabel: "Hours per day",
          series: stats.perDay.map((p) => ({ d: p.d, v: p.h })),
        },
      },
    ];
  }, [stats, streak, totalSessions]);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setOpen(s)}
            className="ring-gradient glass rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center justify-between">
              <div className={cn("h-9 w-9 rounded-lg bg-gradient-to-br grid place-items-center shadow-glow", s.accent)}>
                <s.icon className="h-4 w-4 text-white" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 text-2xl font-semibold font-display">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-[11px] text-primary-glow">{s.delta}</div>
          </button>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-xl">
          {open && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br grid place-items-center shadow-glow", open.accent)}>
                    <open.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="font-display text-xl">{open.label}</DialogTitle>
                    <DialogDescription className="text-primary-glow">
                      {open.value} · {open.delta}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div>
                <p className="text-sm font-medium">{open.detail.headline}</p>
                <p className="mt-1 text-sm text-muted-foreground">{open.detail.summary}</p>
              </div>

              <div className="ring-gradient glass rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-1">{open.detail.seriesLabel}</div>
                <div className="h-40">
                  <ResponsiveContainer>
                    <AreaChart data={open.detail.series}>
                      <defs>
                        <linearGradient id="statg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.74 0.19 295)" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="oklch(0.62 0.21 285)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                      <XAxis dataKey="d" stroke="currentColor" fontSize={11} />
                      <YAxis stroke="currentColor" fontSize={11} domain={[0, 'auto']} allowDataOverflow={false} />
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }} />
                      <Area type="monotone" dataKey="v" stroke="oklch(0.74 0.19 295)" strokeWidth={2} fill="url(#statg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

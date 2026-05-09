import { useState } from "react";
import { ArrowUpRight, Brain, Clock, Flame, Target, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const stats: Stat[] = [
  {
    label: "Study hours this week",
    value: "18.5h",
    delta: "+4.2h",
    icon: Clock,
    accent: "from-indigo-500 to-purple-500",
    detail: {
      headline: "You're 29% above your weekly average",
      summary:
        "Your strongest day was Thursday (4.1h). Mornings remain your most productive window — 62% of your hours happened before 1pm.",
      insights: [
        "Best focus block: Thu 9–11am (deep work, Calculus)",
        "Lowest day: Sun (0.4h) — consider a light catch-up session",
        "Recommended target next week: 20h with one rest day",
      ],
      seriesLabel: "Hours per day",
      series: [
        { d: "Mon", v: 2.5 }, { d: "Tue", v: 3.2 }, { d: "Wed", v: 1.8 },
        { d: "Thu", v: 4.1 }, { d: "Fri", v: 2.9 }, { d: "Sat", v: 3.6 }, { d: "Sun", v: 0.4 },
      ],
    },
  },
  {
    label: "Streak",
    value: "12 days",
    delta: "Personal best",
    icon: Flame,
    accent: "from-amber-500 to-rose-500",
    detail: {
      headline: "Longest consistency streak yet",
      summary:
        "You've completed at least one focused session every day for 12 days. Streaks beyond 14 days correlate with a 35% boost in retention.",
      insights: [
        "Risk window: Sunday evenings — schedule a 30-min review block",
        "Reward in 2 days: unlock the 'Forge Two-Week' badge",
        "Recovery tip: a 20-min light session still counts",
      ],
      seriesLabel: "Daily check-ins",
      series: [
        { d: "D1", v: 1 }, { d: "D3", v: 1 }, { d: "D5", v: 1 },
        { d: "D7", v: 1 }, { d: "D9", v: 1 }, { d: "D11", v: 1 }, { d: "D12", v: 1 },
      ],
    },
  },
  {
    label: "Focus score",
    value: "92",
    delta: "+6 vs last week",
    icon: Target,
    accent: "from-blue-500 to-cyan-500",
    detail: {
      headline: "Top decile of Forge users",
      summary:
        "Focus score blends session completion, distraction-free minutes, and break adherence. You're trending up sharply this week.",
      insights: [
        "Distraction-free ratio: 87% (target ≥ 80%)",
        "Break adherence: 94% — you're respecting your Pomodoros",
        "Suggested next step: try a 50/10 cycle for deep Calc work",
      ],
      seriesLabel: "Focus score per day",
      series: [
        { d: "Mon", v: 84 }, { d: "Tue", v: 88 }, { d: "Wed", v: 79 },
        { d: "Thu", v: 95 }, { d: "Fri", v: 91 }, { d: "Sat", v: 96 }, { d: "Sun", v: 92 },
      ],
    },
  },
  {
    label: "AI sessions completed",
    value: "23 / 28",
    delta: "82%",
    icon: Brain,
    accent: "from-violet-500 to-fuchsia-500",
    detail: {
      headline: "Strong adherence to the AI plan",
      summary:
        "Of the 28 study sessions Forge generated for you this week, you completed 23. Skipped sessions were mostly evening Linear Algebra blocks.",
      insights: [
        "Skipped pattern: Tue/Thu after 7pm — energy dips",
        "Forge will rebalance LinAlg to morning slots next week",
        "Completion >85% historically lifts grades by ~half a letter",
      ],
      seriesLabel: "Sessions completed",
      series: [
        { d: "Mon", v: 4 }, { d: "Tue", v: 3 }, { d: "Wed", v: 4 },
        { d: "Thu", v: 3 }, { d: "Fri", v: 4 }, { d: "Sat", v: 3 }, { d: "Sun", v: 2 },
      ],
    },
  },
];

export function StatsGrid() {
  const [open, setOpen] = useState<Stat | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
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
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
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
                      <YAxis stroke="currentColor" fontSize={11} />
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }} />
                      <Area type="monotone" dataKey="v" stroke="oklch(0.74 0.19 295)" strokeWidth={2} fill="url(#statg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">AI insights</div>
                <ul className="space-y-2">
                  {open.detail.insights.map((i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary-glow">•</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

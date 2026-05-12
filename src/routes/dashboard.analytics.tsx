import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useSchedule } from "@/hooks/use-schedule";
import { useScheduleStats } from "@/hooks/use-schedule-stats";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

const PIE_COLORS = [
  "oklch(0.62 0.21 285)", "oklch(0.74 0.19 295)", "oklch(0.62 0.18 230)",
  "oklch(0.78 0.16 215)", "oklch(0.65 0.18 165)", "oklch(0.74 0.18 60)",
];

function AnalyticsPage() {
  const { events, subjects, hasData } = useSchedule();
  const stats = useScheduleStats(events, subjects);

  // Course placeholders: always show one card per subject, even with 0 hours
  const subjectCards = subjects.length > 0
    ? subjects.map((s) => {
        const hit = stats.perSubject.find((p) => p.s === s.name);
        return { s: s.name, h: hit?.h ?? 0 };
      })
    : stats.perSubject;

  const consistencyData = stats.perDay.map((d) => ({
    d: d.d, consistent: d.h >= 1 ? 1 : 0, hours: d.h,
  }));

  const sessionData = [
    { k: "Completed", v: stats.completed },
    { k: "Missed", v: stats.missed },
    { k: "Pending", v: Math.max(0, stats.sessionsTotal - stats.completed - stats.missed) },
  ];

  return (
    <>
      <Topbar title="Analytics" subtitle="Your focus, consistency & study trends." />
      <main className="p-4 sm:p-6 space-y-6">
        <StatsGrid />

        {!hasData && subjects.length === 0 && (
          <EmptyState
            icon={BarChart3}
            title="No analytics yet"
            description="Add your courses and start logging study sessions — your charts will fill in as you go."
            ctaLabel="Add courses"
            ctaTo="/dashboard/calendar"
          />
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Panel title="Hours per day" subtitle="Combined classes + study">
            <ResponsiveContainer>
              <AreaChart data={stats.perDay}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.74 0.19 295)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.62 0.21 285)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                <XAxis dataKey="d" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} domain={[0, 'auto']} allowDataOverflow={false} />
                <Tooltip contentStyle={tip} />
                <Area type="monotone" dataKey="h" stroke="oklch(0.74 0.19 295)" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Time per subject" subtitle={`${stats.totalStudyHours}h study total`}>
            {subjectCards.length === 0 ? (
              <EmptySmall text="No subjects yet" />
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={subjectCards} dataKey="h" nameKey="s" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {subjectCards.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tip} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <Panel title="Productivity trend" subtitle="Last 4 weeks">
            <ResponsiveContainer>
              <LineChart data={stats.trend}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                <XAxis dataKey="w" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} domain={[0, 'auto']} allowDataOverflow={false} />
                <Tooltip contentStyle={tip} />
                <Line type="monotone" dataKey="h" stroke="oklch(0.78 0.16 215)" strokeWidth={3} dot={{ r: 4, fill: "oklch(0.78 0.16 215)" }} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Sessions completed" subtitle="vs missed and pending">
            <ResponsiveContainer>
              <BarChart data={sessionData}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                <XAxis dataKey="k" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} domain={[0, 'auto']} allowDataOverflow={false} />
                <Tooltip contentStyle={tip} />
                <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                  {sessionData.map((d, i) => (
                    <Cell key={i} fill={d.k === "Missed" ? "oklch(0.62 0.22 25)" : d.k === "Pending" ? "oklch(0.55 0.04 280)" : "oklch(0.62 0.21 285)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Weekly consistency" subtitle={`${stats.consistency}% of days hit your study target`}>
            <ResponsiveContainer>
              <BarChart data={consistencyData}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                <XAxis dataKey="d" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} domain={[0, 1]} ticks={[0, 1]} />
                <Tooltip contentStyle={tip} />
                <Bar dataKey="consistent" radius={[6, 6, 0, 0]}>
                  {consistencyData.map((d, i) => (
                    <Cell key={i} fill={d.consistent ? "oklch(0.65 0.18 165)" : "oklch(0.30 0.02 280)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Subject hours (bar)" subtitle="Top 6 subjects by study time">
            {subjectCards.length === 0 ? (
              <EmptySmall text="Add courses to see this" />
            ) : (
              <ResponsiveContainer>
                <BarChart data={subjectCards} layout="vertical">
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" horizontal={false} />
                  <XAxis type="number" stroke="currentColor" fontSize={12} domain={[0, 'auto']} allowDataOverflow={false} />
                  <YAxis dataKey="s" type="category" stroke="currentColor" fontSize={11} width={80} />
                  <Tooltip contentStyle={tip} />
                  <Bar dataKey="h" fill="oklch(0.62 0.21 285)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>
      </main>
    </>
  );
}

function EmptySmall({ text }: { text: string }) {
  return <div className="h-full grid place-items-center text-sm text-muted-foreground">{text}</div>;
}

const tip = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" };

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="ring-gradient glass rounded-2xl p-5">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="h-64 mt-4">{children}</div>
    </div>
  );
}

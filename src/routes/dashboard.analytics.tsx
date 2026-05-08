import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/dashboard/Topbar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

const weekly = [
  { d: "Mon", h: 2.5 }, { d: "Tue", h: 3.2 }, { d: "Wed", h: 1.8 },
  { d: "Thu", h: 4.1 }, { d: "Fri", h: 2.9 }, { d: "Sat", h: 3.6 }, { d: "Sun", h: 0.4 },
];
const subj = [
  { s: "Calc", h: 6.2 }, { s: "DS", h: 4.8 }, { s: "OChem", h: 3.5 },
  { s: "LinAlg", h: 2.1 }, { s: "English", h: 1.4 },
];

function AnalyticsPage() {
  return (
    <>
      <Topbar title="Analytics" subtitle="Your focus, consistency & study trends." />
      <main className="p-6 space-y-6">
        <StatsGrid />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="ring-gradient glass rounded-2xl p-5">
            <h3 className="text-base font-semibold">Hours studied this week</h3>
            <div className="h-64 mt-4">
              <ResponsiveContainer>
                <AreaChart data={weekly}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.74 0.19 295)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.62 0.21 285)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="d" stroke="oklch(0.72 0.03 280)" fontSize={12} />
                  <YAxis stroke="oklch(0.72 0.03 280)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "oklch(0.20 0.04 275)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="h" stroke="oklch(0.74 0.19 295)" strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="ring-gradient glass rounded-2xl p-5">
            <h3 className="text-base font-semibold">Subject distribution</h3>
            <div className="h-64 mt-4">
              <ResponsiveContainer>
                <BarChart data={subj}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="s" stroke="oklch(0.72 0.03 280)" fontSize={12} />
                  <YAxis stroke="oklch(0.72 0.03 280)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "oklch(0.20 0.04 275)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12 }} />
                  <Bar dataKey="h" fill="oklch(0.62 0.21 285)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

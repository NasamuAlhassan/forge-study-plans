import { TrendingUp, CheckCircle2, Target, Calendar } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

type Props = {
  totalStudyHours: number;
  consistency: number;
  completed: number;
  sessionsTotal: number;
  todayBlocks: number;
  todayHours: number;
  trend: Array<{ w: string; h: number }>;
};

export function WeeklySummary(p: Props) {
  const completionPct = p.sessionsTotal > 0 ? Math.round((p.completed / p.sessionsTotal) * 100) : 0;
  return (
    <div className="ring-gradient glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">This week at a glance</h3>
          <p className="text-xs text-muted-foreground">Live snapshot of your scheduled study commitment.</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-primary-glow">Weekly summary</span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={Target} label="Study hours" value={`${p.totalStudyHours}h`} accent="from-indigo-500 to-purple-500" />
        <Stat icon={CheckCircle2} label="Completion" value={`${completionPct}%`} accent="from-emerald-500 to-teal-500" />
        <Stat icon={TrendingUp} label="Consistency" value={`${p.consistency}%`} accent="from-blue-500 to-cyan-500" />
        <Stat icon={Calendar} label="Today" value={`${p.todayBlocks} · ${p.todayHours}h`} accent="from-amber-500 to-orange-500" />
      </div>

      <div className="mt-4 h-32">
        <ResponsiveContainer>
          <AreaChart data={p.trend}>
            <defs>
              <linearGradient id="ws" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.74 0.19 295)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.62 0.21 285)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
            <XAxis dataKey="w" stroke="currentColor" fontSize={10} />
            <YAxis stroke="currentColor" fontSize={10} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Area type="monotone" dataKey="h" stroke="oklch(0.74 0.19 295)" strokeWidth={2} fill="url(#ws)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Target; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
      <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${accent} grid place-items-center shadow-glow`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="mt-2 text-lg font-semibold font-display">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

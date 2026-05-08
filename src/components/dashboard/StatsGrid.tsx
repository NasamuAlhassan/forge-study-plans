import { ArrowUpRight, Brain, Clock, Flame, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Study hours this week", value: "18.5h", delta: "+4.2h", icon: Clock, accent: "from-indigo-500 to-purple-500" },
  { label: "Streak", value: "12 days", delta: "Personal best", icon: Flame, accent: "from-amber-500 to-rose-500" },
  { label: "Focus score", value: "92", delta: "+6 vs last week", icon: Target, accent: "from-blue-500 to-cyan-500" },
  { label: "AI sessions completed", value: "23 / 28", delta: "82%", icon: Brain, accent: "from-violet-500 to-fuchsia-500" },
];

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="ring-gradient glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className={cn("h-9 w-9 rounded-lg bg-gradient-to-br grid place-items-center shadow-glow", s.accent)}>
              <s.icon className="h-4 w-4 text-white" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 text-2xl font-semibold font-display">{s.value}</div>
          <div className="text-xs text-muted-foreground">{s.label}</div>
          <div className="mt-1 text-[11px] text-primary-glow">{s.delta}</div>
        </div>
      ))}
    </div>
  );
}

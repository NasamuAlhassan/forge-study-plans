import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarRange,
  Brain,
  Upload,
  Mic,
  BarChart3,
  Settings,
  Sparkles,
  Flame,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/calendar", label: "Calendar", icon: CalendarRange },
  { to: "/dashboard/study-plan", label: "Study plan", icon: Brain },
  { to: "/dashboard/ask", label: "Ask Forge", icon: MessageSquare },
  { to: "/dashboard/import", label: "Import timetable", icon: Upload },
  { to: "/dashboard/voice", label: "Voice scheduling", icon: Mic },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

export function DashboardSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-white/5 bg-sidebar/60 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-white/5">
        <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-semibold">Forge</span>
      </Link>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                active
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        <div className="ring-gradient glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Flame className="h-4 w-4 text-amber-400" />
            12-day streak
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            You're on fire. Keep your momentum going.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

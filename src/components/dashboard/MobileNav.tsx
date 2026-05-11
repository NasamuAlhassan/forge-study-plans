import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, LayoutDashboard, CalendarRange, Brain, Upload, Mic, BarChart3, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="lg:hidden rounded-lg" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar/95 backdrop-blur-xl border-white/5">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-white/5">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">Forge</span>
        </div>
        <nav className="p-3 space-y-1">
          {items.map((it) => {
            const active = path === it.to || (it.to !== "/dashboard" && path.startsWith(it.to));
            return (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                  active
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

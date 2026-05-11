import { Link } from "@tanstack/react-router";
import { CalendarClock, ChevronRight } from "lucide-react";
import type { EventBlock, Subject } from "@/lib/demo-data";

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fmt = (m: number) => `${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;

export function UpcomingTasks({ items, subjects = [] }: { items: EventBlock[]; subjects?: Subject[] }) {
  const todayIdx = (new Date().getDay() + 6) % 7;
  const subjName = (id: string) => subjects.find((s) => s.id === id)?.name;

  return (
    <div className="ring-gradient glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center shadow-glow">
            <CalendarClock className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Upcoming this week</h3>
            <p className="text-xs text-muted-foreground">Next {items.length} block{items.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <Link to="/dashboard/calendar" className="text-xs text-primary-glow hover:underline inline-flex items-center">
          Open calendar <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-white/10 rounded-xl">
            Nothing upcoming. Take a breath ✨
          </div>
        )}
        {items.map((e) => {
          const isToday = e.day === todayIdx;
          return (
            <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04]">
              <div className="text-center w-12 shrink-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{isToday ? "Today" : dayNames[e.day]}</div>
                <div className="text-sm font-semibold font-display">{fmt(e.start)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{e.title}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {e.type} {subjName(e.subjectId) ? `· ${subjName(e.subjectId)}` : ""} · {fmt(e.end - e.start)}
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{e.type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Clock, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { type EventBlock, type Subject } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const fmt = (m: number) => `${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;

export function TodaysAgenda({
  events = [],
  subjects = [],
}: {
  events?: EventBlock[];
  subjects?: Subject[];
}) {
  const todayIdx = (new Date().getDay() + 6) % 7; // JS Sun=0 -> Mon=0
  const today = events.filter((e) => e.day === todayIdx).sort((a, b) => a.start - b.start);
  const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][todayIdx];
  const subjectById = (id: string) =>
    subjects.find((s) => s.id === id) ?? { id: "", name: "", code: "", color: "from-indigo-500 to-purple-500" };

  return (
    <div className="ring-gradient glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Today's agenda</h3>
          <p className="text-xs text-muted-foreground">{dayName} · {today.length} block{today.length === 1 ? "" : "s"}</p>
        </div>
        <Link to="/dashboard/calendar" className="text-xs text-primary-glow hover:underline">View week →</Link>
      </div>
      <div className="mt-4 space-y-3">
        {today.length === 0 && (
          <div className="text-sm text-muted-foreground py-8 text-center border border-dashed border-white/10 rounded-xl">
            Nothing scheduled today. Enjoy the breathing room.
          </div>
        )}
        {today.map((e) => {
          const s = subjectById(e.subjectId);
          return (
            <div
              key={e.id}
              className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
            >
              <div className={cn("h-10 w-1 rounded-full bg-gradient-to-b", s.color)} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{e.title}</div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {fmt(e.start)}–{fmt(e.end)}</span>
                  {e.venue && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.venue}</span>}
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {e.type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Clock, MapPin } from "lucide-react";
import { EVENTS, subjectById } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const fmt = (m: number) => `${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;

export function TodaysAgenda() {
  // Pretend "today" is Wed (day 2)
  const today = EVENTS.filter((e) => e.day === 2).sort((a, b) => a.start - b.start);

  return (
    <div className="ring-gradient glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Today's agenda</h3>
          <p className="text-xs text-muted-foreground">Wednesday · 4 blocks · 6h focus planned</p>
        </div>
        <span className="text-xs text-primary-glow">View week →</span>
      </div>
      <div className="mt-4 space-y-3">
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

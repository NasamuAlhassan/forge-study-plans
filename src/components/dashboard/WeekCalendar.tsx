import { DAYS, EVENTS, SUBJECTS, subjectById as demoSubjectById, type EventBlock, type Subject } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7..20
const HOUR_PX = 56;
const DAY_START = 7 * 60;

const typeStyle: Record<EventBlock["type"], string> = {
  class: "bg-gradient-to-br shadow-glow",
  study: "bg-gradient-to-br opacity-90",
  break: "bg-muted/60 text-foreground",
  exam: "bg-gradient-to-br from-rose-500 to-orange-500 shadow-glow",
  sleep: "bg-gradient-to-br from-slate-700 to-slate-900 opacity-80",
  free: "bg-gradient-to-br from-emerald-500/40 to-teal-500/40",
  task: "bg-gradient-to-br from-amber-500 to-orange-500 shadow-glow",
};

export function WeekCalendar({
  events = EVENTS,
  subjects = SUBJECTS,
  onEventClick,
}: {
  events?: EventBlock[];
  subjects?: Subject[];
  onEventClick?: (e: EventBlock) => void;
}) {
  const subjectById = (id: string) =>
    subjects.find((s) => s.id === id) ?? demoSubjectById(id) ?? subjects[0] ?? { id: "", name: "", code: "", color: "from-indigo-500 to-purple-500" };

  return (
    <div className="ring-gradient glass rounded-2xl overflow-hidden">
     <div className="overflow-x-auto">
      <div className="min-w-[720px]">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/5 bg-card/40">
        <div />
        {DAYS.map((d, i) => (
          <div key={d} className="px-3 py-3 text-center">
            <div className="text-xs text-muted-foreground">{d}</div>
            <div className={cn("text-lg font-semibold font-display", i === 2 && "text-gradient")}>
              {12 + i}
            </div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
        {/* Hours column */}
        <div className="border-r border-white/5">
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_PX }}
              className="text-[10px] text-muted-foreground text-right pr-2 pt-1"
            >
              {h.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((_, dayIdx) => (
          <div key={dayIdx} className="relative border-r border-white/5 last:border-r-0">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_PX }}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              />
            ))}
            {events
              .filter((e) => e.day === dayIdx)
              .map((e) => {
                const top = ((e.start - DAY_START) / 60) * HOUR_PX;
                const height = ((e.end - e.start) / 60) * HOUR_PX - 4;
                const subj = subjectById(e.subjectId);
                return (
                  <div
                    key={e.id}
                    onClick={() => onEventClick?.(e)}
                    style={{ top, height }}
                    className={cn(
                      "absolute left-1 right-1 rounded-lg p-2 text-[11px] text-white overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5 hover:scale-[1.02]",
                      typeStyle[e.type],
                      e.type !== "break" && e.type !== "exam" && subj.color
                    )}
                  >
                    <div className="font-semibold truncate">{e.title}</div>
                    <div className="opacity-90 truncate">
                      {Math.floor(e.start / 60)}:{(e.start % 60).toString().padStart(2, "0")}
                      {e.venue ? ` · ${e.venue}` : ""}
                    </div>
                    {e.type === "study" && (
                      <div className="mt-0.5 text-[9px] uppercase tracking-wider opacity-80">
                        AI study session
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </div>
      </div>
     </div>
    </div>
  );
}

import { useState } from "react";
import { Sparkles, Brain, Coffee, Sun, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { generateRecommendations } from "@/lib/ai.functions";
import { useSchedule } from "@/hooks/use-schedule";

const ICONS = [Brain, Coffee, Sun];
const DEFAULTS = [
  { title: "Add your first study block", desc: "Open the calendar and add a focus session for a subject you care about." },
  { title: "Import your timetable", desc: "Upload a screenshot or PDF and Forge will turn it into a live calendar." },
  { title: "Try a 25/5 Pomodoro", desc: "Short bursts work. Start with one 25-minute block and a 5-minute break." },
];

type Rec = { title: string; desc: string };

export function AIRecommendations() {
  const { events, subjects } = useSchedule();
  const fetchRecs = useServerFn(generateRecommendations);
  const [recs, setRecs] = useState<Rec[]>(DEFAULTS);
  const [loading, setLoading] = useState(false);

  const regenerate = async () => {
    setLoading(true);
    try {
      const snapshot = events.slice(0, 60).map((e) => ({
        title: e.title,
        type: e.type,
        day: e.day,
        start: e.start,
        end: e.end,
        subject: subjects.find((s) => s.id === e.subjectId)?.name,
      }));
      const r = await fetchRecs({ data: { schedule: snapshot } });
      if (r.recommendations?.length) {
        setRecs(r.recommendations.slice(0, 3));
        toast.success("Fresh recommendations");
      } else {
        toast.info("No recommendations right now");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ring-gradient glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold">AI recommendations</h3>
            <p className="text-xs text-muted-foreground">Tuned to your week, exams & energy</p>
          </div>
        </div>
        <button
          onClick={regenerate}
          disabled={loading}
          className="text-xs text-primary-glow hover:underline inline-flex items-center gap-1 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          Regenerate
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {recs.map((r, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <div key={r.title + i} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500/40 to-purple-500/40 grid place-items-center">
                <Icon className="h-4 w-4 text-primary-glow" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">{r.title}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

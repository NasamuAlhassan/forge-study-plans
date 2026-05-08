import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateStudyPlan } from "@/lib/ai.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Session = {
  day: string;
  start: string;
  end: string;
  subject: string;
  focus: string;
  intensity: "light" | "moderate" | "deep";
};

const intensityColor: Record<Session["intensity"], string> = {
  light: "from-emerald-500/40 to-teal-500/40",
  moderate: "from-blue-500/40 to-indigo-500/40",
  deep: "from-violet-500/40 to-fuchsia-500/40",
};

const DEFAULT_CONTEXT = `Student: 2nd year CS undergrad.
Courses & weekly load: Calculus II (hard), Data Structures (medium), Organic Chemistry (hard), Linear Algebra (medium), English Comp (light).
Free periods: Mon 10–13, Tue 13–15, Wed 13, Thu 10–16, Fri 8–11 & 13.
Sleep: 11pm–7am. Best focus: morning. Wants 18–22h study/week with breaks.
Exam in 3 weeks: Calculus II.`;

export function StudyPlanGenerator() {
  const [context, setContext] = useState(DEFAULT_CONTEXT);
  const [loading, setLoading] = useState(false);
  const [rationale, setRationale] = useState<string>("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const generate = useServerFn(generateStudyPlan);

  const run = async () => {
    setLoading(true);
    try {
      const res = await generate({ data: { context } });
      setRationale(res.rationale);
      setSessions(res.sessions);
      toast.success("Your study plan is ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
      <div className="ring-gradient glass rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Tell Forge about your week</h3>
            <p className="text-xs text-muted-foreground">Courses, free time, sleep, exams — anything that matters.</p>
          </div>
        </div>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={12}
          className="mt-4 w-full rounded-xl bg-input/40 border border-white/10 p-3 text-sm outline-none focus:border-primary/60 focus:shadow-glow transition-all resize-none"
        />
        <Button
          onClick={run}
          disabled={loading}
          className="mt-4 w-full bg-gradient-primary hover:opacity-90 shadow-glow"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating…</>
          ) : (
            <><Wand2 className="h-4 w-4 mr-1" /> Generate study plan</>
          )}
        </Button>
        {rationale && (
          <div className="mt-4 p-3 rounded-xl bg-white/[0.04] text-xs text-muted-foreground">
            <div className="flex items-center gap-1 text-foreground font-medium mb-1">
              <Sparkles className="h-3 w-3 text-primary-glow" /> Why this plan
            </div>
            {rationale}
          </div>
        )}
      </div>

      <div className="ring-gradient glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Generated sessions</h3>
          {sessions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={run}>Regenerate</Button>
          )}
        </div>
        <div className="mt-4 space-y-2 max-h-[28rem] overflow-y-auto pr-1">
          {sessions.length === 0 && !loading && (
            <div className="text-sm text-muted-foreground py-16 text-center border border-dashed border-white/10 rounded-xl">
              Your AI study plan will appear here.
            </div>
          )}
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          {sessions.map((s, i) => (
            <div
              key={i}
              className={cn(
                "p-3 rounded-xl bg-gradient-to-br border border-white/5",
                intensityColor[s.intensity]
              )}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider">{s.day}</span>
                <span className="opacity-80">{s.start}–{s.end}</span>
              </div>
              <div className="mt-1 text-sm font-medium">{s.subject}</div>
              <div className="text-xs opacity-90">{s.focus}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider opacity-70">{s.intensity} focus</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

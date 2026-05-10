import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Brain, Loader2, Sparkles, Wand2, CalendarPlus, Mic, MicOff,
  Copy, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateStudyPlan } from "@/lib/ai.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSchedule, persistStudySessions, timeToMinutes, dayToIndex } from "@/hooks/use-schedule";
import { supabase } from "@/integrations/supabase/client";
import { SessionEditDialog, type EditableSession } from "@/components/dashboard/SessionEditDialog";
import { WeekCalendar } from "@/components/dashboard/WeekCalendar";
import type { EventBlock, Subject } from "@/lib/demo-data";

type Session = {
  day: string;
  start: string;
  end: string;
  type: "class" | "study" | "break" | "sleep" | "free" | "task";
  subject: string;
  focus: string;
  intensity: "light" | "moderate" | "deep";
};

type Variant = { label: string; rationale: string; sessions: Session[] };

const DEFAULT_CONTEXT = `Student: 2nd year CS undergrad.
Courses & weekly load: Calculus II (hard), Data Structures (medium), Organic Chemistry (hard), Linear Algebra (medium), English Comp (light).
Free periods: Mon 10–13, Tue 13–15, Wed 13, Thu 10–16, Fri 8–11 & 13.
Sleep: 11pm–7am. Best focus: morning. Wants 18–22h study/week with breaks.
Tasks: lab report due Wed, problem set Fri, gym 3x/week.
Exam in 3 weeks: Calculus II.`;

const TYPE_COLORS: Record<Session["type"], string> = {
  class: "from-indigo-500 to-purple-500",
  study: "from-blue-500 to-cyan-500",
  break: "from-slate-500 to-slate-700",
  sleep: "from-slate-700 to-slate-900",
  free: "from-emerald-500 to-teal-500",
  task: "from-amber-500 to-orange-500",
};

function sessionsToCalendar(sessions: Session[]): { events: EventBlock[]; subjects: Subject[] } {
  const subjMap = new Map<string, Subject>();
  const events: EventBlock[] = sessions.map((s, i) => {
    const subjId = `${s.type}:${s.subject}`;
    if (!subjMap.has(subjId)) {
      subjMap.set(subjId, {
        id: subjId,
        name: s.subject,
        code: s.type,
        color: TYPE_COLORS[s.type],
      });
    }
    return {
      id: `gen-${i}`,
      subjectId: subjId,
      title: s.subject,
      type: s.type,
      day: dayToIndex(s.day),
      start: timeToMinutes(s.start),
      end: timeToMinutes(s.end),
      note: s.focus,
    };
  });
  return { events, subjects: Array.from(subjMap.values()) };
}

// Browser SpeechRecognition typing
type SR = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void;
};

export function StudyPlanGenerator() {
  const [context, setContext] = useState(DEFAULT_CONTEXT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);

  const generate = useServerFn(generateStudyPlan);
  const { user } = useAuth();
  const { subjects, refetch } = useSchedule();

  const active = variants[activeIdx];
  const calData = useMemo(
    () => (active ? sessionsToCalendar(active.sessions) : { events: [], subjects: [] }),
    [active]
  );

  const run = async () => {
    setLoading(true);
    try {
      const res = await generate({ data: { context } });
      const vs = res.variants ?? [];
      if (vs.length === 0) throw new Error("AI returned no variants");
      setVariants(vs);
      setActiveIdx(0);
      toast.success(`${vs.length} timetable options ready — pick your favorite`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setVariants([]);
    setActiveIdx(0);
    toast.info("Cleared — generate a fresh plan");
  };

  const duplicateWeek = () => {
    if (!active) return;
    const v: Variant = {
      ...active,
      label: `${active.label} (copy)`,
      sessions: active.sessions.map((s) => ({ ...s })),
    };
    setVariants((arr) => [...arr, v]);
    setActiveIdx(variants.length);
    toast.success("Week duplicated — edit the copy freely");
  };

  const updateSession = (i: number, updated: EditableSession) => {
    setVariants((arr) =>
      arr.map((v, vi) =>
        vi !== activeIdx
          ? v
          : {
              ...v,
              sessions: v.sessions.map((s, si) =>
                si !== i ? s : { ...s, ...updated }
              ),
            }
      )
    );
  };

  const removeSession = (i: number) => {
    setVariants((arr) =>
      arr.map((v, vi) =>
        vi !== activeIdx ? v : { ...v, sessions: v.sessions.filter((_, si) => si !== i) }
      )
    );
  };

  const saveToCalendar = async () => {
    if (!user) return toast.error("Please sign in first");
    if (!active) return;
    const studyOnly = active.sessions.filter((s) => s.type === "study");
    if (studyOnly.length === 0) {
      toast.warning("This variant has no study sessions to save");
      return;
    }
    setSaving(true);
    try {
      await supabase.from("study_plans").insert({
        user_id: user.id,
        context,
        rationale: active.rationale,
        plan: { variant: active } as never,
      });
      await persistStudySessions(user.id, studyOnly, subjects);
      await refetch();
      toast.success(`Added ${studyOnly.length} study sessions to your calendar`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // --- Voice ---
  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let chunk = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) chunk += r[0].transcript + " ";
      }
      if (chunk) setContext((prev) => `${prev}${prev && !prev.endsWith("\n") ? "\n" : ""}${chunk.trim()}`);
    };
    rec.onerror = (ev) => {
      toast.error(`Mic error: ${ev.error ?? "unknown"}`);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
    toast.info("Listening… speak your free time, sleep, classes, tasks");
  };

  const editing = editIdx !== null && active ? active.sessions[editIdx] : null;
  const initialEdit: EditableSession | null = editing
    ? {
        day: editing.day,
        start: editing.start,
        end: editing.end,
        subject: editing.subject,
        focus: editing.focus,
        intensity: editing.intensity,
      }
    : null;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-6">
      {/* INPUT PANEL */}
      <div className="ring-gradient glass rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold">Tell Forge about your week</h3>
            <p className="text-xs text-muted-foreground">Type or speak — courses, free time, sleep, exams, tasks.</p>
          </div>
        </div>

        <div className="relative mt-4">
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={12}
            className="w-full rounded-xl bg-input/40 border border-white/10 p-3 pr-12 text-sm outline-none focus:border-primary/60 focus:shadow-glow transition-all resize-none"
          />
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? "Stop dictation" : "Start dictation"}
            className={cn(
              "absolute top-2 right-2 h-9 w-9 grid place-items-center rounded-lg transition-all",
              listening
                ? "bg-rose-500/90 shadow-glow animate-pulse text-white"
                : "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
            )}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>
        {listening && (
          <p className="mt-2 text-xs text-rose-300">● Listening — review and edit before generating.</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={run} disabled={loading} className="flex-1 min-w-[160px] bg-gradient-primary hover:opacity-90 shadow-glow">
            {loading ? (<><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating 3 options…</>) : (<><Wand2 className="h-4 w-4 mr-1" /> Generate 3 timetables</>)}
          </Button>
          {variants.length > 0 && (
            <Button variant="ghost" onClick={reset} title="Reset and start over">
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          )}
        </div>

        {active?.rationale && (
          <div className="mt-4 p-3 rounded-xl bg-white/[0.04] text-xs text-muted-foreground">
            <div className="flex items-center gap-1 text-foreground font-medium mb-1">
              <Sparkles className="h-3 w-3 text-primary-glow" /> Why “{active.label}”
            </div>
            {active.rationale}
          </div>
        )}
      </div>

      {/* PREVIEW PANEL */}
      <div className="ring-gradient glass rounded-2xl p-4 sm:p-5 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">Weekly preview</h3>
          {variants.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="ghost" onClick={duplicateWeek} title="Duplicate this week">
                <Copy className="h-4 w-4 mr-1" /> Duplicate
              </Button>
              <Button size="sm" onClick={saveToCalendar} disabled={saving} className="bg-gradient-primary hover:opacity-90 shadow-glow">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CalendarPlus className="h-4 w-4 mr-1" /> Save to calendar</>}
              </Button>
            </div>
          )}
        </div>

        {/* Variant tabs */}
        {variants.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {variants.map((v, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  i === activeIdx
                    ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow"
                    : "bg-white/5 text-muted-foreground border-white/10 hover:text-foreground"
                )}
              >
                Option {i + 1} · {v.label}
              </button>
            ))}
          </div>
        )}

        {/* Legend */}
        {active && (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            {(["class", "study", "break", "sleep", "free", "task"] as const).map((t) => (
              <span key={t} className="flex items-center gap-1.5 uppercase tracking-wider">
                <span className={cn("h-2 w-2 rounded-sm bg-gradient-to-br", TYPE_COLORS[t])} />
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4">
          {!active && !loading && (
            <div className="text-sm text-muted-foreground py-16 text-center border border-dashed border-white/10 rounded-xl">
              Your AI weekly timetable will appear here — with 3 options to choose from.
            </div>
          )}
          {loading && <div className="h-[28rem] rounded-xl bg-white/5 animate-pulse" />}
          {active && (
            <WeekCalendar
              events={calData.events}
              subjects={calData.subjects}
              onEventClick={(ev) => {
                const idx = parseInt(ev.id.replace("gen-", ""), 10);
                if (!Number.isNaN(idx)) setEditIdx(idx);
              }}
            />
          )}
        </div>

        {active && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Tip: tap any block to edit it inline. Edits stay in this preview until you save to your calendar.
          </p>
        )}
      </div>

      <SessionEditDialog
        open={editIdx !== null}
        initial={initialEdit}
        title="Edit block"
        onClose={() => setEditIdx(null)}
        onSave={(updated) => {
          if (editIdx === null) return;
          updateSession(editIdx, updated);
          toast.success("Block updated");
        }}
        onDelete={() => {
          if (editIdx === null) return;
          removeSession(editIdx);
          toast.success("Block removed");
        }}
      />
    </div>
  );
}

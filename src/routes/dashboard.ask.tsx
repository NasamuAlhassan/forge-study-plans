import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Loader2, Mic, MicOff, Check, X, Bot, User as UserIcon } from "lucide-react";
import { askForge } from "@/lib/ai.functions";
import { useAuth } from "@/hooks/use-auth";
import {
  useSchedule, dayToIndex, timeToMinutes,
} from "@/hooks/use-schedule";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/ask")({
  component: AskPage,
});

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  operations?: Operation[];
  applied?: boolean;
};

type Operation = {
  op: "add" | "update" | "delete";
  id?: string;
  day?: string;
  start?: string;
  end?: string;
  type?: "class" | "study" | "break" | "sleep" | "free" | "task";
  title?: string;
};

type SR = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void;
};

const dayName = (d: number) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d] ?? "Mon";
const fmt = (m: number) => `${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;

function AskPage() {
  const { user } = useAuth();
  const { events, refetch } = useSchedule();
  const ask = useServerFn(askForge);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: "Hey! I'm Forge. Tell me what changed — missed a class, want to move a study block, cancel something, or rebalance your week. I'll preview every change before saving.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const schedule = events.map((e) => ({
        id: e.id, title: e.title, type: e.type, day: e.day, start: e.start, end: e.end,
      }));
      const res = await ask({
        data: {
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          schedule,
        },
      });
      setMessages([
        ...next,
        { role: "assistant", content: res.reply, operations: res.operations as Operation[] },
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reach Forge");
    } finally {
      setSending(false);
    }
  };

  const apply = async (msgIdx: number) => {
    const msg = messages[msgIdx];
    if (!user || !msg.operations?.length) return;
    try {
      for (const op of msg.operations) {
        if (op.op === "delete" && op.id) {
          await supabase.from("events").delete().eq("id", op.id);
        } else if (op.op === "update" && op.id) {
          const patch: Record<string, unknown> = {};
          if (op.day) patch.day_of_week = dayToIndex(op.day);
          if (op.start) patch.start_minute = timeToMinutes(op.start);
          if (op.end) patch.end_minute = timeToMinutes(op.end);
          if (op.type) patch.type = op.type;
          if (op.title) patch.title = op.title;
          await supabase.from("events").update(patch).eq("id", op.id);
        } else if (op.op === "add" && op.day && op.start && op.end) {
          await supabase.from("events").insert({
            user_id: user.id,
            title: op.title ?? "New block",
            type: op.type ?? "study",
            day_of_week: dayToIndex(op.day),
            start_minute: timeToMinutes(op.start),
            end_minute: timeToMinutes(op.end),
          });
        }
      }
      await refetch();
      setMessages((arr) => arr.map((m, i) => (i === msgIdx ? { ...m, applied: true } : m)));
      toast.success(`Applied ${msg.operations.length} change${msg.operations.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to apply");
    }
  };

  const reject = (msgIdx: number) => {
    setMessages((arr) => arr.map((m, i) => (i === msgIdx ? { ...m, operations: [], applied: false } : m)));
    toast.info("Discarded");
  };

  const toggleMic = () => {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) { toast.error("Voice not supported. Try Chrome."); return; }
    const rec = new Ctor();
    rec.lang = "en-US"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => {
      const text = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join(" ").trim();
      if (text) setInput((p) => (p ? p + " " : "") + text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec; rec.start(); setListening(true);
  };

  const opLabel = (op: Operation) => {
    if (op.op === "delete") return `Delete block ${op.id?.slice(0, 6) ?? ""}`;
    if (op.op === "add") return `Add: ${op.title ?? op.type} · ${op.day} ${op.start}–${op.end}`;
    const parts: string[] = [];
    if (op.day) parts.push(`→ ${op.day}`);
    if (op.start || op.end) parts.push(`${op.start ?? "?"}–${op.end ?? "?"}`);
    if (op.title) parts.push(`"${op.title}"`);
    return `Update ${op.id?.slice(0, 6) ?? ""}: ${parts.join(" ")}`;
  };

  const findEvent = (id?: string) => events.find((e) => e.id === id);

  return (
    <>
      <Topbar title="Ask Forge" subtitle="Conversational scheduling — preview every change before it saves." />
      <main className="p-4 sm:p-6">
        <div className="ring-gradient glass rounded-2xl flex flex-col h-[calc(100vh-9rem)] max-w-3xl mx-auto overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "")}>
                {m.role === "assistant" && (
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                  m.role === "user"
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "bg-white/[0.04] border border-white/10"
                )}>
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.role === "assistant" && m.operations && m.operations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary-glow" />
                        Proposed changes ({m.operations.length})
                      </div>
                      {m.operations.map((op, j) => {
                        const before = findEvent(op.id);
                        return (
                          <div key={j} className="rounded-lg bg-background/40 border border-white/10 p-2 text-xs">
                            <div className="font-medium">{opLabel(op)}</div>
                            {before && op.op !== "add" && (
                              <div className="text-muted-foreground mt-0.5">
                                Was: {dayName(before.day)} {fmt(before.start)}–{fmt(before.end)} · {before.title}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {m.applied ? (
                        <div className="text-xs text-emerald-400 inline-flex items-center gap-1">
                          <Check className="h-3 w-3" /> Applied
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" onClick={() => apply(i)} className="bg-gradient-primary hover:opacity-90 shadow-glow">
                            <Check className="h-4 w-4 mr-1" /> Confirm & save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => reject(i)}>
                            <X className="h-4 w-4 mr-1" /> Discard
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-white/10 grid place-items-center">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm text-muted-foreground inline-flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          <form
            className="border-t border-white/10 p-3 flex items-center gap-2 bg-background/40"
            onSubmit={(e) => { e.preventDefault(); send(input); }}
          >
            <button
              type="button"
              onClick={toggleMic}
              className={cn(
                "h-10 w-10 grid place-items-center rounded-xl shrink-0 transition-all",
                listening ? "bg-rose-500 animate-pulse text-white" : "bg-white/5 hover:bg-white/10"
              )}
              aria-label="Voice input"
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. I missed Calculus today, can you reschedule it to Thursday morning?"
              className="flex-1 bg-input/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            <Button type="submit" disabled={sending || !input.trim()} className="bg-gradient-primary hover:opacity-90 shadow-glow">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}

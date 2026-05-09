import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Mic, Square, Sparkles, Loader2, Check } from "lucide-react";
import { extractTimetableFromText } from "@/lib/ai.functions";
import { useAuth } from "@/hooks/use-auth";
import { useSchedule } from "@/hooks/use-schedule";
import { persistTimetableEntries } from "@/hooks/use-schedule";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/voice")({
  component: VoicePage,
});

type Entry = {
  course: string;
  code?: string;
  lecturer?: string;
  venue?: string;
  day: string;
  start: string;
  end: string;
};

function VoicePage() {
  const { user } = useAuth();
  const { refetch } = useSchedule();
  const extract = useServerFn(extractTimetableFromText);

  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [converting, setConverting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const recRef = useRef<any>(null);
  const finalRef = useRef("");
  const shouldRestartRef = useRef(false);

  useEffect(() => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (ev: any) => {
      let interimTxt = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript + " ";
        else interimTxt += r[0].transcript;
      }
      setTranscript(finalRef.current);
      setInterim(interimTxt);
    };
    rec.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "audio-capture") return;
      if (e.error === "not-allowed") {
        toast.error("Microphone permission denied");
        shouldRestartRef.current = false;
      }
    };
    rec.onend = () => {
      if (shouldRestartRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* ignore */
        }
      }
      setListening(false);
      setInterim("");
    };
    recRef.current = rec;
    return () => {
      shouldRestartRef.current = false;
      try { rec.stop(); } catch { /* ignore */ }
    };
  }, []);

  const toggle = () => {
    if (!recRef.current) return;
    if (listening) {
      shouldRestartRef.current = false;
      recRef.current.stop();
    } else {
      finalRef.current = "";
      setTranscript("");
      setInterim("");
      setEntries([]);
      shouldRestartRef.current = true;
      try {
        recRef.current.start();
        setListening(true);
      } catch (err) {
        console.error("Failed to start recognition", err);
        toast.error("Couldn't start microphone");
      }
    }
  };

  const handleConvert = async () => {
    const text = (transcript + " " + interim).trim();
    if (!text) return;
    setConverting(true);
    try {
      const res = await extract({ data: { text } });
      if (!res.entries?.length) {
        toast.error("Couldn't extract any classes — try being more specific");
      } else {
        setEntries(res.entries);
        toast.success(`Found ${res.entries.length} class${res.entries.length === 1 ? "" : "es"}`);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed to convert");
    } finally {
      setConverting(false);
    }
  };

  const handleSave = async () => {
    if (!user || !entries.length) return;
    setSaving(true);
    try {
      await persistTimetableEntries(user.id, entries);
      await refetch();
      toast.success("Added to your calendar");
      setEntries([]);
      setTranscript("");
      finalRef.current = "";
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar title="Voice scheduling" subtitle="Speak naturally. Forge structures it for you." />
      <main className="p-6">
        <div className="ring-gradient glass rounded-2xl p-8 max-w-3xl mx-auto text-center">
          <div className="relative mx-auto h-28 w-28">
            <div className={`absolute inset-0 rounded-full bg-gradient-primary ${listening ? "animate-glow-pulse" : "opacity-60"}`} />
            <button
              onClick={toggle}
              disabled={!supported}
              className="relative h-28 w-28 rounded-full bg-gradient-primary grid place-items-center shadow-glow disabled:opacity-50"
            >
              {listening ? <Square className="h-8 w-8 text-primary-foreground" /> : <Mic className="h-10 w-10 text-primary-foreground" />}
            </button>
          </div>

          <h3 className="mt-6 font-display text-2xl font-semibold">
            {listening ? "Listening…" : supported ? "Tap to start" : "Voice not supported in this browser"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Try: <span className="text-foreground">"I have Calculus on Monday from 8 to 10 in LT 1, and Data Structures on Wednesday at 2pm."</span>
          </p>

          <div className="mt-6 ring-gradient glass rounded-xl p-5 text-left min-h-32">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary-glow" /> Live transcript
            </div>
            <p className="mt-2 text-base">
              {transcript || interim ? (
                <>
                  <span>{transcript}</span>
                  <span className="text-muted-foreground">{interim}</span>
                </>
              ) : (
                <span className="text-muted-foreground">…</span>
              )}
            </p>
          </div>

          {(transcript || interim) && !listening && entries.length === 0 && (
            <Button
              onClick={handleConvert}
              disabled={converting}
              className="mt-5 bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              {converting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Convert to schedule
            </Button>
          )}

          {entries.length > 0 && (
            <div className="mt-6 text-left space-y-2">
              <div className="text-sm text-muted-foreground">Extracted classes</div>
              {entries.map((e, i) => (
                <div key={i} className="ring-gradient glass rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{e.course}{e.code ? ` (${e.code})` : ""}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.day} · {e.start}–{e.end}{e.venue ? ` · ${e.venue}` : ""}{e.lecturer ? ` · ${e.lecturer}` : ""}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 justify-center pt-2">
                <Button variant="outline" onClick={() => setEntries([])} disabled={saving}>
                  Discard
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary hover:opacity-90 shadow-glow">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Add to my calendar
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

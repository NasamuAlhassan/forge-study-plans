import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Plus, Trash2, ArrowRight, GraduationCap, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

const PALETTE = [
  "from-indigo-500 to-purple-500",
  "from-blue-500 to-cyan-500",
  "from-fuchsia-500 to-pink-500",
  "from-violet-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-red-500",
];

type Course = { name: string; difficulty: string; credit_hours: string };

function OnboardingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [courses, setCourses] = useState<Course[]>([
    { name: "", difficulty: "medium", credit_hours: "3" },
  ]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, onboarded_at").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.onboarded_at) navigate({ to: "/dashboard" });
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user, navigate]);

  const addCourse = () => setCourses((c) => [...c, { name: "", difficulty: "medium", credit_hours: "3" }]);
  const removeCourse = (i: number) => setCourses((c) => c.filter((_, idx) => idx !== i));
  const updateCourse = (i: number, patch: Partial<Course>) =>
    setCourses((c) => c.map((co, idx) => (idx === i ? { ...co, ...patch } : co)));

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    try {
      // Save display name
      if (displayName.trim()) {
        await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("user_id", user.id);
      }
      // Save valid courses
      const valid = courses.filter((c) => c.name.trim());
      if (valid.length > 0) {
        const rows = valid.map((c, i) => ({
          user_id: user.id,
          name: c.name.trim(),
          difficulty: c.difficulty,
          credit_hours: parseInt(c.credit_hours) || null,
          color: PALETTE[i % PALETTE.length],
        }));
        const { error } = await supabase.from("subjects").insert(rows);
        if (error) throw error;
      }
      // Mark onboarded
      await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("user_id", user.id);
      toast.success("Welcome to Forge!");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("user_id", user.id);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center p-4">
      <div className="w-full max-w-xl ring-gradient glass rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">Forge</span>
          <div className="ml-auto flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-primary" : "bg-white/10"}`} />
            ))}
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-display font-semibold">Welcome 👋</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Let's set up your academic workspace in two quick steps.
              </p>
            </div>
            <div>
              <Label>Your name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Alex" />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={skip}>Skip for now</Button>
              <Button onClick={() => setStep(1)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> Your courses
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Add the courses you're taking this semester. You can edit these anytime in Settings.
              </p>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {courses.map((c, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    {i === 0 && <Label className="text-xs">Course name</Label>}
                    <Input value={c.name} onChange={(e) => updateCourse(i, { name: e.target.value })} placeholder="Calculus II" />
                  </div>
                  <div className="col-span-3">
                    {i === 0 && <Label className="text-xs">Difficulty</Label>}
                    <Select value={c.difficulty} onValueChange={(v) => updateCourse(i, { difficulty: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <Label className="text-xs">Credits</Label>}
                    <Input type="number" min="0" max="10" value={c.credit_hours} onChange={(e) => updateCourse(i, { credit_hours: e.target.value })} />
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => removeCourse(i)} disabled={courses.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addCourse}>
              <Plus className="h-4 w-4 mr-1" /> Add another course
            </Button>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={() => setStep(2)}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-gradient-primary grid place-items-center shadow-glow">
              <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-semibold">You're all set</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Add a timetable, generate a study plan, or start adding events directly.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={finish} disabled={busy} size="lg">
                {busy ? "Setting up…" : "Enter Forge"}
              </Button>
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

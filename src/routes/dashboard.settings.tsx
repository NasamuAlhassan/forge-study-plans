import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSchedule, deleteAllEvents } from "@/hooks/use-schedule";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, AlertTriangle, GraduationCap, User } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

const PALETTE = [
  "from-indigo-500 to-purple-500",
  "from-blue-500 to-cyan-500",
  "from-fuchsia-500 to-pink-500",
  "from-violet-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
];

function SettingsPage() {
  const { user } = useAuth();
  const { subjects, refetch } = useSchedule();
  const [displayName, setDisplayName] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: "", difficulty: "medium", credit_hours: "3" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, university, major").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setUniversity(data.university ?? "");
          setMajor(data.major ?? "");
        }
      });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      university,
      major,
    }).eq("user_id", user.id);
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  const addCourse = async () => {
    if (!user || !newCourse.name.trim()) return;
    const { error } = await supabase.from("subjects").insert({
      user_id: user.id,
      name: newCourse.name.trim(),
      difficulty: newCourse.difficulty,
      credit_hours: parseInt(newCourse.credit_hours) || null,
      color: PALETTE[subjects.length % PALETTE.length],
    });
    if (error) return toast.error(error.message);
    setNewCourse({ name: "", difficulty: "medium", credit_hours: "3" });
    await refetch();
    toast.success("Course added");
  };

  const removeCourse = async (id: string) => {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await refetch();
    toast.success("Course removed");
  };

  const newSemester = async () => {
    if (!user) return;
    try {
      await deleteAllEvents(user.id);
      const { error } = await supabase.from("subjects").delete().eq("user_id", user.id);
      if (error) throw error;
      await refetch();
      toast.success("New semester started — all courses & events cleared");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reset");
    }
  };

  return (
    <>
      <Topbar title="Settings" subtitle="Manage your profile, courses, and semester." />
      <main className="p-4 sm:p-6 space-y-6 max-w-3xl">
        {/* Profile */}
        <section className="ring-gradient glass rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Profile
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <Label>University</Label>
              <Input value={university} onChange={(e) => setUniversity(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Major</Label>
              <Input value={major} onChange={(e) => setMajor(e.target.value)} />
            </div>
          </div>
          <Button onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save profile"}
          </Button>
        </section>

        {/* Courses */}
        <section className="ring-gradient glass rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" /> Courses
          </h2>

          <div className="space-y-2">
            {subjects.length === 0 && (
              <p className="text-sm text-muted-foreground">No courses yet. Add your first one below.</p>
            )}
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                <div>
                  <div className="font-medium">{s.name}</div>
                  {s.code && <div className="text-xs text-muted-foreground">{s.code}</div>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeCourse(s.id)}>
                  <Trash2 className="h-4 w-4 text-rose-400" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-2 items-end pt-2 border-t border-white/5">
            <div className="col-span-12 sm:col-span-6">
              <Label className="text-xs">New course</Label>
              <Input
                value={newCourse.name}
                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                placeholder="e.g. Linear Algebra"
              />
            </div>
            <div className="col-span-6 sm:col-span-3">
              <Label className="text-xs">Difficulty</Label>
              <Select value={newCourse.difficulty} onValueChange={(v) => setNewCourse({ ...newCourse, difficulty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4 sm:col-span-2">
              <Label className="text-xs">Credits</Label>
              <Input
                type="number"
                value={newCourse.credit_hours}
                onChange={(e) => setNewCourse({ ...newCourse, credit_hours: e.target.value })}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Button onClick={addCourse} size="icon" disabled={!newCourse.name.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section className="ring-gradient glass rounded-2xl p-5 space-y-3 border border-rose-500/20">
          <h2 className="font-display text-lg font-semibold text-rose-300 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Danger zone
          </h2>
          <p className="text-sm text-muted-foreground">
            Start a new semester. This permanently deletes every course and event on your account.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Start new semester</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Wipe all courses and events?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone. Your study session history is preserved for analytics.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={newSemester} className="bg-rose-500 hover:bg-rose-600">
                  Yes, reset everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>
    </>
  );
}

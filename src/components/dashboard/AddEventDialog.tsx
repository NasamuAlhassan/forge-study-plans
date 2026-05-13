import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { dayToIndex, timeToMinutes } from "@/hooks/use-schedule";
import { findConflicts } from "@/lib/conflicts";
import type { EventBlock, Subject } from "@/lib/demo-data";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TYPES: EventBlock["type"][] = ["class", "study", "break", "exam", "task", "free", "sleep"];

export function AddEventDialog({
  open, onOpenChange, subjects, events, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subjects: Subject[];
  events: EventBlock[];
  onSaved: () => Promise<void> | void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventBlock["type"]>("class");
  const [subjectId, setSubjectId] = useState<string>("");
  const [day, setDay] = useState("Mon");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [venue, setVenue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle(""); setType("class"); setSubjectId(""); setDay("Mon");
      setStart("09:00"); setEnd("10:00"); setVenue("");
    }
  }, [open]);

  const conflicts = useMemo(() => {
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    if (e <= s) return [];
    return findConflicts({ day: dayToIndex(day), start: s, end: e }, events);
  }, [day, start, end, events]);

  const submit = async (force = false) => {
    if (!user) return;
    if (!title.trim()) return toast.error("Title is required");
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    if (e <= s) return toast.error("End time must be after start time");
    if (conflicts.length > 0 && !force) {
      toast.warning(`Conflicts with ${conflicts.length} block(s) — click "Save anyway" to override.`);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("events").insert({
        user_id: user.id,
        subject_id: subjectId || null,
        title: title.trim(),
        type,
        day_of_week: dayToIndex(day),
        start_minute: s,
        end_minute: e,
        venue: venue.trim() || null,
      });
      if (error) throw error;
      toast.success("Event added");
      await onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add event</DialogTitle>
          <DialogDescription>Add a class, study session, or task to your weekly schedule.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Calculus lecture" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as EventBlock["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Course</Label>
              <Select value={subjectId || "none"} onValueChange={(v) => setSubjectId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Day</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Venue (optional)</Label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. LT 1" />
          </div>

          {conflicts.length > 0 && (
            <div className="flex gap-2 items-start text-xs rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                Overlaps with: {conflicts.map((c) => c.title).join(", ")}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          {conflicts.length > 0 ? (
            <Button onClick={() => submit(true)} disabled={saving} variant="destructive">
              Save anyway
            </Button>
          ) : (
            <Button onClick={() => submit(false)} disabled={saving}>Save</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

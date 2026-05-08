import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

export type EditableSession = {
  day: string;
  start: string;
  end: string;
  subject: string;
  focus: string;
  intensity: "light" | "moderate" | "deep";
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function SessionEditDialog({
  open,
  initial,
  title = "Edit session",
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  initial: EditableSession | null;
  title?: string;
  onClose: () => void;
  onSave: (s: EditableSession) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<EditableSession | null>(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => setDraft(initial), [initial]);

  if (!draft) return null;

  const set = <K extends keyof EditableSession>(k: K, v: EditableSession[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const submit = async () => {
    setBusy(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    setBusy(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass border-white/10">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Input value={draft.subject} onChange={(e) => set("subject", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Focus</Label>
            <Input value={draft.focus} onChange={(e) => set("focus", e.target.value)} placeholder="What to work on" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Day</Label>
              <Select value={draft.day} onValueChange={(v) => set("day", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Start</Label>
              <Input type="time" value={draft.start} onChange={(e) => set("start", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">End</Label>
              <Input type="time" value={draft.end} onChange={(e) => set("end", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Intensity</Label>
            <Select value={draft.intensity} onValueChange={(v) => set("intensity", v as EditableSession["intensity"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="deep">Deep</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {onDelete && (
            <Button variant="ghost" onClick={remove} disabled={busy} className="mr-auto text-rose-400 hover:text-rose-300">
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy} className="bg-gradient-primary hover:opacity-90 shadow-glow">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

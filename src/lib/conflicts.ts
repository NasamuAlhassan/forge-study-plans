import type { EventBlock } from "@/lib/demo-data";

export type EventLite = {
  id?: string;
  day: number;
  start: number;
  end: number;
};

export function findConflicts(target: EventLite, all: EventBlock[]): EventBlock[] {
  return all.filter(
    (e) =>
      e.id !== target.id &&
      e.day === target.day &&
      target.start < e.end &&
      target.end > e.start
  );
}

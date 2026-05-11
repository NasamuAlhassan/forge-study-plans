import { useMemo, useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views, type View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, addDays, addWeeks, startOfMonth, endOfMonth, differenceInCalendarWeeks } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./big-calendar.css";
import type { EventBlock, Subject } from "@/lib/demo-data";

const locales = { "en-US": {} as unknown };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

type RBCEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: EventBlock & { subject?: Subject };
};

const TYPE_BG: Record<EventBlock["type"], string> = {
  class: "linear-gradient(135deg, oklch(0.62 0.21 285), oklch(0.74 0.19 295))",
  study: "linear-gradient(135deg, oklch(0.62 0.18 230), oklch(0.78 0.16 215))",
  break: "oklch(0.30 0.02 280)",
  exam: "linear-gradient(135deg, oklch(0.62 0.22 25), oklch(0.74 0.18 50))",
  sleep: "linear-gradient(135deg, oklch(0.30 0.04 270), oklch(0.20 0.04 275))",
  free: "linear-gradient(135deg, oklch(0.65 0.18 165), oklch(0.72 0.14 200))",
  task: "linear-gradient(135deg, oklch(0.74 0.18 60), oklch(0.70 0.20 35))",
};

const DnDCalendar = withDragAndDrop<RBCEvent, object>(Calendar as never);

function weekStart(d: Date) {
  return startOfWeek(d, { weekStartsOn: 1 });
}

function expandEvents(events: EventBlock[], rangeStart: Date, rangeEnd: Date, subjects: Subject[]): RBCEvent[] {
  const subjById = new Map(subjects.map((s) => [s.id, s]));
  const out: RBCEvent[] = [];
  // Iterate week-by-week through the range, generating per-week instances
  let cursor = weekStart(rangeStart);
  let safety = 0;
  while (cursor <= rangeEnd && safety++ < 12) {
    for (const e of events) {
      const day = addDays(cursor, e.day);
      if (day < rangeStart || day > rangeEnd) continue;
      const start = new Date(day);
      start.setHours(Math.floor(e.start / 60), e.start % 60, 0, 0);
      const end = new Date(day);
      end.setHours(Math.floor(e.end / 60), e.end % 60, 0, 0);
      out.push({
        id: `${e.id}|${day.toISOString().slice(0, 10)}`,
        title: e.title,
        start,
        end,
        resource: { ...e, subject: subjById.get(e.subjectId) },
      });
    }
    cursor = addWeeks(cursor, 1);
  }
  return out;
}

export type BigCalendarChange = {
  eventId: string;
  day_of_week: number;
  start_minute: number;
  end_minute: number;
};

export function BigCalendar({
  events,
  subjects,
  onChange,
  onSelectEvent,
}: {
  events: EventBlock[];
  subjects: Subject[];
  onChange?: (change: BigCalendarChange) => void;
  onSelectEvent?: (e: EventBlock) => void;
}) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState<Date>(new Date());

  const range = useMemo(() => {
    if (view === Views.MONTH) {
      const s = weekStart(startOfMonth(date));
      const e = addDays(weekStart(endOfMonth(date)), 6);
      return { start: s, end: e };
    }
    if (view === Views.DAY) {
      const s = new Date(date); s.setHours(0, 0, 0, 0);
      const e = new Date(date); e.setHours(23, 59, 59, 0);
      return { start: s, end: e };
    }
    if (view === Views.AGENDA) {
      const s = new Date(date); s.setHours(0, 0, 0, 0);
      return { start: s, end: addDays(s, 30) };
    }
    const s = weekStart(date);
    return { start: s, end: addDays(s, 6) };
  }, [view, date]);

  const rbcEvents = useMemo(
    () => expandEvents(events, range.start, range.end, subjects),
    [events, range.start, range.end, subjects]
  );

  const eventPropGetter = useCallback((event: RBCEvent) => {
    const bg = TYPE_BG[event.resource.type] ?? TYPE_BG.study;
    return {
      style: {
        background: bg,
        border: "none",
        color: "white",
        borderRadius: 8,
        padding: "2px 6px",
        fontSize: 11,
        boxShadow: "0 4px 16px -8px oklch(0 0 0 / 0.5)",
      },
    };
  }, []);

  const handleMove = useCallback(
    ({ event, start, end }: { event: RBCEvent; start: Date | string; end: Date | string }) => {
      const s = new Date(start);
      const e = new Date(end);
      const dow = (getDay(s) + 6) % 7; // Mon=0
      onChange?.({
        eventId: event.resource.id,
        day_of_week: dow,
        start_minute: s.getHours() * 60 + s.getMinutes(),
        end_minute: e.getHours() * 60 + e.getMinutes(),
      });
    },
    [onChange]
  );

  return (
    <div className="ring-gradient glass rounded-2xl p-2 sm:p-3">
      <div className="rbc-forge h-[70vh] min-h-[500px]">
        <DnDCalendar
          localizer={localizer}
          events={rbcEvents}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          step={30}
          timeslots={2}
          min={new Date(0, 0, 0, 6, 0)}
          max={new Date(0, 0, 0, 23, 0)}
          eventPropGetter={eventPropGetter}
          onEventDrop={handleMove}
          onEventResize={handleMove}
          resizable
          onSelectEvent={(e) => onSelectEvent?.(e.resource)}
          popup
        />
      </div>
    </div>
  );
}

// silence unused
void differenceInCalendarWeeks;

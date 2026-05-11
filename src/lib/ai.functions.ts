import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ExtractInput = z.object({
  imageDataUrl: z.string().min(20),
});

const ExtractTextInput = z.object({
  text: z.string().min(1).max(4000),
});

const PlanInput = z.object({
  context: z.string().min(1).max(4000),
});

async function callLovableAI(body: unknown) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add funds in workspace settings.");
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI gateway error: ${res.status} ${txt.slice(0, 200)}`);
  }
  return res.json();
}

export const extractTimetable = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ExtractInput.parse(d))
  .handler(async ({ data }) => {
    const result = await callLovableAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are an expert academic timetable parser. Extract every class entry from the image. Always call the tool — never reply in plain text.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the structured weekly timetable from this image. Use 24-hour times." },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_timetable",
            description: "Save a parsed weekly timetable",
            parameters: {
              type: "object",
              properties: {
                entries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      course: { type: "string" },
                      code: { type: "string" },
                      lecturer: { type: "string" },
                      venue: { type: "string" },
                      day: { type: "string", enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
                      start: { type: "string", description: "HH:MM 24h" },
                      end: { type: "string", description: "HH:MM 24h" },
                    },
                    required: ["course", "day", "start", "end"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["entries"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_timetable" } },
    });

    const call = result?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : { entries: [] };
    return args as {
      entries: Array<{
        course: string;
        code?: string;
        lecturer?: string;
        venue?: string;
        day: string;
        start: string;
        end: string;
      }>;
    };
  });

export const extractTimetableFromText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ExtractTextInput.parse(d))
  .handler(async ({ data }) => {
    const result = await callLovableAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You parse spoken or written natural-language descriptions of class schedules into structured timetable entries. Use 24-hour times. Infer 1h end time if missing. Always call the tool.",
        },
        { role: "user", content: data.text },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_timetable",
            description: "Save parsed timetable entries",
            parameters: {
              type: "object",
              properties: {
                entries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      course: { type: "string" },
                      code: { type: "string" },
                      lecturer: { type: "string" },
                      venue: { type: "string" },
                      day: { type: "string", enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
                      start: { type: "string", description: "HH:MM 24h" },
                      end: { type: "string", description: "HH:MM 24h" },
                    },
                    required: ["course", "day", "start", "end"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["entries"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_timetable" } },
    });

    const call = result?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : { entries: [] };
    return args as {
      entries: Array<{
        course: string;
        code?: string;
        lecturer?: string;
        venue?: string;
        day: string;
        start: string;
        end: string;
      }>;
    };
  });

export const generateStudyPlan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data }) => {
    const result = await callLovableAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are Forge, an academic life coach. Build THREE distinct full-week timetable VARIANTS for the student. Each variant must cover the full week and include EVERY activity type: classes (from their schedule), study sessions (60–120min with breaks), sleep blocks (one per day, can wrap past midnight by ending at 23:59 and starting 00:00 next day if needed — but prefer ending day at sleep start), short breaks between heavy blocks, free-time placeholders for rest/exercise/meals, and 2–4 task blocks (errands, assignments, prep). Vary the three variants meaningfully: variant 1 = Deep-focus (long deep blocks, fewer breaks), variant 2 = Balanced (mix of moderate sessions, generous breaks), variant 3 = Light & flexible (shorter sessions, more free time). Always call the tool.",
        },
        { role: "user", content: data.context },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_study_plan",
            description: "Save 3 weekly timetable variants",
            parameters: {
              type: "object",
              properties: {
                variants: {
                  type: "array",
                  description: "Exactly 3 timetable variants",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string", description: "Short variant name e.g. 'Deep focus'" },
                      rationale: { type: "string", description: "1-2 sentences on why this variant suits the student" },
                      sessions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            day: { type: "string", enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
                            start: { type: "string", description: "HH:MM 24h" },
                            end: { type: "string", description: "HH:MM 24h" },
                            type: { type: "string", enum: ["class", "study", "break", "sleep", "free", "task"] },
                            subject: { type: "string", description: "Subject or activity title" },
                            focus: { type: "string", description: "What to do in this block" },
                            intensity: { type: "string", enum: ["light", "moderate", "deep"] },
                          },
                          required: ["day", "start", "end", "type", "subject", "focus", "intensity"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["label", "rationale", "sessions"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["variants"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_study_plan" } },
    });

    const call = result?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments
      ? JSON.parse(call.function.arguments)
      : { variants: [] };
    return args as {
      variants: Array<{
        label: string;
        rationale: string;
        sessions: Array<{
          day: string;
          start: string;
          end: string;
          type: "class" | "study" | "break" | "sleep" | "free" | "task";
          subject: string;
          focus: string;
          intensity: "light" | "moderate" | "deep";
        }>;
      }>;
    };
  });

// ===== Conversational Ask Forge =====

const ChatMessage = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const AskInput = z.object({
  messages: z.array(ChatMessage).min(1).max(40),
  schedule: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.string(),
    day: z.number(),
    start: z.number(),
    end: z.number(),
    subject: z.string().optional(),
  })).max(200),
});

export const askForge = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AskInput.parse(d))
  .handler(async ({ data }) => {
    const dayName = (d: number) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d] ?? "Mon";
    const fmt = (m: number) => `${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;
    const scheduleSnapshot = data.schedule.length === 0
      ? "(empty calendar)"
      : data.schedule.map((s) => `- ${s.id} | ${dayName(s.day)} ${fmt(s.start)}-${fmt(s.end)} | ${s.type} | ${s.title}${s.subject ? ` (${s.subject})` : ""}`).join("\n");

    const result = await callLovableAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are Forge, a friendly conversational study coach. The student can chat with you to reschedule, cancel, add, or move blocks on their weekly calendar. 

CURRENT CALENDAR (id | day time | type | title):
${scheduleSnapshot}

GUIDELINES:
- When the user wants to change anything (move, cancel, add, reschedule), call propose_schedule_changes with concrete operations referencing existing ids when applicable.
- For purely conversational questions (advice, planning), reply with a short helpful message and DO NOT call the tool.
- Always include a brief 'reply' summary explaining what you're proposing.
- Times are 24h HH:MM. Days are Mon-Sun.
- Never invent ids — only use ids from the snapshot for update/delete.`,
        },
        ...data.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "propose_schedule_changes",
            description: "Propose a set of edits to the student's weekly calendar. The user will preview and confirm before anything saves.",
            parameters: {
              type: "object",
              properties: {
                reply: { type: "string", description: "Short message to the user explaining the proposal" },
                operations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      op: { type: "string", enum: ["add", "update", "delete"] },
                      id: { type: "string", description: "Required for update/delete; omit for add" },
                      day: { type: "string", enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
                      start: { type: "string", description: "HH:MM 24h" },
                      end: { type: "string", description: "HH:MM 24h" },
                      type: { type: "string", enum: ["class", "study", "break", "sleep", "free", "task"] },
                      title: { type: "string" },
                    },
                    required: ["op"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["reply", "operations"],
              additionalProperties: false,
            },
          },
        },
      ],
    });

    const msg = result?.choices?.[0]?.message;
    const call = msg?.tool_calls?.[0];
    if (call?.function?.arguments) {
      const args = JSON.parse(call.function.arguments);
      return { reply: args.reply ?? "Here's what I propose:", operations: args.operations ?? [] };
    }
    return { reply: msg?.content ?? "I'm not sure how to help with that.", operations: [] };
  });

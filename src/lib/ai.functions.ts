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
            "You are Forge, an academic study coach. Generate a balanced weekly study plan for the student. Consider workload, free periods, sleep, exams, and burnout. Keep sessions 60–120min with breaks. Always call the tool.",
        },
        { role: "user", content: data.context },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_study_plan",
            description: "Save a generated weekly study plan",
            parameters: {
              type: "object",
              properties: {
                rationale: { type: "string", description: "Short explanation of why this plan was generated (2-3 sentences)" },
                sessions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string", enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
                      start: { type: "string" },
                      end: { type: "string" },
                      subject: { type: "string" },
                      focus: { type: "string", description: "What to focus on in this session" },
                      intensity: { type: "string", enum: ["light", "moderate", "deep"] },
                    },
                    required: ["day", "start", "end", "subject", "focus", "intensity"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["rationale", "sessions"],
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
      : { rationale: "", sessions: [] };
    return args as {
      rationale: string;
      sessions: Array<{
        day: string;
        start: string;
        end: string;
        subject: string;
        focus: string;
        intensity: "light" | "moderate" | "deep";
      }>;
    };
  });

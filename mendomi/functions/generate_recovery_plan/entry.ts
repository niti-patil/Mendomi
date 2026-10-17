const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SCHEMA = {
  type: "object",
  properties: {
    diagnosis: { type: "string", description: "Primary diagnosis in plain language" },
    procedure: { type: "string", description: "Procedure or surgery performed" },
    recovery_duration_days: { type: "number", description: "Recovery duration in days as stated or implied by the document (default 14)" },
    summary: { type: "string", description: "Warm, encouraging 2-3 sentence summary of what happened and what recovery involves" },
    restrictions: { type: "array", items: { type: "string" }, description: "Activity and dietary restrictions" },
    follow_up_info: { type: "string", description: "Follow-up instructions" },
    medications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          dosage: { type: "string" },
          frequency: { type: "string" },
          instructions: { type: "string" },
          purpose: { type: "string" },
          reminders: { type: "array", items: { type: "string" }, description: "HH:MM times" }
        }
      }
    },
    daily_tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          category: { type: "string", enum: ["medication", "activity", "self_care", "check_in"] },
          scheduled_time: { type: "string", description: "HH:MM or empty" },
          recurring: { type: "boolean" }
        }
      }
    },
    appointment: {
      type: "object",
      properties: {
        title: { type: "string" },
        provider: { type: "string" },
        location: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD or empty if none" },
        time: { type: "string", description: "HH:MM or empty" },
        notes: { type: "string" }
      },
      description: "Follow-up appointment if mentioned, else null"
    },
    field_confidence: {
      type: "object",
      description: "Confidence per field 0-1 (1=clearly stated, <0.6=inferred/unclear)",
      "properties": {
        "diagnosis": { "type": "number" },
        "procedure": { "type": "number" },
        "medications": { "type": "number" },
        "restrictions": { "type": "number" },
        "appointment": { "type": "number" }
      }
    }
  }
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const fileUrls = Array.isArray(body.file_urls) ? body.file_urls.filter(Boolean) : (body.file_url ? [body.file_url] : []);
    if (!fileUrls.length) return Response.json({ error: "file_url is required" }, { status: 400 });

    const prompt = `You are Mendy, a compassionate post-surgical recovery assistant. A patient has uploaded their hospital discharge paperwork (or pasted a link to it). Carefully read the document and extract the key information.

Return structured JSON with:
- diagnosis: the main diagnosis understandable to a patient
- procedure: the surgery or procedure performed
- recovery_duration_days: the recovery duration in days as stated in the document (e.g. 42 for 6 weeks). If not stated, infer a sensible default based on the procedure (e.g. 14 for minor, 42 for major surgery).
- summary: a warm, encouraging 2-3 sentence explanation of what happened and what recovery will involve
- restrictions: list of activity/dietary restrictions as short phrases
- follow_up_info: follow-up care instructions
- medications: each medication with name, dosage, frequency (e.g. "Every 8 hours"), instructions (e.g. "Take with food"), purpose, and reminders as HH:MM times
- daily_tasks: a sensible daily recovery plan derived from the instructions (medications, walks, hydration, dressing changes, pain check-ins, rest). Use clear patient-friendly titles. Mark recurring true for daily items.
- appointment: the follow-up appointment if explicitly mentioned, otherwise null

If a field is not present in the document, infer sensible recovery defaults but keep it conservative. Always generate at least: medication tasks, "Walk 20 minutes", "Drink 8 glasses of water", "Pain check-in", and any wound-care task.

Also return field_confidence: for each of diagnosis, procedure, medications, restrictions, appointment, give a score 0-1 reflecting how clearly it was stated in the source (1 = explicitly stated, 0.6 = partially inferred, 0.3 = guessed/defaulted, 0 = not found).`;

    const result = await db.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: fileUrls,
      response_json_schema: SCHEMA,
      model: "gemini_3_flash"
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
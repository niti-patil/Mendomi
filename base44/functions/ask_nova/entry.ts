const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string", description: "Clear, supportive answer grounded in the patient's discharge instructions" },
    is_urgent: { type: "boolean", description: "True if the question describes an emergency or red-flag symptom" },
    urgent_reason: { type: "string", description: "Why it's urgent and what to do, if is_urgent" },
    suggestions: { type: "array", items: { type: "string" }, description: "Practical recovery tips" }
  }
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const question = (body.question || "").toString().trim();
    const dischargeText = (body.discharge_text || "").toString();

    if (!question) return Response.json({ error: "question is required" }, { status: 400 });

    const prompt = `You are Nova, a warm and knowledgeable post-surgical recovery assistant. A patient is asking you a question. Use their discharge instructions below as your primary source of truth. If the answer isn't in the instructions, give safe general guidance.

DISCHARGE INSTRUCTIONS:
${dischargeText || "(no discharge document uploaded yet)"}

PATIENT QUESTION: ${question}

Rules:
- Answer in plain, reassuring language.
- If the question mentions emergency red flags (severe bleeding, chest pain, difficulty breathing, signs of infection like fever over 101°F with increasing pain, sudden swelling, inability to urinate, or any "when to seek urgent care" trigger from the discharge doc), set is_urgent true and tell them to contact their surgeon or go to the ER.
- Otherwise keep is_urgent false and give a helpful answer plus 1-3 practical suggestions.
- Never diagnose or replace a doctor. Encourage calling the care team when unsure.`;

    const result = await db.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMA
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
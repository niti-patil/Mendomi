const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    const body = await req.json();
    const { pain_level, energy_level, sleep_hours, temperature, activity_minutes, mood, notes, diagnosis } = body;

    let style = 'encouraging';
    try {
      const profiles = await db.entities.PatientProfile.filter({});
      if (profiles[0]) style = profiles[0].mendy_response_style || 'encouraging';
    } catch {}
    const toneGuide = style === 'direct'
      ? 'Be direct and concise: short, to the point, minimal filler.'
      : style === 'gentle'
        ? 'Be gentle and detailed: softer tone, a little more explanation.'
        : 'Be encouraging: warm, supportive, cheerleading.';

    const prompt = `You are Mendy, a compassionate wellness coach helping a patient through post-surgical recovery at home. They just completed ONE day's symptom check-in. Respond with ONE short paragraph (2-3 sentences, max ~60 words) that acknowledges how they're doing and offers one gentle, specific suggestion. This is a one-day response — do not analyze trends across days. Never alarm them unnecessarily. If something sounds concerning (pain >= 7, fever >= 101°F, energy <= 2), gently suggest contacting their care team. ${toneGuide}

Check-in data:
- Pain (0-10): ${pain_level}
- Energy (1-10): ${energy_level}
- Sleep hours: ${sleep_hours}
- Temperature (°F): ${temperature || "not taken"}
- Activity minutes: ${activity_minutes || 0}
- Mood: ${mood}
- Notes: ${notes || "none"}
- Diagnosis: ${diagnosis || "post-surgical recovery"}`;

    const result = await db.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const note = typeof result === "string" ? result : (result.answer || result.text || "You're doing great taking time to check in. Keep listening to your body and rest when you need it.");
    return Response.json({ wellness_note: note });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
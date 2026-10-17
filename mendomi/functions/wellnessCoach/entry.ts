const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      date, pain_level, energy_level, sleep_hours, temperature,
      activity_minutes, mood, took_medications, notes
    } = body;

    if (date === undefined || pain_level === undefined) {
      return Response.json({ error: 'date and pain_level are required' }, { status: 400 });
    }

    // urgent: severe pain, fever (>=100.4F), or very low energy
    let urgent = false;
    const reasons = [];
    if (pain_level >= 8) { urgent = true; reasons.push('pain level 8 or above'); }
    if (temperature && temperature >= 100.4) { urgent = true; reasons.push('fever 100.4°F or above'); }
    if (energy_level && energy_level <= 2) { urgent = true; reasons.push('very low energy'); }

    const prompt = `You are Mendy, a warm, supportive post-surgery wellness coach. A patient just submitted their daily check-in:
- Pain level: ${pain_level}/10
- Energy level: ${energy_level}/10
- Sleep: ${sleep_hours} hours
- Temperature: ${temperature ? temperature + '°F' : 'not provided'}
- Activity: ${activity_minutes || 0} minutes
- Mood: ${mood || 'not provided'}
- Took medications as prescribed: ${took_medications ? 'yes' : 'no'}
- Notes: ${notes || 'none'}

Write a short (2-3 sentence) empathetic, encouraging response. Acknowledge how they are doing, give one gentle practical suggestion, and reassure them. Do not give formal medical diagnoses. If anything suggests danger (severe pain, fever, signs of infection), briefly urge them to contact their care team. Keep it warm and human.`;

    const aiResponse = await db.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash'
    });

    let responseText = '';
    if (urgent) {
      responseText = `⚠️ Please reach out to your care team soon — your check-in shows ${reasons.join(', ')}. `;
    }
    responseText += (typeof aiResponse === 'string') ? aiResponse : (aiResponse?.response || aiResponse?.message || JSON.stringify(aiResponse));

    const checkin = await db.entities.SymptomCheckin.create({
      date, pain_level, energy_level, sleep_hours, temperature,
      activity_minutes, mood, took_medications, notes,
      ai_response: responseText,
      urgent_flag: urgent
    });

    return Response.json({ checkin, ai_response: responseText, urgent_flag: urgent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
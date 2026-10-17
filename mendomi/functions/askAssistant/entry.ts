const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isUrgent, URGENT_REASON } from '../../shared/urgentDetection.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const question = body.question;
    if (!question || typeof question !== 'string' || question.length > 1000) {
      return Response.json({ error: 'A question (max 1000 chars) is required' }, { status: 400 });
    }

    // Load the patient's discharge context
    const docs = await db.entities.DischargeDocument.filter({ status: 'extracted' });
    const profile = (await db.entities.PatientProfile.filter({}))[0] || {};
    const medications = await db.entities.Medication.list('-created_date', 50);
    const appointments = await db.entities.Appointment.list('date', 20);

    const context = {
      profile: {
        surgery_type: profile.surgery_type, surgery_date: profile.surgery_date,
        diagnosis: profile.diagnosis, surgeon: profile.surgeon, hospital: profile.hospital,
        restrictions: profile.restrictions_summary
      },
      discharge_summaries: docs.map((d) => ({
        diagnosis: d.diagnosis, restrictions: d.restrictions, activity_guidelines: d.activity_guidelines,
        care_instructions: d.care_instructions, warning_signs: d.warning_signs
      })),
      medications: medications.map((m) => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, instructions: m.instructions })),
      appointments: appointments.map((a) => ({ title: a.title, date: a.date, time: a.time, provider: a.provider }))
    };

    const urgent = isUrgent(question);
    const style = profile.mendy_response_style || 'encouraging';
    const toneGuide = style === 'direct'
      ? 'Be direct and concise: short, to the point, minimal filler.'
      : style === 'gentle'
        ? 'Be gentle and detailed: softer tone, a little more explanation.'
        : 'Be encouraging: warm, supportive, cheerleading.';

    const hasDischarge = docs.length > 0;
    const noPapersRule = !hasDischarge
      ? 'NO_DISCHARGE_PAPERS: The patient has NOT uploaded discharge papers. You MAY answer GENERAL recovery questions (rest, hydration, gentle movement, general wound-care basics, what to ask a doctor). If the question is SPECIFIC to their own recovery (their medications, dosing, activity limits, their surgery, their wound, procedure-specific symptoms or restrictions), DO NOT answer it — reply exactly: "I can\'t answer that without your discharge papers — please upload them for accurate advice about your specific recovery." Then end with the general-guidance closing line below. '
      : '';

    const prompt = `You are "Mendy", a friendly AI recovery companion for a post-surgery patient at home. Answer everyday recovery questions using the patient's OWN discharge instructions and recovery data below as the primary source, supplemented by general patient-education knowledge. Be clear and concise (2-4 sentences). ${toneGuide} This tone setting changes ONLY how you phrase things — never what medical information you include. ${noPapersRule}

If the question is not covered by their discharge data, say you don't have that in their discharge instructions and suggest they ask their care team. Never invent specific medical advice or dosing.

IMPORTANT — URGENCY: If the question mentions urgent symptoms (chest pain, trouble breathing, severe bleeding, high fever, signs of infection, fainting, sudden numbness, uncontrollable pain, leg swelling), prioritize safety — tell them to contact their care team or seek urgent care immediately.

Every response MUST end with a short final line distinguishing general guidance from care-team situations, e.g. "This is general guidance — for anything concerning, contact your care team." If the situation is urgent, that line should say to seek urgent care.

Patient recovery context (JSON):
${JSON.stringify(context)}

Patient question: ${question}`;

    const aiResponse = await db.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash'
    });

    let answer = (typeof aiResponse === 'string') ? aiResponse : (aiResponse?.response || aiResponse?.answer || '');

    await db.entities.Conversation.create({ role: 'user', content: question, urgent_flag: urgent, context_type: 'assistant' });
    await db.entities.Conversation.create({ role: 'assistant', content: answer, urgent_flag: urgent, context_type: 'assistant' });

    return Response.json({ answer, urgent_flag: urgent, urgent_reason: urgent ? URGENT_REASON : null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
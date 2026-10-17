const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { extractionSchema, buildExtractionPrompt, buildTasksFromExtraction } from '../../shared/recoveryPlan.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const file_url = body.file_url;
    const file_name = body.file_name || 'discharge_document';
    if (!file_url || typeof file_url !== 'string') {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    const doc = await db.entities.DischargeDocument.create({
      file_url,
      file_name,
      status: 'pending'
    });

    const llm = await db.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildExtractionPrompt(),
      file_urls: [file_url],
      response_json_schema: extractionSchema
    });

    const extracted = llm && llm.medications !== undefined ? llm : (llm && llm.output) || llm || {};

    await db.entities.DischargeDocument.update(doc.id, {
      status: 'extracted',
      extracted_json: extracted,
      diagnosis: extracted.diagnosis || '',
      surgery_type: extracted.surgery_type || '',
      surgery_date: extracted.surgery_date || '',
      surgeon: extracted.surgeon || '',
      hospital: extracted.hospital || '',
      restrictions: extracted.restrictions || [],
      activity_guidelines: extracted.activity_guidelines || [],
      care_instructions: extracted.care_instructions || [],
      warning_signs: extracted.warning_signs || []
    });

    const profiles = await db.entities.PatientProfile.filter({});
    if (profiles.length > 0) {
      const p = profiles[0];
      await db.entities.PatientProfile.update(p.id, {
        diagnosis: extracted.diagnosis || p.diagnosis || '',
        surgery_type: extracted.surgery_type || p.surgery_type || '',
        surgery_date: extracted.surgery_date || p.surgery_date || '',
        surgeon: extracted.surgeon || p.surgeon || '',
        hospital: extracted.hospital || p.hospital || '',
        restrictions_summary: (extracted.restrictions || []).join('; ')
      });
    }

    const createdMeds = [];
    for (const med of (extracted.medications || [])) {
      const m = await db.entities.Medication.create({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency || '',
        schedule_times: med.schedule_times || [],
        instructions: med.instructions || '',
        purpose: med.purpose || '',
        start_date: extracted.surgery_date || new Date().toISOString().slice(0, 10),
        active: true
      });
      createdMeds.push(m);
    }

    for (const appt of (extracted.follow_up_appointments || [])) {
      if (!appt.date) continue;
      await db.entities.Appointment.create({
        title: appt.title || appt.reason || 'Follow-up appointment',
        date: appt.date,
        time: appt.time || '',
        provider: appt.provider || '',
        location: appt.location || '',
        reason: appt.reason || '',
        completed: false
      });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const taskSpecs = buildTasksFromExtraction(extracted, dateStr, 0);
    const tasksWithMedId = taskSpecs.map((t) => {
      if (t.type === 'medication' && createdMeds.length) {
        const match = createdMeds.find((m) => t.title.toLowerCase().includes(m.name.toLowerCase()));
        if (match) t.medication_id = match.id;
      }
      return t;
    });
    if (tasksWithMedId.length) {
      await db.entities.Task.bulkCreate(tasksWithMedId);
    }

    return Response.json({ document_id: doc.id, extracted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
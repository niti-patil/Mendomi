const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public read-only endpoint: anyone with the share_token can view this report.
// No auth — returns only the report fields needed to render the printable view.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch (_) {}
    const token = (body.token || '').trim();
    if (!token || token.length < 10) return Response.json({ error: 'Invalid link' }, { status: 400 });

    const matches = await db.asServiceRole.entities.DoctorReport.filter({ share_token: token });
    const report = matches[0];
    if (!report || !report.shared) return Response.json({ error: 'Report not found or no longer shared' }, { status: 404 });

    let profile = {};
    try { profile = (await db.asServiceRole.entities.PatientProfile.filter({}))[0] || {}; } catch (_) {}

    return Response.json({
      data: {
        generated_date: report.generated_date,
        period_start: report.period_start,
        period_end: report.period_end,
        days_tracked: report.days_tracked,
        included_sections: report.included_sections,
        medication_adherence_pct: report.medication_adherence_pct,
        scheduled_doses: report.scheduled_doses,
        taken_doses: report.taken_doses,
        pain_first: report.pain_first,
        pain_recent: report.pain_recent,
        pain_trend_label: report.pain_trend_label,
        pain_series: report.pain_series || [],
        poor_sleep_count: report.poor_sleep_count,
        nights_logged: report.nights_logged,
        avg_walk_minutes: report.avg_walk_minutes,
        walk_target: report.walk_target,
        walk_days_met: report.walk_days_met,
        fever_days: report.fever_days || [],
        concern_notes: report.concern_notes || [],
        ai_summary: report.ai_summary || '',
        patient_name: profile.full_name || '',
        surgery_type: profile.surgery_type || '',
        surgery_date: profile.surgery_date || '',
        surgeon: profile.surgeon || ''
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
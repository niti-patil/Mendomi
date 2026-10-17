const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SECTION_KEYS = ['medication', 'pain', 'sleep', 'activity', 'flags', 'summary'];
const FEVER_F = 100.4;
const POOR_SLEEP_HOURS = 5;
const DEFAULT_WALK_TARGET = 20;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const included = {};
    for (const k of SECTION_KEYS) included[k] = body.includedSections ? !!body.includedSections[k] : true;

    const profile = (await db.entities.PatientProfile.filter({}))[0] || {};
    const priorReports = await db.entities.DoctorReport.list('-generated_date', 50);
    const lastReport = priorReports[0];

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    let startStr;
    if (lastReport && lastReport.generated_date) {
      const d = new Date(lastReport.generated_date + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      startStr = d.toISOString().slice(0, 10);
    } else if (profile.surgery_date) {
      startStr = profile.surgery_date;
    } else {
      const d = new Date(); d.setDate(d.getDate() - 30);
      startStr = d.toISOString().slice(0, 10);
    }
    if (startStr > todayStr) startStr = todayStr;

    const tasks = await db.entities.DailyTask.list('-task_date', 500);
    const checkins = await db.entities.SymptomCheckin.list('-date', 120);
    const inRange = (d) => d && d >= startStr && d <= todayStr;

    const medTasks = tasks.filter((t) => t.category === 'medication' && inRange(t.task_date));
    const scheduledDoses = medTasks.length;
    const takenDoses = medTasks.filter((t) => t.completed).length;
    const medAdherence = scheduledDoses ? Math.round((takenDoses / scheduledDoses) * 100) : 0;

    const periodCheckins = checkins.filter((c) => inRange(c.date)).sort((a, b) => (a.date < b.date ? -1 : 1));
    const painPoints = periodCheckins.filter((c) => c.pain_level != null).map((c) => ({ date: c.date, pain: c.pain_level }));
    const painFirst = painPoints.length ? painPoints[0].pain : null;
    const painRecent = painPoints.length ? painPoints[painPoints.length - 1].pain : null;
    let painLabel = 'stable';
    if (painFirst != null && painRecent != null) {
      const diff = painRecent - painFirst;
      if (diff <= -2) painLabel = 'improving';
      else if (diff >= 2) painLabel = 'worsening';
      else painLabel = 'stable';
    }

    const sleepCheckins = periodCheckins.filter((c) => c.sleep_hours != null);
    const nightsLogged = sleepCheckins.length;
    const poorSleepCount = sleepCheckins.filter((c) => c.sleep_hours < POOR_SLEEP_HOURS).length;

    // Walk target from discharge activity guidelines
    const docs = await db.entities.DischargeDocument.list('-created_date', 10);
    let walkTarget = DEFAULT_WALK_TARGET;
    for (const doc of docs) {
      const lines = [].concat(doc.activity_guidelines || []);
      for (const line of lines) {
        const m = String(line).match(/(\d+)\s*min/i);
        if (m) { walkTarget = parseInt(m[1], 10); break; }
      }
      if (walkTarget !== DEFAULT_WALK_TARGET) break;
    }
    const activityCheckins = periodCheckins.filter((c) => c.activity_minutes != null);
    const avgWalk = activityCheckins.length
      ? Math.round(activityCheckins.reduce((s, c) => s + c.activity_minutes, 0) / activityCheckins.length)
      : 0;
    const walkDaysMet = activityCheckins.filter((c) => c.activity_minutes >= walkTarget).length;

    const feverDays = periodCheckins.filter((c) => c.temperature != null && c.temperature >= FEVER_F).map((c) => c.date);
    const concernNotes = periodCheckins
      .filter((c) => c.urgent_flag && c.notes)
      .map((c) => `${c.date}: ${c.notes}`);

    const daysTracked = Math.max(1, Math.round((new Date(todayStr) - new Date(startStr)) / 86400000) + 1);

    // Build descriptive AI summary over included sections only
    const lines = [];
    lines.push(`Patient: ${profile.full_name || 'N/A'}${profile.surgery_type ? ', surgery: ' + profile.surgery_type : ''}${profile.surgery_date ? ' on ' + profile.surgery_date : ''}.`);
    lines.push(`Reporting period: ${startStr} to ${todayStr} (${daysTracked} days).`);
    if (included.medication) {
      lines.push(`Medication adherence: ${takenDoses} of ${scheduledDoses} scheduled doses taken (${medAdherence}%).`);
    }
    if (included.pain) {
      lines.push(`Pain: first logged ${painFirst ?? 'N/A'}/10, most recent ${painRecent ?? 'N/A'}/10, trend ${painLabel}. Series: ${JSON.stringify(painPoints)}.`);
    }
    if (included.sleep) {
      lines.push(`Sleep: ${poorSleepCount} poor nights (<${POOR_SLEEP_HOURS}h) out of ${nightsLogged} nights logged.`);
    }
    if (included.activity) {
      lines.push(`Activity: averaged ${avgWalk} walk minutes/day vs target ${walkTarget}; target met on ${walkDaysMet} of ${activityCheckins.length} logged days.`);
    }
    if (included.flags) {
      lines.push(`Symptom flags: ${feverDays.length} day(s) with fever (>=${FEVER_F}F)${feverDays.length ? ': ' + feverDays.join(', ') : ''}; ${concernNotes.length} patient-flagged concern note(s).`);
    }

    const prompt = `You are writing a short, plain-language recovery summary for a doctor based ONLY on the logged patient data below. Be strictly descriptive of what was logged. Do NOT diagnose, interpret causes, or recommend treatments. Keep it 3-5 sentences, neutral and factual. Use conversational clinical tone.

${lines.join('\n')}`;

    let aiSummary = '';
    if (included.summary) {
      const aiResponse = await db.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        model: 'gpt_5_mini'
      });
      aiSummary = (typeof aiResponse === 'string') ? aiResponse : (aiResponse?.response || aiResponse?.summary || '');
    }

    const record = await db.entities.DoctorReport.create({
      generated_date: todayStr,
      period_start: startStr,
      period_end: todayStr,
      days_tracked: daysTracked,
      included_sections: included,
      medication_adherence_pct: medAdherence,
      scheduled_doses: scheduledDoses,
      taken_doses: takenDoses,
      pain_first: painFirst,
      pain_recent: painRecent,
      pain_trend_label: painLabel,
      pain_series: painPoints,
      poor_sleep_count: poorSleepCount,
      nights_logged: nightsLogged,
      avg_walk_minutes: avgWalk,
      walk_target: walkTarget,
      walk_days_met: walkDaysMet,
      fever_days: feverDays,
      concern_notes: concernNotes,
      ai_summary: aiSummary,
      shared: false
    });

    return Response.json(record);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
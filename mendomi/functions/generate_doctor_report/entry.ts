const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();

    // gather data
    const [tasks, meds, checkins, appointments] = await Promise.all([
      db.entities.DailyTask.list("-task_date", 500),
      db.entities.Medication.list(),
      db.entities.SymptomCheckin.list("-checkin_date", 500),
      db.entities.Appointment.list("date", 500)
    ]);

    const today = todayStr();
    const daysTracked = new Set(checkins.map(c => c.checkin_date)).size || 1;

    // task adherence over last 14 days
    const since = new Date(); since.setDate(since.getDate() - 13);
    const sinceStr = since.toISOString().slice(0, 10);
    const windowTasks = tasks.filter(t => t.task_date >= sinceStr);
    const completedTasks = windowTasks.filter(t => t.completed).length;
    const taskAdherence = windowTasks.length ? Math.round((completedTasks / windowTasks.length) * 100) : 0;

    // medication adherence
    const medTasks = windowTasks.filter(t => t.category === "medication");
    const medDone = medTasks.filter(t => t.completed).length;
    const medAdherence = medTasks.length ? Math.round((medDone / medTasks.length) * 100) : 0;

    // symptom stats
    const sortedCheckins = [...checkins].sort((a, b) => a.checkin_date.localeCompare(b.checkin_date));
    const validPain = sortedCheckins.filter(c => c.pain_level != null);
    const validSleep = sortedCheckins.filter(c => c.sleep_hours != null);
    const validActivity = sortedCheckins.filter(c => c.activity_minutes != null);
    const avg = (arr) => arr.length ? Math.round((arr.reduce((s, x) => s + x, 0) / arr.length) * 10) / 10 : 0;
    const avgPain = avg(validPain.map(c => c.pain_level));
    const avgSleep = avg(validSleep.map(c => c.sleep_hours));
    const avgActivity = Math.round(validActivity.map(c => c.activity_minutes || 0).reduce((s, x) => s + x, 0) / (validActivity.length || 1));

    // pain trend (first half vs second half)
    let painTrend = "stable";
    if (validPain.length >= 4) {
      const mid = Math.floor(validPain.length / 2);
      const firstAvg = validPain.slice(0, mid).reduce((s, c) => s + c.pain_level, 0) / mid;
      const secondAvg = validPain.slice(mid).reduce((s, c) => s + c.pain_level, 0) / (validPain.length - mid);
      if (secondAvg < firstAvg - 0.7) painTrend = "improving";
      else if (secondAvg > firstAvg + 0.7) painTrend = "worsening";
    }

    const diagnosisInfo = await db.entities.DischargeDocument.list("-created_date", 1);
    const diagnosis = diagnosisInfo[0]?.diagnosis || "post-surgical recovery";

    // AI summary
    const summaryPrompt = `You are preparing a concise plain-language progress summary for a doctor at a follow-up visit. Based on this patient's recovery data, write 4-5 sentences covering: overall adherence, pain trend, sleep, activity, and any concerns to watch. Be factual, professional, and highlight anything that needs attention.

Recovery data:
- Diagnosis: ${diagnosis}
- Days with check-ins: ${daysTracked}
- Overall task adherence: ${taskAdherence}%
- Medication adherence: ${medAdherence}%
- Average pain (0-10): ${avgPain} — trend: ${painTrend}
- Average sleep (hours): ${avgSleep}
- Average daily activity (minutes): ${avgActivity}
- Recent check-in notes: ${sortedCheckins.slice(-5).map(c => c.notes).filter(Boolean).join(" | ") || "none"}`;

    const aiRes = await db.asServiceRole.integrations.Core.InvokeLLM({ prompt: summaryPrompt });
    const aiSummary = typeof aiRes === "string" ? aiRes : (aiRes.summary || aiRes.answer || "Recovery is progressing. Continue current plan and monitor symptoms.");

    const report = await db.entities.DoctorReport.create({
      generated_date: today,
      days_tracked: daysTracked,
      task_adherence_pct: taskAdherence,
      medication_adherence_pct: medAdherence,
      checkin_count: checkins.length,
      avg_pain: avgPain,
      pain_trend: painTrend,
      avg_sleep_hours: avgSleep,
      avg_activity_minutes: avgActivity,
      ai_summary: aiSummary
    });

    return Response.json({ report, appointments });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
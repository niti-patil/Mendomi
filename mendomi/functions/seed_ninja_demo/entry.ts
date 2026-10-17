const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.user_id;

    if (!targetUserId) {
      return Response.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Verify the user exists
    const users = await db.asServiceRole.entities.User.list();
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const ninjaUserId = targetUser.id;
    const ninjaEmail = targetUser.email || "demo@user.local";

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const dayOffset = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

    // Clear existing data for the target user
    const entities = ['PatientProfile', 'DischargeDocument', 'Medication', 'DailyTask', 'Appointment', 'SymptomCheckin', 'Conversation', 'DoctorReport', 'QueuedQuestion', 'AllergyMedication', 'VaccineRecord', 'MedicalRecord'];
    for (const e of entities) {
      try {
        const records = await db.asServiceRole.entities[e].filter({ created_by_id: ninjaUserId });
        if (records && records.length > 0) {
          await db.asServiceRole.entities[e].deleteMany({ _id: { $in: records.map(r => r.id) } });
        }
      } catch (err) {}
    }

    // Helper: create entity as the app user (plain client, RLS-compliant)
    const createEntity = async (entityName, data) => {
      return await db.entities[entityName].create(data);
    };
    const bulkCreateEntities = async (entityName, items) => {
      return await db.entities[entityName].bulkCreate(items);
    };

    // 1. Patient Profile
    await createEntity('PatientProfile', {
      full_name: "Ninja Patil",
      date_of_birth: "2010-07-01",
      phone: "(555) 123-4567",
      emergency_contact_name: "Maya Patil",
      emergency_contact_phone: "(555) 987-6543",
      surgery_type: "Appendectomy",
      surgery_date: "2026-07-20",
      diagnosis: "Acute appendicitis",
      surgeon: "Dr. Sarah Chen",
      hospital: "St. Mary's Medical Center",
      restrictions_summary: "No heavy lifting or strenuous activity for 6 weeks. Keep incision clean and dry.",
      onboarding_complete: true,
      hospital_name: "St. Mary's Medical Center",
      primary_doctor: "Dr. Sarah Chen",
      procedure_name: "Laparoscopic appendectomy",
      procedure_date: "2026-07-20",
      insurance_provider: "Blue Cross Blue Shield",
      insurance_member_id: "BCB123456789",
      time_zone: "America/Los_Angeles",
      notification_email: ninjaEmail,
      email_opt_in: true,
      medication_reminders: true,
      daily_checkin_reminders: true,
      appointment_reminders: true,
      mendy_response_style: "encouraging"
    });

    // 2. Discharge Document
    await createEntity('DischargeDocument', {
      file_url: "",
      file_name: "discharge_summary.pdf",
      status: "extracted",
      diagnosis: "Acute appendicitis",
      surgery_type: "Laparoscopic appendectomy",
      surgery_date: "2026-07-20",
      surgeon: "Dr. Sarah Chen",
      hospital: "St. Mary's Medical Center",
      restrictions: ["No heavy lifting over 10 lbs for 6 weeks", "No swimming or bathing until incision heals", "No driving while taking pain medication"],
      activity_guidelines: ["Walk daily, gradually increasing distance", "Light stretching after 2 weeks", "Avoid strenuous exercise for 6 weeks"],
      care_instructions: ["Keep incision clean and dry", "Change bandage daily", "Monitor for signs of infection"],
      warning_signs: ["Fever above 101°F", "Increasing pain or redness at incision site", "Nausea or vomiting", "Yellow or green drainage from incision"]
    });

    // 3. Medications
    const med1 = await createEntity('Medication', {
      name: "Acetaminophen", dosage: "500 mg", frequency: "Every 6 hours as needed",
      schedule_times: ["08:00", "14:00", "20:00", "02:00"],
      instructions: "Take with food. Do not exceed 3000 mg per day.",
      purpose: "Pain relief", start_date: "2026-07-20", end_date: dayOffset(14), active: true
    });
    const med2 = await createEntity('Medication', {
      name: "Cephalexin", dosage: "500 mg", frequency: "Every 8 hours",
      schedule_times: ["08:00", "16:00", "00:00"],
      instructions: "Take with plenty of water. Complete the full course.",
      purpose: "Antibiotic to prevent infection", start_date: "2026-07-20", end_date: "2026-07-27", active: true
    });

    // 4. Daily Tasks
    const taskTemplates = [
      { title: "Take Acetaminophen (500 mg)", category: "medication", scheduled_time: "08:00", order: 1, medication_id: med1.id },
      { title: "Take Cephalexin (500 mg)", category: "medication", scheduled_time: "08:00", order: 2, medication_id: med2.id },
      { title: "Morning walk", category: "activity", scheduled_time: "09:00", order: 3 },
      { title: "Change incision bandage", category: "self_care", scheduled_time: "10:00", order: 4 },
      { title: "Symptom check-in", category: "check_in", scheduled_time: "18:00", order: 5 }
    ];
    const allTasks = [];
    for (let d = -7; d <= 7; d++) {
      const isPast = d < 0;
      for (const t of taskTemplates) {
        if (t.medication_id === med2.id && d > -10) continue;
        allTasks.push({
          ...t,
          task_date: dayOffset(d),
          completed: isPast,
          completed_at: isPast ? new Date(now.getTime() + d * 86400000).toISOString() : null,
          recurring: true
        });
      }
    }
    await bulkCreateEntities('DailyTask', allTasks);

    // 5. Appointments
    await createEntity('Appointment', {
      title: "Post-surgery follow-up", date: dayOffset(7), time: "10:00",
      provider: "Dr. Sarah Chen", location: "St. Mary's Medical Center, Suite 200",
      reason: "Incision check and recovery assessment", notes: "Bring discharge papers and medication list", completed: false
    });
    await createEntity('Appointment', {
      title: "Suture removal", date: dayOffset(14), time: "14:00",
      provider: "Dr. Sarah Chen", location: "St. Mary's Medical Center, Suite 200",
      reason: "Remove surgical sutures", completed: false
    });

    // 6. Symptom Check-ins
    const checkins = [];
    for (let i = 6; i >= 1; i--) {
      checkins.push({
        date: dayOffset(-i), pain_level: Math.max(3, 7 - i), energy_level: Math.min(5, 2 + Math.floor(i / 2)),
        sleep_hours: 6 + (i % 3), temperature: 98.6, activity_minutes: 10 + i * 2,
        mood: i > 4 ? "okay" : "good", took_medications: true,
        notes: i > 4 ? "Still feeling sore but improving." : "Feeling much better today.",
        urgent_flag: false
      });
    }
    await bulkCreateEntities('SymptomCheckin', checkins);

    // 7. Conversations
    const convos = [
      { role: "user", content: "When can I start exercising again?", context_type: "assistant" },
      { role: "assistant", content: "Based on your discharge summary, you should avoid strenuous exercise for 6 weeks after your appendectomy (July 20). However, you can start with light walking right away — gentle walking helps with recovery! After 2 weeks, you can add some light stretching. Always listen to your body and stop if you feel pain. I'd recommend discussing a specific exercise plan at your follow-up appointment with Dr. Chen.", context_type: "assistant" },
      { role: "user", content: "What should I do if my incision looks red?", context_type: "assistant" },
      { role: "assistant", content: "Some redness around the incision is normal as it heals. However, watch for these warning signs: spreading redness, increasing pain, warmth at the site, or yellow/green drainage. If you notice any of these, contact Dr. Chen's office right away. In the meantime, keep the area clean and dry, and change the bandage daily as instructed. A fever above 101°F along with redness is a reason to call immediately.", context_type: "assistant" },
      { role: "user", content: "Can I shower normally?", context_type: "assistant" },
      { role: "assistant", content: "You can shower 48 hours after surgery, but avoid soaking the incision. Use mild soap and let water run gently over the area. Pat dry — don't rub. Avoid baths, pools, or hot tubs until Dr. Chen confirms the incision is fully healed, usually at your 2-week follow-up.", context_type: "assistant" }
    ];
    for (const c of convos) {
      await createEntity('Conversation', c);
    }

    // 8. Queued Questions
    await bulkCreateEntities('QueuedQuestion', [
      { question: "When can I return to work?", added_from_chat: false, resolved: false },
      { question: "Is it normal to feel tired after surgery?", added_from_chat: false, resolved: false },
      { question: "When can I start swimming again?", added_from_chat: true, resolved: false }
    ]);

    // 9. Doctor Report
    const painSeries = [];
    for (let i = 6; i >= 0; i--) painSeries.push({ date: dayOffset(-i), pain: Math.max(3, 7 - i) });
    await createEntity('DoctorReport', {
      generated_date: today, period_start: dayOffset(-7), period_end: today, days_tracked: 7,
      included_sections: { medication: true, pain: true, sleep: true, activity: true, flags: true, summary: true },
      medication_adherence_pct: 95, scheduled_doses: 28, taken_doses: 27,
      pain_first: 6, pain_recent: 3, pain_trend_label: "improving", pain_series: painSeries,
      poor_sleep_count: 1, nights_logged: 7, avg_walk_minutes: 18, walk_target: 20, walk_days_met: 5,
      fever_days: [], concern_notes: [],
      ai_summary: "Ninja is recovering well from laparoscopic appendectomy. Pain has decreased from 6/10 to 3/10 over the past week. Medication adherence is excellent at 95%. Walking activity is approaching the target of 20 minutes daily. Sleep has been good with only one poor night. No signs of infection. Continue current recovery plan and attend follow-up appointment.",
      shared: false
    });

    return Response.json({ success: true, message: "Demo data seeded successfully", user_id: ninjaUserId });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
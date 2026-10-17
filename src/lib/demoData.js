// Static demo data for the "Explore as Ninja" mode.
// Served entirely client-side — no backend, no login, no RLS.

const now = new Date();
const dayOffset = (n) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const isoOffset = (n) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

export const DEMO_USER = {
  id: "demo-ninja",
  email: "ninja.demo@mendly.app",
  full_name: "Ninja Patil",
  role: "user",
  created_date: isoOffset(-7),
};

export const DEMO_PROFILE = {
  id: "demo-profile-1",
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
  notification_email: "ninja.demo@mendly.app",
  email_opt_in: true,
  medication_reminders: true,
  daily_checkin_reminders: true,
  appointment_reminders: true,
  mendy_response_style: "encouraging",
  caregiver_email: "",
  share_notes_with_caregiver: false,
  share_chat_with_caregiver: false,
  created_date: isoOffset(-7),
};

export const DEMO_DISCHARGE = {
  id: "demo-doc-1",
  file_url: "",
  file_name: "discharge_summary.pdf",
  status: "extracted",
  diagnosis: "Acute appendicitis",
  surgery_type: "Laparoscopic appendectomy",
  surgery_date: "2026-07-20",
  surgeon: "Dr. Sarah Chen",
  hospital: "St. Mary's Medical Center",
  restrictions: [
    "No heavy lifting over 10 lbs for 6 weeks",
    "No swimming or bathing until incision heals",
    "No driving while taking pain medication",
  ],
  activity_guidelines: [
    "Walk daily, gradually increasing distance",
    "Light stretching after 2 weeks",
    "Avoid strenuous exercise for 6 weeks",
  ],
  care_instructions: [
    "Keep incision clean and dry",
    "Change bandage daily",
    "Monitor for signs of infection",
  ],
  warning_signs: [
    "Fever above 101°F",
    "Increasing pain or redness at incision site",
    "Nausea or vomiting",
    "Yellow or green drainage from incision",
  ],
  created_date: isoOffset(-7),
};

export const DEMO_MEDICATIONS = [
  {
    id: "demo-med-1",
    name: "Acetaminophen",
    dosage: "500 mg",
    frequency: "Every 6 hours as needed",
    schedule_times: ["08:00", "14:00", "20:00", "02:00"],
    instructions: "Take with food. Do not exceed 3000 mg per day.",
    purpose: "Pain relief",
    start_date: "2026-07-20",
    end_date: dayOffset(14),
    active: true,
    created_date: isoOffset(-7),
  },
  {
    id: "demo-med-2",
    name: "Cephalexin",
    dosage: "500 mg",
    frequency: "Every 8 hours",
    schedule_times: ["08:00", "16:00", "00:00"],
    instructions: "Take with plenty of water. Complete the full course.",
    purpose: "Antibiotic to prevent infection",
    start_date: "2026-07-20",
    end_date: "2026-07-27",
    active: true,
    created_date: isoOffset(-7),
  },
];

const taskTemplates = [
  { title: "Take Acetaminophen (500 mg)", category: "medication", scheduled_time: "08:00", order: 1, medication_id: "demo-med-1" },
  { title: "Take Cephalexin (500 mg)", category: "medication", scheduled_time: "08:00", order: 2, medication_id: "demo-med-2" },
  { title: "Morning walk", category: "activity", scheduled_time: "09:00", order: 3 },
  { title: "Change incision bandage", category: "self_care", scheduled_time: "10:00", order: 4 },
  { title: "Symptom check-in", category: "check_in", scheduled_time: "18:00", order: 5 },
];

export const DEMO_TASKS = (() => {
  const tasks = [];
  let id = 0;
  for (let d = -7; d <= 7; d++) {
    const isPast = d < 0;
    const isToday = d === 0;
    for (const t of taskTemplates) {
      if (t.medication_id === "demo-med-2" && d > -10) continue;
      tasks.push({
        id: `demo-task-${id++}`,
        title: t.title,
        category: t.category,
        scheduled_time: t.scheduled_time || "",
        task_date: dayOffset(d),
        completed: isPast ? true : false,
        completed_at: isPast ? isoOffset(d) : "",
        order: t.order || 0,
        medication_id: t.medication_id || "",
        recurring: true,
        created_date: isoOffset(-7),
      });
    }
  }
  return tasks;
})();

export const DEMO_APPOINTMENTS = [
  {
    id: "demo-appt-1",
    title: "Post-surgery follow-up",
    date: dayOffset(7),
    time: "10:00",
    provider: "Dr. Sarah Chen",
    location: "St. Mary's Medical Center, Suite 200",
    reason: "Incision check and recovery assessment",
    notes: "Bring discharge papers and medication list",
    completed: false,
    created_date: isoOffset(-7),
  },
  {
    id: "demo-appt-2",
    title: "Suture removal",
    date: dayOffset(14),
    time: "14:00",
    provider: "Dr. Sarah Chen",
    location: "St. Mary's Medical Center, Suite 200",
    reason: "Remove surgical sutures",
    notes: "",
    completed: false,
    created_date: isoOffset(-7),
  },
];

export const DEMO_CHECKINS = (() => {
  const checkins = [];
  for (let i = 6; i >= 1; i--) {
    checkins.push({
      id: `demo-checkin-${i}`,
      date: dayOffset(-i),
      pain_level: Math.max(3, 7 - i),
      energy_level: Math.min(5, 2 + Math.floor(i / 2)),
      sleep_hours: 6 + (i % 3),
      temperature: 98.6,
      activity_minutes: 10 + i * 2,
      mood: i > 4 ? "okay" : "good",
      took_medications: true,
      notes: i > 4 ? "Still feeling sore but improving." : "Feeling much better today.",
      ai_response: "",
      urgent_flag: false,
      created_date: isoOffset(-i),
    });
  }
  return checkins;
})();

const isoAt = (n, h, m = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const DEMO_CONVERSATIONS = [
  { id: "demo-conv-1", role: "user", content: "When can I start exercising again?", context_type: "assistant", urgent_flag: false, created_date: isoAt(-5, 10, 0) },
  { id: "demo-conv-2", role: "assistant", content: "Based on your discharge summary, you should avoid strenuous exercise for 6 weeks after your appendectomy (July 20). However, you can start with light walking right away — gentle walking helps with recovery! After 2 weeks, you can add some light stretching. Always listen to your body and stop if you feel pain. I'd recommend discussing a specific exercise plan at your follow-up appointment with Dr. Chen.", context_type: "assistant", urgent_flag: false, created_date: isoAt(-5, 10, 1) },
  { id: "demo-conv-3", role: "user", content: "What should I do if my incision looks red?", context_type: "assistant", urgent_flag: false, created_date: isoAt(-3, 14, 0) },
  { id: "demo-conv-4", role: "assistant", content: "Some redness around the incision is normal as it heals. However, watch for these warning signs: spreading redness, increasing pain, warmth at the site, or yellow/green drainage. If you notice any of these, contact Dr. Chen's office right away. In the meantime, keep the area clean and dry, and change the bandage daily as instructed. A fever above 101°F along with redness is a reason to call immediately.", context_type: "assistant", urgent_flag: false, created_date: isoAt(-3, 14, 1) },
  { id: "demo-conv-5", role: "user", content: "Can I shower normally?", context_type: "assistant", urgent_flag: false, created_date: isoAt(-1, 9, 0) },
  { id: "demo-conv-6", role: "assistant", content: "You can shower 48 hours after surgery, but avoid soaking the incision. Use mild soap and let water run gently over the area. Pat dry — don't rub. Avoid baths, pools, or hot tubs until Dr. Chen confirms the incision is fully healed, usually at your 2-week follow-up.", context_type: "assistant", urgent_flag: false, created_date: isoAt(-1, 9, 1) },
  { id: "demo-conv-7", role: "user", content: "I have a high fever and my incision is warm to the touch", context_type: "assistant", urgent_flag: true, created_date: isoAt(0, 16, 0) },
  { id: "demo-conv-8", role: "assistant", content: "This sounds like it could be a sign of infection — you need to contact your care team or go to urgent care right away. Do not wait. A fever above 101°F combined with warmth, increasing redness, or swelling at the incision site can indicate a post-surgical infection that may need antibiotics. Call Dr. Chen's office now or go to the nearest emergency room. This is general guidance — seek urgent care immediately.", context_type: "assistant", urgent_flag: true, created_date: isoAt(0, 16, 1) },
];

export const DEMO_QUESTIONS = [
  { id: "demo-q-1", question: "When can I return to work?", added_from_chat: false, resolved: false, created_date: isoOffset(-5) },
  { id: "demo-q-2", question: "Is it normal to feel tired after surgery?", added_from_chat: false, resolved: false, created_date: isoOffset(-3) },
  { id: "demo-q-3", question: "When can I start swimming again?", added_from_chat: true, resolved: false, created_date: isoOffset(-1) },
];

export const DEMO_REPORTS = [
  {
    id: "demo-report-1",
    generated_date: dayOffset(0),
    period_start: dayOffset(-7),
    period_end: dayOffset(0),
    days_tracked: 7,
    included_sections: { medication: true, pain: true, sleep: true, activity: true, flags: true, summary: true },
    medication_adherence_pct: 95,
    scheduled_doses: 28,
    taken_doses: 27,
    pain_first: 6,
    pain_recent: 3,
    pain_trend_label: "improving",
    pain_series: Array.from({ length: 7 }, (_, i) => ({ date: dayOffset(-(6 - i)), pain: Math.max(3, 7 - (6 - i)) })),
    poor_sleep_count: 1,
    nights_logged: 7,
    avg_walk_minutes: 18,
    walk_target: 20,
    walk_days_met: 5,
    fever_days: [],
    concern_notes: [],
    ai_summary: "Ninja is recovering well from laparoscopic appendectomy. Pain has decreased from 6/10 to 3/10 over the past week. Medication adherence is excellent at 95%. Walking activity is approaching the target of 20 minutes daily. Sleep has been good with only one poor night. No signs of infection. Continue current recovery plan and attend follow-up appointment.",
    shared: false,
    share_token: "",
    created_date: dayOffset(0),
  },
];

export const DEMO_ALLERGIES_MEDS = [
  { id: "demo-am-1", type: "allergy", name: "Penicillin", notes: "Rash and hives", created_date: isoOffset(-7) },
  { id: "demo-am-2", type: "medication", name: "Ibuprofen", notes: "200mg as needed for headache", created_date: isoOffset(-7) },
];

export const DEMO_VACCINES = [
  { id: "demo-vac-1", vaccine_name: "Influenza", date: "2025-10-15", notes: "Annual flu shot", created_date: isoOffset(-7) },
];

export const DEMO_MEDICAL_RECORDS = [
  { id: "demo-mr-1", title: "Discharge Summary", file_url: "", file_name: "discharge_summary.pdf", upload_date: dayOffset(-7), notes: "Post-appendectomy discharge instructions", created_date: isoOffset(-7) },
];
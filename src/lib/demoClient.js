
import {
  DEMO_USER, DEMO_PROFILE, DEMO_DISCHARGE, DEMO_MEDICATIONS, DEMO_TASKS,
  DEMO_APPOINTMENTS, DEMO_CHECKINS, DEMO_CONVERSATIONS, DEMO_QUESTIONS,
  DEMO_REPORTS, DEMO_ALLERGIES_MEDS, DEMO_VACCINES, DEMO_MEDICAL_RECORDS,
  DEMO_RECOVERY_PLAN,
} from "./demoData";


const clone = (v) => JSON.parse(JSON.stringify(v));


const sample = (arr) => clone(arr).map((r) => ({ ...r, is_sample: true }));

const store = {
  PatientProfile: sample([DEMO_PROFILE]),
  DischargeDocument: sample([DEMO_DISCHARGE]),
  Medication: sample(DEMO_MEDICATIONS),
  DailyTask: sample(DEMO_TASKS),
  Appointment: sample(DEMO_APPOINTMENTS),
  SymptomCheckin: sample(DEMO_CHECKINS),
  Conversation: sample(DEMO_CONVERSATIONS),
  DoctorReport: sample(DEMO_REPORTS),
  QueuedQuestion: sample(DEMO_QUESTIONS),
  AllergyMedication: sample(DEMO_ALLERGIES_MEDS),
  VaccineRecord: sample(DEMO_VACCINES),
  MedicalRecord: sample(DEMO_MEDICAL_RECORDS),
  EmailLog: [],
};

store.Task = store.DailyTask;

function clearSampleData() {
  for (const [name, coll] of Object.entries(store)) {
    if (name === "PatientProfile") continue;
    for (let i = coll.length - 1; i >= 0; i--) {
      if (coll[i].is_sample) coll.splice(i, 1);
    }
  }
  const p = store.PatientProfile[0];
  if (p) {
    Object.assign(p, {
      diagnosis: "",
      surgery_type: "",
      surgery_date: "",
      surgeon: "",
      hospital: "",
      hospital_name: "",
      primary_doctor: "",
      procedure_name: "",
      procedure_date: "",
      restrictions_summary: "",
    
    });
  }
}

let idCounter = 1000;
const newId = () => `demo-${Date.now()}-${idCounter++}`;

function makeEntity(name) {
  const coll = store[name] || [];

  const matches = (rec, query) => {
    if (!query) return true;
    return Object.entries(query).every(([k, v]) => {
      if (v && typeof v === "object") {
        if (v.$in) return Array.isArray(v.$in) && v.$in.includes(rec[k]);
        if (v.$gte) return rec[k] >= v.$gte;
        if (v.$lte) return rec[k] <= v.$lte;
        return false;
      }
      return rec[k] === v;
    });
  };

  return {
    list: async (sort, limit) => {
      let results = [...coll];
      if (sort) {
        const desc = sort.startsWith("-");
        const field = desc ? sort.slice(1) : sort;
        results.sort((a, b) => {
          const av = a[field] ?? "";
          const bv = b[field] ?? "";
          if (av < bv) return desc ? 1 : -1;
          if (av > bv) return desc ? -1 : 1;
          return 0;
        });
      }
      if (limit) results = results.slice(0, limit);
      return results;
    },
    filter: async (query, sort, limit) => {
      let results = coll.filter((r) => matches(r, query));
      if (sort) {
        const desc = sort.startsWith("-");
        const field = desc ? sort.slice(1) : sort;
        results.sort((a, b) => {
          const av = a[field] ?? "";
          const bv = b[field] ?? "";
          if (av < bv) return desc ? 1 : -1;
          if (av > bv) return desc ? -1 : 1;
          return 0;
        });
      }
      if (limit) results = results.slice(0, limit);
      return results;
    },
    get: async (id) => coll.find((r) => r.id === id) || null,
    create: async (data) => {
      const rec = { id: newId(), created_date: new Date().toISOString(), updated_date: new Date().toISOString(), created_by_id: "demo-ninja", ...data };
      coll.push(rec);
      return rec;
    },
    bulkCreate: async (items) => {
      const created = items.map((data) => {
        const rec = { id: newId(), created_date: new Date().toISOString(), updated_date: new Date().toISOString(), created_by_id: "demo-ninja", ...data };
        coll.push(rec);
        return rec;
      });
      return created;
    },
    update: async (id, updates) => {
      const rec = coll.find((r) => r.id === id);
      if (!rec) return null;
      Object.assign(rec, updates, { updated_date: new Date().toISOString() });
      return rec;
    },
    bulkUpdate: async (updates) => {
      return updates.map(({ id, ...patch }) => {
        const rec = coll.find((r) => r.id === id);
        if (rec) Object.assign(rec, patch, { updated_date: new Date().toISOString() });
        return rec;
      });
    },
    updateMany: async (query, ops) => {
      const matched = coll.filter((r) => matches(r, query));
      const set = ops.$set || {};
      matched.forEach((r) => Object.assign(r, set, { updated_date: new Date().toISOString() }));
      return { modifiedCount: matched.length };
    },
    delete: async (id) => {
      const idx = coll.findIndex((r) => r.id === id);
      if (idx >= 0) coll.splice(idx, 1);
      return { deleted: idx >= 0 };
    },
    deleteMany: async (query) => {
      const toRemove = coll.filter((r) => matches(r, query));
      toRemove.forEach((r) => {
        const idx = coll.indexOf(r);
        if (idx >= 0) coll.splice(idx, 1);
      });
      return { deletedCount: toRemove.length };
    },
    subscribe: () => () => {},
    schema: async () => ({}),
  };
}

const demoEntities = {};
for (const name of Object.keys(store)) {
  demoEntities[name] = makeEntity(name);
}


const baseDocDelete = demoEntities.DischargeDocument.delete;
demoEntities.DischargeDocument.delete = async (id) => {
  const doc = store.DischargeDocument.find((d) => d.id === id);
  const res = await baseDocDelete(id);
  if (doc && doc.is_sample) clearSampleData();
  for (const coll of Object.values(store)) {
    for (let i = coll.length - 1; i >= 0; i--) {
      if (coll[i].source_doc_id === id) coll.splice(i, 1);
    }
  }
  return res;
};

const demoAuth = {
  me: async () => ({ ...DEMO_USER }),
  isAuthenticated: async () => true,
  logout: () => {
    localStorage.removeItem("mendly_demo");
  },
  redirectToLogin: () => {
    localStorage.removeItem("mendly_demo");
  },
  setToken: () => {},
  loginViaEmailPassword: async () => {},
  register: async () => {},
  verifyOtp: async () => ({ access_token: "demo-token" }),
  resendOtp: async () => {},
  loginWithProvider: () => {
    localStorage.removeItem("mendly_demo");
  },
  updateMe: async (data) => {
    Object.assign(DEMO_USER, data);
    return { ...DEMO_USER };
  },
};

const URGENT_PATTERNS = [
  "shortness of breath","cant breathe","cannot breathe","struggling to breathe",
  "trouble breathing","hard to breathe","difficulty breathing","breathing problem",
  "cant catch my breath","wheezing","choking","gasping",
  "heart attack","chest pain","chest pressure","chest tightness","crushing chest",
  "pain radiating","radiating to","pain in my arm","pain in my jaw","racing heart",
  "irregular heartbeat","heart racing",
  "severe bleeding","heavy bleeding","cant stop bleeding","bleeding heavily",
  "bleeding a lot","bleeding wont stop","wont stop bleeding","coughing up blood",
  "coughing blood","vomiting blood","throwing up blood","blood in vomit",
  "blood in stool","black stool","tarry stool","bright red blood","passing blood",
  "fainting","passed out","passing out","loss of consciousness","unconscious",
  "not responsive","cant respond","numbness","cant feel my","cant feel my legs",
  "weakness on one side","face drooping","face dropping","slurred speech","cant speak",
  "cant move my","cant move one","sudden weakness","sudden numbness","dizziness",
  "lightheaded","seizure","convulsion","stroke","fast sudden","sudden severe",
  "high fever","fever over","fever above","fever of 10","fever 101","fever 102",
  "fever 103","fever 104","shaking chills","rigors",
  "signs of infection","redness spreading","spreading redness","pus","discharging pus",
  "infected incision","wound infected","hot to the touch","foul odor","foul smell",
  "bad smell from","incision hot",
  "uncontrollable pain","unbearable pain","worst pain","excruciating",
  "severe pain","extreme pain","pain is unbearable","pain wont stop",
  "pain out of control","10 out of 10 pain","pain 10",
  "unable to urinate","cant urinate","cant pee","no urine","havent urinated",
  "blood in urine","severe abdominal","abdomen rigid","stomach hard",
  "leg swelling","calf swelling","swollen leg","one leg swollen","swollen calf",
  "sudden swelling","warm and swollen","painful swelling",
  "suicidal","suicide","kill myself","want to die","wanna die","ending my life",
  "end my life","hurt myself","self harm","self-harm","hopeless","dont want to live",
  "dont want to be here","thoughts of harming",
  "anaphylaxis","throat closing","swollen throat","lips swelling","lips swollen",
  "tongue swelling","tongue swollen","severe allergic","hives spreading",
  "cant swallow","swelling of the throat",
  "blue lips","turning blue","clammy and pale","going into shock","in shock",
  "not breathing","stopped breathing","collapsed",
];

function isUrgent(text) {
  const lower = (text || "").toLowerCase().replace(/['’`]/g, "");
  return URGENT_PATTERNS.some((k) => lower.includes(k));
}

function demoAskResponse(question) {
  const q = (question || '').toLowerCase();
  const urgent = isUrgent(question);
  let answer;

  if (urgent) {
    answer = "That sounds like it could need urgent attention. Please contact your care team or go to urgent care / the ER right away — don't wait. This is general guidance — for anything concerning, seek urgent care.";
  } else if (q.includes('pain')) {
    answer = "Some soreness and discomfort is normal during recovery, but pain should gradually improve over time. Keep taking your medications as prescribed, use ice or heat as your discharge instructions suggest, and rest between activities. If your pain is getting worse instead of better, or isn't helped by your prescribed meds, reach out to your care team. This is general guidance — for anything concerning, contact your care team.";
  } else if (q.includes('medication') || q.includes('medicine') || q.includes('pill') || q.includes('dose')) {
    answer = "You're currently on Acetaminophen (500 mg every 6 hours as needed) and Ibuprofen (400 mg every 8 hours). Take them with food to protect your stomach, and don't exceed the daily limits on the label. If you're unsure whether you've missed a dose, just take the next one at the scheduled time — don't double up. This is general guidance — for anything concerning, contact your care team.";
  } else if (q.includes('walk') || q.includes('exercise') || q.includes('activity')) {
    answer = "Gentle movement like short walks is one of the best things you can do for recovery — it helps circulation and prevents stiffness. Start with 5–10 minutes and build up gradually as you feel comfortable. Avoid heavy lifting or strenuous exercise until your doctor clears you at your follow-up. This is general guidance — for anything concerning, contact your care team.";
  } else if (q.includes('sleep') || q.includes('rest')) {
    answer = "Rest is essential right now — your body heals most during sleep. Try to get 7–9 hours, and don't hesitate to nap during the day if you're tired. Sleeping on your back with a pillow under your knees can ease pressure on your abdomen. This is general guidance — for anything concerning, contact your care team.";
  } else if (q.includes('wound') || q.includes('incision') || q.includes('bandage') || q.includes('scar')) {
    answer = "Keep your incision clean and dry — change the bandage daily or as directed. Watch for signs of infection: increasing redness, swelling, warmth, or drainage. A little pinkness around the edges is normal, but spreading redness or pus is not. This is general guidance — for anything concerning, contact your care team.";
  } else if (q.includes('food') || q.includes('eat') || q.includes('diet')) {
    answer = "Eating well helps you heal. Focus on protein (lean meats, eggs, beans), plenty of fluids, and fiber to avoid constipation — especially if you're taking pain medications. Avoid alcohol while you're on prescription pain meds. This is general guidance — for anything concerning, contact your care team.";
  } else if (q.includes('appointment') || q.includes('follow') || q.includes('doctor')) {
    answer = "Your next follow-up is with Dr. Sarah Chen on August 14 at 10:00 AM at St. Mary's Medical Center, Suite 200. Bring a list of any questions or symptoms you've noticed — and don't hesitate to write them down here and save them for your visit. This is general guidance — for anything concerning, contact your care team.";
  } else if (q.includes('shower') || q.includes('bath')) {
    answer = "Showering is usually fine 24–48 hours after surgery unless your doctor said otherwise. Let the water run gently over the incision — don't scrub it. Pat dry with a clean towel. Avoid submerging in baths or pools until your doctor clears you. This is general guidance — for anything concerning, contact your care team.";
  } else {
    answer = "Great question! Based on your recovery so far, you're on track. Keep up with your daily walks, take your medications on schedule, and watch for any new or worsening symptoms. If something doesn't feel right, don't hesitate to reach out to your care team — that's what they're there for. This is general guidance — for anything concerning, contact your care team.";
  }

  return { answer, urgent_flag: urgent, urgent_reason: urgent ? "This may need urgent attention — contact your doctor or seek emergency care right away." : null };
}

const MISSING_KEY_MESSAGE = "Paste GROQ_API_KEY into .env and restart the dev server.";
const TEXT_MODEL = "openai/gpt-oss-120b";
const VISION_MODEL = "qwen/qwen3.8-27b";
const URGENT_REASON = "This may need urgent attention — contact your doctor or seek emergency care right away.";
const PDF_PHOTO_ERROR = "This PDF has no readable text. Use a photo of the page.";
const fileStore = new Map();

const RECOVERY_PLAN_PROMPT = `You are Mendy, a compassionate post-surgical recovery assistant. A patient has uploaded their hospital discharge paperwork (or pasted a link to it). Carefully read the document and extract the key information.

Return structured JSON with:
- diagnosis: the main diagnosis understandable to a patient
- procedure: the surgery or procedure performed
- recovery_duration_days: the recovery duration in days as stated in the document (e.g. 42 for 6 weeks). If not stated, infer a sensible default based on the procedure (e.g. 14 for minor, 42 for major surgery).
- summary: a warm, encouraging 2-3 sentence explanation of what happened and what recovery will involve
- restrictions: list of activity/dietary restrictions as short phrases
- follow_up_info: follow-up care instructions
- medications: each medication with name, dosage, frequency (e.g. "Every 8 hours"), instructions (e.g. "Take with food"), purpose, and reminders as HH:MM times
- daily_tasks: a sensible daily recovery plan derived from the instructions (medications, walks, hydration, dressing changes, pain check-ins, rest). Use clear patient-friendly titles. Mark recurring true for daily items.
- appointment: the follow-up appointment if explicitly mentioned, otherwise null

If a field is not present in the document, infer sensible recovery defaults but keep it conservative. Always generate at least: medication tasks, "Walk 20 minutes", "Drink 8 glasses of water", "Pain check-in", and any wound-care task.

Also return field_confidence: for each of diagnosis, procedure, medications, restrictions, appointment, give a score 0-1 reflecting how clearly it was stated in the source (1 = explicitly stated, 0.6 = partially inferred, 0.3 = guessed/defaulted, 0 = not found).`;

// Exact JSON shapes the AI must return (so the app can read the results).
const EXTRACTION_SCHEMA = `Return ONLY a JSON object with exactly these keys:
{"diagnosis":"","surgery_type":"","surgery_date":"YYYY-MM-DD or empty","surgeon":"","hospital":"",
"restrictions":[],"activity_guidelines":[],"care_instructions":[],"warning_signs":[],
"medications":[{"name":"","dosage":"","frequency":"","instructions":"","purpose":"","schedule_times":["HH:MM"]}],
"follow_up_appointments":[{"title":"","date":"YYYY-MM-DD","time":"HH:MM","provider":"","location":"","reason":""}],
"field_confidence":{"diagnosis":"high|low|missing","medications":"high|low|missing","restrictions":"high|low|missing","follow_up_date":"high|low|missing"}}`;

const PLAN_SCHEMA = `Return ONLY a JSON object with exactly these keys:
{"diagnosis":"","procedure":"","recovery_duration_days":42,"summary":"","restrictions":[],"follow_up_info":"",
"medications":[{"name":"","dosage":"","frequency":"","instructions":"","purpose":"","reminders":["HH:MM"]}],
"daily_tasks":[{"title":"","category":"medication|activity|self_care|check_in","scheduled_time":"HH:MM or empty","recurring":true}],
"appointment":{"title":"","provider":"","location":"","date":"YYYY-MM-DD","time":"HH:MM","notes":""} or null,
"field_confidence":{"diagnosis":0,"procedure":0,"medications":0,"restrictions":0,"appointment":0}}`;

const arr = (v) => (Array.isArray(v) ? v : []);

function buildExtractionPrompt() {
  return `You are a clinical discharge-summary extraction assistant. Analyze the attached hospital discharge document (photo or PDF) and extract a structured recovery summary for a post-surgery patient.

LAYOUTS: Documents may use free-text paragraphs, labeled form fields, or tables (with or without visible borders). Look for the target information regardless of layout — do not assume one fixed format.

MULTI-LINE / SPLIT FIELDS: A medication's name, dosage, and timing may appear on separate lines or wrap across a line break. Treat these as ONE field — do not truncate at the first line break.

SCANNED / LOWER-QUALITY DOCUMENTS: The upload may be angled, slightly blurry, have shadows, or include stray marks (staple holes, stamps, handwritten margin notes). Read the best extraction you can rather than failing outright. Never treat handwritten margin notes or stray marks as structured field data.

CONFIDENCE & FALLBACK: You must extract four target fields — diagnosis, medications, restrictions, follow-up date. If you cannot confidently find one, leave it BLANK (empty string/array) rather than guessing. Set field_confidence to "high" only when the value is clearly stated; "low" when inferred or partial; "missing" when absent. A blank field the patient fills in manually is far better than a wrong value they don't notice.

GENERAL RULES:
- Only include information explicitly present in the document.
- For medication schedule_times, infer reasonable times of day (HH:MM 24h) from the frequency if stated.
- For dates, normalize to YYYY-MM-DD.
- Return JSON matching the provided schema.

FEW-SHOT EXAMPLE:
Input (excerpt of a discharge document):
Patient Summary: Mr. Alvarez underwent a total knee replacement on 03/14/2026.
Discharge Instructions: No heavy lifting over 10 lbs. Walk 20 minutes daily, twice per day if tolerated.
Follow-up: Ortho clinic, 03/28/2026, 10:00 AM.
Medications:
  Acetaminophen 500mg — every 6 hours as needed for pain
  Enoxaparin 40mg — once daily, injection, for 14 days

Expected extraction:
diagnosis: "Total knee replacement"
activity_guidelines (restrictions): "No heavy lifting over 10 lbs. Walk 20 minutes daily, twice per day if tolerated."
follow_up_appointments: [{ title: "Ortho clinic follow-up", date: "2026-03-28", time: "10:00" }]
medications: [
  { name: "Acetaminophen", dosage: "500mg", frequency: "Every 6 hours as needed for pain" },
  { name: "Enoxaparin", dosage: "40mg", frequency: "Once daily, injection, for 14 days" }
]
field_confidence: { diagnosis: "high", medications: "high", restrictions: "high", follow_up_date: "high" }

Apply this same extraction pattern whether the source uses paragraphs, forms, or tables.`;
}


function buildTasksFromExtraction(extracted, days = 14) {
  const specs = [];
  (extracted.medications || []).forEach((med) => {
    const times = med.schedule_times && med.schedule_times.length ? med.schedule_times : ["09:00", "21:00"];
    times.forEach((t) => {
      specs.push({
        title: `Take ${med.name} ${med.dosage || ""}`.trim(),
        category: "medication",
        scheduled_time: t,
        notes: med.instructions || med.frequency || "",
      });
    });
  });
  (extracted.activity_guidelines || []).forEach((g) => {
    specs.push({ title: g, category: "activity", scheduled_time: "10:00" });
  });
  (extracted.care_instructions || []).forEach((c) => {
    specs.push({ title: c, category: "self_care", scheduled_time: "12:00" });
  });
  specs.push({ title: "Drink 8 glasses of water", category: "activity", scheduled_time: "" });
  specs.push({ title: "Daily pain & symptom check-in", category: "check_in", scheduled_time: "20:00" });

  const tasks = [];
  let order = 0;
  for (let d = 0; d < days; d++) {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    const task_date = dt.toISOString().slice(0, 10);
    specs.forEach((s) => {
      tasks.push({ ...s, task_date, order: order++, completed: false, recurring: true });
    });
  }
  return tasks;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

async function readableDocumentText(file) {
  const raw = await file.text();
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  if (!isPdf) {
    const text = raw.replace(/\u0000/g, "").trim();
    if (/[A-Za-z]{4,}/.test(text)) return text.slice(0, 20000);
    throw new Error("This file has no readable text. Use a photo of the page.");
  }
  const chunks = [];
  const re = /\((?:\\.|[^\\)]){2,}\)/g;
  let match;
  while ((match = re.exec(raw))) {
    const inner = match[0]
      .slice(1, -1)
      .replace(/\\n/g, " ")
      .replace(/\\r/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\");
    if (/[A-Za-z]{3,}/.test(inner)) chunks.push(inner);
  }
  const text = chunks.join(" ").replace(/\s+/g, " ").trim();
  if (text.length < 40) throw new Error(PDF_PHOTO_ERROR);
  return text.slice(0, 20000);
}

async function messagesForDocuments(prompt, urls) {
  const texts = [];
  const images = [];
  for (const url of urls || []) {
    const file = fileStore.get(url);
    if (!file) {
      if (url) texts.push(`Document link: ${url}`);
      continue;
    }
    if ((file.type || "").startsWith("image/")) {
      images.push(await fileToDataUrl(file));
      continue;
    }
    texts.push(await readableDocumentText(file));
  }
  const text = [prompt, ...texts].filter(Boolean).join("\n\n");
  if (images.length) {
    return {
      model: VISION_MODEL,
      messages: [{
        role: "user",
        content: [
          { type: "text", text },
          ...images.map((imageUrl) => ({ type: "image_url", image_url: { url: imageUrl } })),
        ],
      }],
    };
  }
  return { model: TEXT_MODEL, messages: [{ role: "user", content: text }] };
}

function parseJsonContent(content) {
  const trimmed = String(content || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : trimmed).trim();
  return JSON.parse(raw);
}

async function groqChatOnce({ messages, json = false, model = TEXT_MODEL }) {
  const res = await fetch("/api/groq/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  let body = {};
  try { body = await res.json(); } catch { body = {}; }
  if (!res.ok) {
    const fromBody = typeof body?.error === "string" ? body.error : (body?.error?.message || body?.message);
    const message = fromBody || "Groq request failed";
    throw new Error(res.status === 503 || message.includes("GROQ_API_KEY") ? MISSING_KEY_MESSAGE : message);
  }
  const content = body?.choices?.[0]?.message?.content ?? "";
  if (!json) return typeof content === "string" ? content : JSON.stringify(content);
  try {
    return parseJsonContent(content);
  } catch {
    throw new Error("Groq returned invalid JSON");
  }
}

async function groqChat(options) {
  try {
    return await groqChatOnce(options);
  } catch (error) {
    if (options.json && /response_format|json_object/i.test(error.message || "") && !String(error.message).includes("GROQ_API_KEY")) {
      const text = await groqChatOnce({ ...options, json: false });
      try {
        return parseJsonContent(text);
      } catch {
        throw new Error("Groq returned invalid JSON");
      }
    }
    throw error;
  }
}

function errorData(error) {
  const message = String(error?.message || "");
  return {
    data: {
      error: message.includes("GROQ_API_KEY") || message.includes("Paste GROQ_API_KEY")
        ? MISSING_KEY_MESSAGE
        : (message || "Groq request failed"),
    },
  };
}

async function askAssistant(payload) {
  const question = payload?.question;
  if (!question || typeof question !== "string" || question.length > 1000) {
    return { data: { error: "A question (max 1000 chars) is required" } };
  }
  const data = demoAskResponse(question);
  await demoEntities.Conversation.create({ role: "user", content: question, urgent_flag: data.urgent_flag, context_type: "assistant" });
  await demoEntities.Conversation.create({ role: "assistant", content: data.answer, urgent_flag: data.urgent_flag, context_type: "assistant" });
  return { data };
}

async function wellnessCoach(payload) {
  const {
    date, pain_level, energy_level, sleep_hours, temperature,
    activity_minutes, mood, took_medications, notes,
  } = payload || {};
  if (date === undefined || pain_level === undefined) {
    return { data: { error: "date and pain_level are required" } };
  }
  let urgent = false;
  const reasons = [];
  if (pain_level >= 8) { urgent = true; reasons.push("pain level 8 or above"); }
  if (temperature && temperature >= 100.4) { urgent = true; reasons.push("fever 100.4°F or above"); }
  if (energy_level && energy_level <= 2) { urgent = true; reasons.push("very low energy"); }
  const prompt = `You are Mendy, a warm, supportive post-surgery wellness coach. A patient just submitted their daily check-in:
- Pain level: ${pain_level}/10
- Energy level: ${energy_level}/10
- Sleep: ${sleep_hours} hours
- Temperature: ${temperature ? temperature + "°F" : "not provided"}
- Activity: ${activity_minutes || 0} minutes
- Mood: ${mood || "not provided"}
- Took medications as prescribed: ${took_medications ? "yes" : "no"}
- Notes: ${notes || "none"}

Write a short (2-3 sentence) empathetic, encouraging response. Acknowledge how they are doing, give one gentle practical suggestion, and reassure them. Do not give formal medical diagnoses. If anything suggests danger (severe pain, fever, signs of infection), briefly urge them to contact their care team. Keep it warm and human.`;
  let responseText = "";
  if (urgent) {
    responseText = `⚠️ Please reach out to your care team soon — your check-in shows ${reasons.join(", ")}. `;
  }
  responseText += await groqChat({ messages: [{ role: "user", content: prompt }] });
  const checkin = await demoEntities.SymptomCheckin.create({
    date, pain_level, energy_level, sleep_hours, temperature,
    activity_minutes, mood, took_medications, notes,
    ai_response: responseText,
    urgent_flag: urgent,
  });
  return { data: { checkin, ai_response: responseText, urgent_flag: urgent } };
}

async function generateDoctorReport(payload) {
  const SECTION_KEYS = ["medication", "pain", "sleep", "activity", "flags", "summary"];
  const FEVER_F = 100.4;
  const POOR_SLEEP_HOURS = 5;
  const DEFAULT_WALK_TARGET = 20;
  const body = payload || {};
  const included = {};
  for (const k of SECTION_KEYS) included[k] = body.includedSections ? !!body.includedSections[k] : true;

  const profile = (await demoEntities.PatientProfile.filter({}))[0] || {};
  const priorReports = await demoEntities.DoctorReport.list("-generated_date", 50);
  const lastReport = priorReports[0];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  let startStr;
  if (lastReport && lastReport.generated_date) {
    const d = new Date(lastReport.generated_date + "T00:00:00");
    d.setDate(d.getDate() + 1);
    startStr = d.toISOString().slice(0, 10);
  } else if (profile.surgery_date) {
    startStr = profile.surgery_date;
  } else {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    startStr = d.toISOString().slice(0, 10);
  }
  if (startStr > todayStr) startStr = todayStr;

  const tasks = await demoEntities.DailyTask.list("-task_date", 500);
  const checkins = await demoEntities.SymptomCheckin.list("-date", 120);
  const inRange = (d) => d && d >= startStr && d <= todayStr;
  const medTasks = tasks.filter((t) => t.category === "medication" && inRange(t.task_date));
  const scheduledDoses = medTasks.length;
  const takenDoses = medTasks.filter((t) => t.completed).length;
  const medAdherence = scheduledDoses ? Math.round((takenDoses / scheduledDoses) * 100) : 0;
  const periodCheckins = checkins.filter((c) => inRange(c.date)).sort((a, b) => (a.date < b.date ? -1 : 1));
  const painPoints = periodCheckins.filter((c) => c.pain_level != null).map((c) => ({ date: c.date, pain: c.pain_level }));
  const painFirst = painPoints.length ? painPoints[0].pain : null;
  const painRecent = painPoints.length ? painPoints[painPoints.length - 1].pain : null;
  let painLabel = "stable";
  if (painFirst != null && painRecent != null) {
    const diff = painRecent - painFirst;
    if (diff <= -2) painLabel = "improving";
    else if (diff >= 2) painLabel = "worsening";
    else painLabel = "stable";
  }
  const sleepCheckins = periodCheckins.filter((c) => c.sleep_hours != null);
  const nightsLogged = sleepCheckins.length;
  const poorSleepCount = sleepCheckins.filter((c) => c.sleep_hours < POOR_SLEEP_HOURS).length;
  const docs = await demoEntities.DischargeDocument.list("-created_date", 10);
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
  const concernNotes = periodCheckins.filter((c) => c.urgent_flag && c.notes).map((c) => `${c.date}: ${c.notes}`);
  const daysTracked = Math.max(1, Math.round((new Date(todayStr) - new Date(startStr)) / 86400000) + 1);
  const lines = [];
  lines.push(`Patient: ${profile.full_name || "N/A"}${profile.surgery_type ? ", surgery: " + profile.surgery_type : ""}${profile.surgery_date ? " on " + profile.surgery_date : ""}.`);
  lines.push(`Reporting period: ${startStr} to ${todayStr} (${daysTracked} days).`);
  if (included.medication) lines.push(`Medication adherence: ${takenDoses} of ${scheduledDoses} scheduled doses taken (${medAdherence}%).`);
  if (included.pain) lines.push(`Pain: first logged ${painFirst ?? "N/A"}/10, most recent ${painRecent ?? "N/A"}/10, trend ${painLabel}. Series: ${JSON.stringify(painPoints)}.`);
  if (included.sleep) lines.push(`Sleep: ${poorSleepCount} poor nights (<${POOR_SLEEP_HOURS}h) out of ${nightsLogged} nights logged.`);
  if (included.activity) lines.push(`Activity: averaged ${avgWalk} walk minutes/day vs target ${walkTarget}; target met on ${walkDaysMet} of ${activityCheckins.length} logged days.`);
  if (included.flags) lines.push(`Symptom flags: ${feverDays.length} day(s) with fever (>=${FEVER_F}F)${feverDays.length ? ": " + feverDays.join(", ") : ""}; ${concernNotes.length} patient-flagged concern note(s).`);
  const prompt = `You are writing a short, plain-language recovery summary for a doctor based ONLY on the logged patient data below. Be strictly descriptive of what was logged. Do NOT diagnose, interpret causes, or recommend treatments. Keep it 3-5 sentences, neutral and factual. Use conversational clinical tone.

${lines.join("\n")}`;
  let aiSummary = "";
  if (included.summary) aiSummary = await groqChat({ messages: [{ role: "user", content: prompt }] });
  const record = await demoEntities.DoctorReport.create({
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
    shared: false,
  });
  return { data: record };
}

async function generateRecoveryPlan(payload) {
  const fileUrls = Array.isArray(payload?.file_urls)
    ? payload.file_urls.filter(Boolean)
    : (payload?.file_url ? [payload.file_url] : []);
  if (!fileUrls.length) return { data: { error: "file_url is required" } };
  
  if (!fileUrls.some((u) => fileStore.has(u))) return { data: clone(DEMO_RECOVERY_PLAN) };

  const { model, messages } = await messagesForDocuments(`${RECOVERY_PLAN_PROMPT}\n\n${PLAN_SCHEMA}`, fileUrls);
  const plan = await groqChat({ model, messages, json: true });
  return { data: plan };
}

async function extractDischargeDocument(payload) {
  const file_url = payload?.file_url;
  const file_name = payload?.file_name || "discharge_document";
  if (!file_url || typeof file_url !== "string") {
    return { data: { error: "file_url is required" } };
  }
  const doc = await demoEntities.DischargeDocument.create({ file_url, file_name, status: "pending" });

  const isRealUpload = fileStore.has(file_url);
  let extracted;
  if (isRealUpload) {
    try {
      const { model, messages } = await messagesForDocuments(`${buildExtractionPrompt()}\n\n${EXTRACTION_SCHEMA}`, [file_url]);
      const raw = await groqChat({ model, messages, json: true });
      extracted = {
        ...raw,
        restrictions: arr(raw.restrictions),
        activity_guidelines: arr(raw.activity_guidelines),
        care_instructions: arr(raw.care_instructions),
        warning_signs: arr(raw.warning_signs),
        medications: arr(raw.medications),
        follow_up_appointments: arr(raw.follow_up_appointments),
      };
    } catch (e) {
  
      await demoEntities.DischargeDocument.delete(doc.id);
      throw e;
    }

    clearSampleData();
  } else {
    extracted = {
      diagnosis: DEMO_DISCHARGE.diagnosis,
      surgery_type: DEMO_DISCHARGE.surgery_type,
      surgery_date: DEMO_DISCHARGE.surgery_date,
      surgeon: DEMO_DISCHARGE.surgeon,
      hospital: DEMO_DISCHARGE.hospital,
      restrictions: clone(DEMO_DISCHARGE.restrictions),
      activity_guidelines: clone(DEMO_DISCHARGE.activity_guidelines),
      care_instructions: clone(DEMO_DISCHARGE.care_instructions),
      warning_signs: clone(DEMO_DISCHARGE.warning_signs),
      medications: DEMO_MEDICATIONS.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        instructions: m.instructions,
        purpose: m.purpose,
        schedule_times: clone(m.schedule_times),
      })),
      follow_up_appointments: DEMO_APPOINTMENTS.map((a) => ({
        title: a.title,
        date: a.date,
        time: a.time,
        provider: a.provider,
        location: a.location,
        reason: a.reason,
      })),
      field_confidence: { diagnosis: "high", medications: "high", restrictions: "high", follow_up_date: "high" },
    };
  }

  await demoEntities.DischargeDocument.update(doc.id, {
    status: "extracted",
    extracted_json: extracted,
    diagnosis: extracted.diagnosis || "",
    surgery_type: extracted.surgery_type || "",
    surgery_date: extracted.surgery_date || "",
    surgeon: extracted.surgeon || "",
    hospital: extracted.hospital || "",
    restrictions: extracted.restrictions || [],
    activity_guidelines: extracted.activity_guidelines || [],
    care_instructions: extracted.care_instructions || [],
    warning_signs: extracted.warning_signs || [],
  });
  const profiles = await demoEntities.PatientProfile.filter({});
  if (profiles.length > 0) {
    const p = profiles[0];
    await demoEntities.PatientProfile.update(p.id, {
      diagnosis: extracted.diagnosis || p.diagnosis || "",
      surgery_type: extracted.surgery_type || p.surgery_type || "",
      surgery_date: extracted.surgery_date || p.surgery_date || "",
      surgeon: extracted.surgeon || p.surgeon || "",
      hospital: extracted.hospital || p.hospital || "",
      restrictions_summary: (extracted.restrictions || []).join("; "),
    });
  }
  const createdMeds = [];
  for (const med of (extracted.medications || [])) {
    const m = await demoEntities.Medication.create({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency || "",
      schedule_times: med.schedule_times || [],
      instructions: med.instructions || "",
      purpose: med.purpose || "",
      start_date: extracted.surgery_date || new Date().toISOString().slice(0, 10),
      active: true,
      source_doc_id: doc.id,
    });
    createdMeds.push(m);
  }
  for (const appt of (extracted.follow_up_appointments || [])) {
    if (!appt.date) continue;
    await demoEntities.Appointment.create({
      title: appt.title || appt.reason || "Follow-up appointment",
      date: appt.date,
      time: appt.time || "",
      provider: appt.provider || "",
      location: appt.location || "",
      reason: appt.reason || "",
      completed: false,
      source_doc_id: doc.id,
    });
  }
  const taskSpecs = buildTasksFromExtraction(extracted);
  const tasksWithMedId = taskSpecs.map((t) => {
    const match = t.category === "medication" &&
      createdMeds.find((m) => t.title.toLowerCase().includes(String(m.name || "").toLowerCase()));
    return { ...t, ...(match ? { medication_id: match.id } : {}), source_doc_id: doc.id };
  });
  if (tasksWithMedId.length) await demoEntities.Task.bulkCreate(tasksWithMedId);
  return { data: { document_id: doc.id, extracted } };
}

const demoFunctions = {
  invoke: async (name, payload) => {
    try {
      if (name === "askAssistant") return await askAssistant(payload);
      if (name === "wellnessCoach") return await wellnessCoach(payload);
      if (name === "symptom_insight") return { data: demoAskResponse(payload?.question) };
      if (name === "generateDoctorReport" || name === "generate_doctor_report") return await generateDoctorReport(payload);
      if (name === "extractDischargeDocument") return await extractDischargeDocument(payload);
      if (name === "generate_recovery_plan") return await generateRecoveryPlan(payload);
      if (name === "sendNotificationEmail") return { data: { sent: false, reason: "inactive" } };
      return { success: true };
    } catch (error) {
      return errorData(error);
    }
  },
};

const demoIntegrations = {
  Core: {
    UploadFile: async ({ file }) => {
      const file_url = URL.createObjectURL(file);
      if (file) fileStore.set(file_url, file);
      return { file_url };
    },
    UploadPrivateFile: async ({ file }) => ({ file_uri: URL.createObjectURL(file) }),
    InvokeLLM: async (payload) => ({
      response:
        "Based on your recovery data, you're making great progress! Pain is trending down, medication adherence is strong, and your daily walks are consistent. Keep it up and don't miss your follow-up appointment.",
    }),
    GenerateImage: async () => ({ url: "" }),
    GenerateSpeech: async () => ({ url: "" }),
    GenerateVideo: async () => ({ url: "" }),
    SendEmail: async () => ({ success: true }),
    TranscribeAudio: async () => ({ text: "" }),
    ExtractDataFromUploadedFile: async () => ({ status: "success", output: [] }),
    CreateFileSignedUrl: async ({ file_uri }) => ({ signed_url: file_uri }),
  },
};

export function getDemoClient() {
  return {
    entities: demoEntities,
    auth: demoAuth,
    functions: demoFunctions,
    integrations: demoIntegrations,
    analytics: { track: () => {} },
    users: { inviteUser: async () => ({}) },
    asServiceRole: {
      entities: demoEntities,
      integrations: demoIntegrations,
      connectors: { getConnection: async () => null },
    },
  };
}

export function isDemoMode() {
  return typeof window !== "undefined" && localStorage.getItem("mendly_demo") === "1";
}

export function enterDemoMode() {
  localStorage.setItem("mendly_demo", "1");
}

export function exitDemoMode() {
  localStorage.removeItem("mendly_demo");
}
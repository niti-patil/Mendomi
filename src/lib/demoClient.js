// In-memory mock SDK client for demo mode.
// Returns demo data, supports in-memory CRUD so toggles/edits feel real.

import {
  DEMO_USER, DEMO_PROFILE, DEMO_DISCHARGE, DEMO_MEDICATIONS, DEMO_TASKS,
  DEMO_APPOINTMENTS, DEMO_CHECKINS, DEMO_CONVERSATIONS, DEMO_QUESTIONS,
  DEMO_REPORTS, DEMO_ALLERGIES_MEDS, DEMO_VACCINES, DEMO_MEDICAL_RECORDS,
} from "./demoData";

// Deep clone so the static source is never mutated across demo sessions.
const clone = (v) => JSON.parse(JSON.stringify(v));

const store = {
  PatientProfile: clone([DEMO_PROFILE]),
  DischargeDocument: clone([DEMO_DISCHARGE]),
  Medication: clone(DEMO_MEDICATIONS),
  DailyTask: clone(DEMO_TASKS),
  Appointment: clone(DEMO_APPOINTMENTS),
  SymptomCheckin: clone(DEMO_CHECKINS),
  Conversation: clone(DEMO_CONVERSATIONS),
  DoctorReport: clone(DEMO_REPORTS),
  QueuedQuestion: clone(DEMO_QUESTIONS),
  AllergyMedication: clone(DEMO_ALLERGIES_MEDS),
  VaccineRecord: clone(DEMO_VACCINES),
  MedicalRecord: clone(DEMO_MEDICAL_RECORDS),
  Task: clone(DEMO_TASKS),
  EmailLog: [],
};

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

const demoAuth = {
  me: async () => ({ ...DEMO_USER }),
  isAuthenticated: async () => true,
  logout: () => {
    localStorage.removeItem("mendly_demo");
    window.location.href = "/auth";
  },
  redirectToLogin: () => {
    localStorage.removeItem("mendly_demo");
    window.location.href = "/auth";
  },
  setToken: () => {},
  loginViaEmailPassword: async () => {},
  register: async () => {},
  verifyOtp: async () => ({ access_token: "demo-token" }),
  resendOtp: async () => {},
  loginWithProvider: () => {
    localStorage.removeItem("mendly_demo");
    window.location.href = "/auth";
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

const demoFunctions = {
  invoke: async (name, payload) => {
    // Return mock responses for known functions
    if (name === "askAssistant" || name === "wellnessCoach" || name === "symptom_insight") {
      const r = demoAskResponse(payload?.question);
      return { data: r };
    }
    if (name === "generateDoctorReport" || name === "generate_doctor_report") {
      return { success: true, report_id: "demo-report-1" };
    }
    if (name === "extractDischargeDocument") {
      return { success: true, extracted: true };
    }
    if (name === "generate_recovery_plan") {
      return { success: true, tasks_created: 5 };
    }
    return { success: true };
  },
};

const demoIntegrations = {
  Core: {
    UploadFile: async ({ file }) => ({ file_url: URL.createObjectURL(file) }),
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
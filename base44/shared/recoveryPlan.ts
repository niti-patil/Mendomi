// Shared helpers for recovery-plan generation across backend functions.

export const extractionSchema = {
  type: "object",
  properties: {
    diagnosis: { type: "string", description: "Primary diagnosis or reason for surgery/admission" },
    surgery_type: { type: "string", description: "Type of procedure or surgery" },
    surgery_date: { type: "string", description: "Date of surgery/admission (YYYY-MM-DD) if mentioned" },
    surgeon: { type: "string", description: "Surgeon or attending physician name" },
    hospital: { type: "string", description: "Hospital or facility name" },
    restrictions: { type: "array", items: { type: "string" }, description: "Activity restrictions (e.g. no lifting over 10 lbs)" },
    activity_guidelines: { type: "array", items: { type: "string" }, description: "Recommended activities (e.g. walk 20 min daily)" },
    medications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          dosage: { type: "string" },
          frequency: { type: "string" },
          instructions: { type: "string" },
          purpose: { type: "string" },
          schedule_times: { type: "array", items: { type: "string" }, description: "Times of day e.g. 08:00, 20:00" }
        },
        required: ["name", "dosage"]
      }
    },
    follow_up_appointments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD" },
          time: { type: "string" },
          provider: { type: "string" },
          location: { type: "string" },
          reason: { type: "string" }
        }
      }
    },
    care_instructions: { type: "array", items: { type: "string" }, description: "Wound care, dressing changes, etc." },
    warning_signs: { type: "array", items: { type: "string" }, description: "When to seek urgent care" },
    field_confidence: {
      type: "object",
      description: "Confidence per target field: high, low, or missing. Low/missing fields should be visibly flagged on the confirmation screen.",
      properties: {
        diagnosis: { type: "string", enum: ["high", "low", "missing"] },
        medications: { type: "string", enum: ["high", "low", "missing"] },
        restrictions: { type: "string", enum: ["high", "low", "missing"] },
        follow_up_date: { type: "string", enum: ["high", "low", "missing"] }
      }
    }
  }
};

export function buildExtractionPrompt() {
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

// Build daily task records for a given date from extracted data.
export function buildTasksFromExtraction(extracted, dateStr, startOrder = 0) {
  const tasks = [];
  let order = startOrder;

  const pushTask = (task) => {
    tasks.push({ ...task, date: task.date || dateStr, sort_order: order++, completed: false, recurring: true });
  };

  (extracted.medications || []).forEach((med) => {
    const times = med.schedule_times && med.schedule_times.length ? med.schedule_times : ["09:00", "21:00"];
    times.forEach((t) => {
      pushTask({
        title: `Take ${med.name} ${med.dosage || ""}`.trim(),
        type: "medication",
        scheduled_time: t,
        notes: med.instructions || med.frequency || ""
      });
    });
  });

  (extracted.activity_guidelines || []).forEach((g) => {
    pushTask({ title: g, type: "activity", scheduled_time: "10:00" });
  });

  (extracted.care_instructions || []).forEach((c) => {
    pushTask({ title: c, type: "care", scheduled_time: "12:00" });
  });

  // default supportive tasks if nothing else present
  if (tasks.length === 0) {
    pushTask({ title: "Drink 8 glasses of water", type: "activity", scheduled_time: "check through day" });
  }

  // always include a daily pain check-in
  pushTask({ title: "Daily pain & symptom check-in", type: "checkin", scheduled_time: "20:00" });

  return tasks;
}
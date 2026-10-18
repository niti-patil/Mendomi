import { getDemoClient } from "@/lib/demoClient";
const db = getDemoClient();


export const todayStr = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffset).toISOString().slice(0, 10);
};

export const formatDateLong = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
};

export const formatDateShort = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const prettifyTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ap}`;
};

export const addDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const CATEGORY_META = {
  medication: { label: "Medication", icon: "Pill", color: "text-sky-600", bg: "bg-sky-50", ring: "ring-sky-100", dot: "bg-sky-500" },
  activity: { label: "Activity", icon: "Footprints", color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100", dot: "bg-emerald-500" },
  self_care: { label: "Self-Care", icon: " Droplets", color: "text-cyan-600", bg: "bg-cyan-50", ring: "ring-cyan-100", dot: "bg-cyan-500" },
  check_in: { label: "Check-In", icon: "HeartPulse", color: "text-rose-500", bg: "bg-rose-50", ring: "ring-rose-100", dot: "bg-rose-500" },
  appointment: { label: "Appointment", icon: "CalendarClock", color: "text-violet-600", bg: "bg-violet-50", ring: "ring-violet-100", dot: "bg-violet-500" }
};

// Ensure today's recurring tasks exist by cloning template tasks from any prior day.
export async function ensureTodaysTasks() {
  const today = todayStr();
  const tasks = await db.entities.DailyTask.list("-task_date", 500);
  const todays = tasks.filter((t) => t.task_date === today);
  const recurringTemplates = tasks.filter(
    (t) => t.recurring && t.task_date !== today && !todays.some((x) => x.title === t.title)
  );
  // dedupe templates by title
  const seen = new Set();
  const toCreate = [];
  for (const t of recurringTemplates) {
    if (seen.has(t.title)) continue;
    seen.add(t.title);
    toCreate.push({
      title: t.title,
      category: t.category,
      scheduled_time: t.scheduled_time || "",
      task_date: today,
      completed: false,
      order: t.order || 0,
      medication_id: t.medication_id || "",
      recurring: true
    });
  }
  if (toCreate.length) {
    await db.entities.DailyTask.bulkCreate(toCreate);
  }
  return toCreate.length;
}
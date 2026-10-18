import { getDemoClient } from "@/lib/demoClient";
const db = getDemoClient();

import React, { useEffect, useState } from "react";
import { CalendarClock, Check, Pill, FileText, ListChecks, MapPin, Clock } from "lucide-react";

import PageHeader, { EmptyState } from "@/components/PageHeader";
import { todayStr, formatDateLong, prettifyTime, addDays } from "@/lib/recovery";

export default function FollowupReminder() {
  const [loading, setLoading] = useState(true);
  const [appt, setAppt] = useState(null);
  const [medCount, setMedCount] = useState(0);
  const [queued, setQueued] = useState([]);
  const [hasReport, setHasReport] = useState(false);
  const [checked, setChecked] = useState({ meds: false, report: false, questions: false });

  useEffect(() => {
    (async () => {
      const today = todayStr();
      const tomorrow = addDays(today, 1);
      const appts = await db.entities.Appointment.list("date", 50);
      const upcoming = (appts || []).filter((a) => a.date >= today && !a.completed).sort((a, b) => a.date.localeCompare(b.date));
      const next = upcoming[0] || null;

      const [meds, qq, reports] = await Promise.all([
        db.entities.Medication.list("-created_date", 50),
        db.entities.QueuedQuestion.list("-created_date", 50),
        db.entities.DoctorReport.list("-generated_date", 5)
      ]);
      setMedCount((meds || []).filter((m) => m.active !== false).length);
      setQueued(qq || []);
      setHasReport((reports || []).length > 0);
      setAppt(next);
      setLoading(false);
    })();
  }, []);

  const isTomorrow = appt && appt.date === addDays(todayStr(), 1);

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>;
  }

  if (!appt) {
    return <PageHeader title="Follow-up reminder" subtitle="No upcoming appointment to remind you about." icon={CalendarClock} />;
  }

  return (
    <div>
      <PageHeader title="Follow-up reminder" subtitle="Your next visit, with a checklist of what to bring." icon={CalendarClock} />

      {isTomorrow && (
        <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
          This appointment is tomorrow — time to get ready.
        </div>
      )}

      <div className="rounded-3xl border border-border/70 bg-card p-5">
        <p className="font-display text-lg font-bold text-foreground">{appt.title}</p>
        <p className="mt-1 text-sm text-primary">{formatDateLong(appt.date)}{appt.time ? ` · ${prettifyTime(appt.time)}` : ""}</p>
        {appt.provider && <p className="mt-2 text-sm text-muted-foreground">{appt.provider}</p>}
        {appt.location && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {appt.location}</p>}
        {appt.notes && <p className="mt-3 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">{appt.notes}</p>}
      </div>

      <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">What to bring</h2>
      <div className="space-y-2">
        <ChecklistRow checked={checked.meds} onToggle={() => setChecked((c) => ({ ...c, meds: !c.meds }))} icon={Pill} label="Your medication list" hint={`${medCount} active medication${medCount !== 1 ? "s" : ""} in the app`} ready={medCount > 0} />
        <ChecklistRow checked={checked.report} onToggle={() => setChecked((c) => ({ ...c, report: !c.report }))} icon={FileText} label="Your latest Doctor Report" hint={hasReport ? "Available in the Doctor Report page — print or share the link" : "Generate one from the Doctor Report page first"} ready={hasReport} />
        <ChecklistRow checked={checked.questions} onToggle={() => setChecked((c) => ({ ...c, questions: !c.questions }))} icon={ListChecks} label="Your queued questions" hint={queued.length ? `${queued.length} question${queued.length !== 1 ? "s" : ""} saved` : "Save questions from Ask Mendy to ask at your visit"} ready={queued.length > 0} />
      </div>

      {queued.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your queued questions</p>
          <ul className="space-y-1.5">
            {queued.map((q, i) => <li key={q.id || i} className="flex items-start gap-2 text-sm text-foreground/85"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{q.question}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function ChecklistRow({ checked, onToggle, icon: Icon, label, hint, ready }) {
  return (
    <button onClick={onToggle} className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left">
      <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${checked ? "border-success bg-success text-white" : "border-border"}`}>
        {checked && <Check className="h-4 w-4" strokeWidth={3} />}
      </div>
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {!ready && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Prep</span>}
    </button>
  );
}
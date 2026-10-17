const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";
import { CalendarClock, MapPin, Clock, X, Check } from "lucide-react";

import PageHeader, { EmptyState } from "@/components/PageHeader";
import { todayStr, formatDateLong, formatDateShort, prettifyTime } from "@/lib/recovery";

export default function Appointments() {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const all = await db.entities.Appointment.list("date", 200);
    setAppts(all);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markDone = async (a) => {
    const done = a.status === "completed";
    const status = done ? "upcoming" : "completed";
    setAppts((p) => p.map((x) => (x.id === a.id ? { ...x, status } : x)));
    await db.entities.Appointment.update(a.id, { status });
  };

  const today = todayStr();
  const upcoming = appts.filter((a) => a.date >= today && a.status !== "completed" && a.status !== "cancelled");
  const past = appts.filter((a) => a.date < today || a.status === "completed");

  return (
    <div>
      <PageHeader title="Appointments" subtitle="Follow-up visits and reminders, in the app." icon={CalendarClock} />

      {loading ? (
        <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>
      ) : appts.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No appointments" description="Mendy can detect follow-up visits from your discharge papers." />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {upcoming.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-border/70 bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{a.title}</p>
                        {a.provider && <p className="text-sm text-muted-foreground">{a.provider}</p>}
                        {a.location && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {a.location}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">{formatDateShort(a.date)}</p>
                        {a.time && <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {prettifyTime(a.time)}</p>}
                      </div>
                    </div>
                    {a.notes && <p className="mt-2 rounded-xl bg-muted/50 p-2.5 text-xs text-muted-foreground">{a.notes}</p>}
                    <button onClick={() => markDone(a)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"><Check className="h-3.5 w-3.5" /> Mark completed</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Past</h2>
              <div className="space-y-2">
                {past.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/50 p-3.5 opacity-70">
                    <div>
                      <p className="text-sm font-medium text-foreground line-through">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDateShort(a.date)} · {a.provider}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Done</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {adding && <AddSheet onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
    </div>
  );
}

function AddSheet({ onClose, onSaved }) {
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const save = async () => {
    if (!title.trim()) return;
    await db.entities.Appointment.create({ title: title.trim(), provider, location, date, time, notes, status: "upcoming" });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">New appointment</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Follow-up with surgeon" className="ipt" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Provider"><input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Dr. Smith" className="ipt" /></Field>
            <Field label="Location"><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Clinic" className="ipt" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ipt" /></Field>
            <Field label="Time"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="ipt" /></Field>
          </div>
          <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="ipt resize-none" /></Field>
          <button onClick={save} disabled={!title.trim()} className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Add appointment</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
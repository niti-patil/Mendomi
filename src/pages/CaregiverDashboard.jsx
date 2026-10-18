import { getDemoClient } from "@/lib/demoClient";
const db = getDemoClient();

import React, { useEffect, useState } from "react";
import { Users, Pill, Footprints, Moon, CalendarClock, Lock, ShieldCheck } from "lucide-react";

import PageHeader, { EmptyState } from "@/components/PageHeader";
import { todayStr, formatDateShort, prettifyTime } from "@/lib/recovery";

export default function CaregiverDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const today = todayStr();
      const [profileArr, tasks, checkins, appts] = await Promise.all([
        db.entities.PatientProfile.filter({}),
        db.entities.Task.list("-created_date", 100),
        db.entities.SymptomCheckin.list("-created_date", 30),
        db.entities.Appointment.list("date", 50)
      ]);
      const profile = profileArr[0] || {};

      const todayMedTasks = (tasks || []).filter((t) => t.type === "medication" && t.date === today);
      const medCompleted = todayMedTasks.filter((t) => t.completed).length;
      const medTotal = todayMedTasks.length;

      const latestCheckin = (checkins || []).find((c) => c.date === today) || (checkins || [])[0] || null;
      const walkTarget = 20;
      const walkMet = latestCheckin && (latestCheckin.activity_minutes || 0) >= walkTarget;
      const poorSleep = latestCheckin && (latestCheckin.sleep_hours || 99) < 6;

      const upcoming = (appts || []).filter((a) => a.date >= today && !a.completed).sort((a, b) => a.date.localeCompare(b.date));
      const nextAppt = upcoming[0] || null;

      let notes = [];
      let chat = [];
      if (profile.share_notes_with_caregiver && latestCheckin && latestCheckin.notes) {
        notes = [latestCheckin.notes];
      }
      if (profile.share_chat_with_caregiver) {
        try {
          chat = await db.entities.Conversation.filter({ context_type: "assistant" }, "-created_date", 10);
        } catch {}
      }

      setData({ profile, medCompleted, medTotal, walkMet, walkTarget, poorSleep, latestCheckin, nextAppt, notes, chat });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>;
  }
  if (!data) return null;
  const { profile, medCompleted, medTotal, walkMet, walkTarget, poorSleep, latestCheckin, nextAppt, notes, chat } = data;

  return (
    <div>
      <PageHeader title="Caregiver view" subtitle="A read-only summary a linked caregiver can see. You control what's shared." icon={Users} />

      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-xs text-muted-foreground">
          All health data belongs to you by default. Caregiver access is opt-in and patient-controlled.
          {!profile.share_notes_with_caregiver && !profile.share_chat_with_caregiver ? " Free-text notes and chat history are currently hidden from this view." : " Some details are shared based on your settings."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Pill} label="Medications today" value={medTotal ? `${medCompleted}/${medTotal} taken` : "No med tasks"} tone={medTotal && medCompleted === medTotal ? "success" : "neutral"} />
        <StatCard icon={Footprints} label="Walking goal" value={walkMet == null ? "No check-in" : walkMet ? `Met (${walkTarget} min)` : "Not yet met"} tone={walkMet ? "success" : "neutral"} />
        <StatCard icon={Moon} label="Sleep quality" value={!latestCheckin ? "No check-in" : poorSleep ? "Poor — flagged" : "OK"} tone={poorSleep ? "warn" : "success"} />
        <StatCard icon={CalendarClock} label="Next appointment" value={nextAppt ? `${formatDateShort(nextAppt.date)}${nextAppt.time ? " · " + prettifyTime(nextAppt.time) : ""}` : "None scheduled"} tone="neutral" />
      </div>

      {nextAppt && (
        <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming appointment</p>
          <p className="mt-1 font-semibold text-foreground">{nextAppt.title}</p>
          {nextAppt.provider && <p className="text-sm text-muted-foreground">{nextAppt.provider}</p>}
          {nextAppt.location && <p className="text-sm text-muted-foreground">{nextAppt.location}</p>}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Check-in notes</p>
          {!profile.share_notes_with_caregiver && <PrivateBadge />}
        </div>
        {profile.share_notes_with_caregiver ? (
          notes.length ? <p className="mt-2 text-sm text-foreground/85">{notes.join(" · ")}</p> : <p className="mt-2 text-sm text-muted-foreground">No notes today.</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Not shared. Enable in Settings to let your caregiver see notes.</p>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ask Mendy chat</p>
          {!profile.share_chat_with_caregiver && <PrivateBadge />}
        </div>
        {profile.share_chat_with_caregiver ? (
          chat && chat.length ? (
            <div className="mt-2 space-y-1.5">
              {chat.slice(0, 8).map((m, i) => (
                <p key={i} className="text-xs text-foreground/80"><span className="font-medium">{m.role === "user" ? "Patient" : "Mendy"}:</span> {m.content?.slice(0, 140)}{(m.content?.length || 0) > 140 ? "…" : ""}</p>
              ))}
            </div>
          ) : <p className="mt-2 text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Not shared. Enable in Settings to let your caregiver see chat history.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    success: "border-success/30 bg-success/5 text-success",
    warn: "border-amber-300 bg-amber-50 text-amber-700",
    neutral: "border-border/70 bg-card text-foreground"
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.neutral}`}>
      <div className="flex items-center gap-2"><Icon className="h-4 w-4 opacity-80" /><span className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</span></div>
      <p className="mt-1.5 font-display text-lg font-bold">{value}</p>
    </div>
  );
}

function PrivateBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"><Lock className="h-3 w-3" /> Private</span>;
}
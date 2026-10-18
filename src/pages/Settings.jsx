import { getDemoClient } from "@/lib/demoClient";
const db = getDemoClient();

import React, { useEffect, useState } from "react";
import { Settings as SettingsIcon, Mail, Bell, MessageSquareText, Users, ShieldCheck, Loader2, Check, MailCheck } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import MendyAvatar from "@/components/MendyAvatar";

const STYLES = [
  { key: "encouraging", label: "Encouraging", hint: "Warm, cheerleading" },
  { key: "direct", label: "Direct & concise", hint: "Short, to the point" },
  { key: "gentle", label: "Gentle & detailed", hint: "Softer, more explanation" }
];

const TOGGLES = [
  { key: "medication_reminders", label: "Medication reminders", icon: Bell, hint: "Email if a dose isn't marked taken within 30 minutes" },
  { key: "daily_checkin_reminders", label: "Daily check-in reminders", icon: Bell, hint: "Nudge to complete today's check-in by early evening" },
  { key: "appointment_reminders", label: "Appointment reminders", icon: Bell, hint: "Day-before reminder for follow-up visits" },
  { key: "caregiver_alerts", label: "Caregiver alerts", icon: Users, hint: "Generic nudge to your caregiver when your update is ready" }
];

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const arr = await db.entities.PatientProfile.filter({});
    setProfile(arr[0] || {});
  };

  const patch = async (updates) => {
    setProfile((p) => ({ ...p, ...updates }));
    setSaving(true);
    try {
      if (profile.id) await db.entities.PatientProfile.update(profile.id, updates);
      else { const created = await db.entities.PatientProfile.create({ full_name: "Patient", ...updates }); setProfile(created); }
    } finally { setSaving(false); }
  };

  const sendTest = async () => {
    setTestSending(true); setTestResult(null);
    try {
      const res = await db.functions.invoke("sendNotificationEmail", {
        to: profile?.notification_email || "",
        subject: "Recovery Companion — test email",
        body: `Hi ${profile?.full_name || "there"},\n\nThis is a test email from your Recovery Companion app. If you received this, email reminders are working.\n\nTake care,\nMendy`,
        type: "appointment_reminder"
      });
      setTestResult(res.data);
    } catch (e) {
      setTestResult({ error: e.message });
    } finally { setTestSending(false); }
  };

  if (!profile) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Email reminders, Mendy's tone, and what you share with a caregiver." icon={SettingsIcon} />

      {/* Email notifications */}
      <Section icon={Mail} title="Email reminders" subtitle="Sent from your connected Gmail account.">
        <Field label="Notification email">
          <input value={profile.notification_email || ""} onChange={(e) => patch({ notification_email: e.target.value })} placeholder={profile.email || "your email"} className="ipt" />
          <p className="mt-1 text-xs text-muted-foreground">Defaults to your account email. Edit to send reminders elsewhere.</p>
        </Field>

        <ToggleRow label="Email reminders enabled" hint="Master switch for all reminder emails" checked={profile.email_opt_in !== false} onToggle={() => patch({ email_opt_in: !(profile.email_opt_in !== false) })} />

        {TOGGLES.map((t) => (
          <ToggleRow key={t.key} label={t.label} hint={t.hint} checked={profile[t.key] !== false} onToggle={() => patch({ [t.key]: !(profile[t.key] !== false) })} disabled={profile.email_opt_in === false} />
        ))}

        <div className="mt-3 flex items-center gap-3">
          <button onClick={sendTest} disabled={testSending} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />} Send test email
          </button>
          {testResult?.sent && <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><Check className="h-3.5 w-3.5" /> Sent!</span>}
          {testResult?.sent === false && <span className="text-xs font-medium text-muted-foreground">{testResult.reason === "opt_in_disabled" ? "That type is turned off" : testResult.reason === "already_sent_today" ? "Already sent today" : testResult.error || "Failed to send"}</span>}
          {testResult?.error && <span className="text-xs font-medium text-destructive">{testResult.error}</span>}
        </div>
      </Section>

      {/* Mendy tone */}
      <Section icon={MessageSquareText} title="Mendy's tone" subtitle="How Mendy phrases answers. This changes tone only — never the medical info.">
        <div className="flex items-center gap-3">
          <MendyAvatar size={44} />
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
            {STYLES.map((s) => (
              <button key={s.key} onClick={() => patch({ mendy_response_style: s.key })} className={`rounded-2xl border-2 p-3 text-left transition ${profile.mendy_response_style === s.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.hint}</p>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Caregiver sharing */}
      <Section icon={Users} title="Caregiver access" subtitle="All health data is yours by default. Sharing is opt-in.">
        <Field label="Caregiver email">
          <input value={profile.caregiver_email || ""} onChange={(e) => patch({ caregiver_email: e.target.value })} placeholder="caregiver@example.com" className="ipt" />
        </Field>
        <ToggleRow label="Share check-in notes with caregiver" hint="Free-text notes from daily check-ins" checked={!!profile.share_notes_with_caregiver} onToggle={() => patch({ share_notes_with_caregiver: !profile.share_notes_with_caregiver })} />
        <ToggleRow label="Share Ask Mendy chat with caregiver" hint="Your Ask Mendy conversation history" checked={!!profile.share_chat_with_caregiver} onToggle={() => patch({ share_chat_with_caregiver: !profile.share_chat_with_caregiver })} />
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-muted/50 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p className="text-xs text-muted-foreground">Caregivers never see notes or chat unless you turn these on. They always see medication status, walking goal, sleep flag, and next appointment.</p>
        </div>
      </Section>

      {saving && <p className="mt-3 text-center text-xs text-muted-foreground">Saving…</p>}
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="mb-5 rounded-3xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div><h2 className="font-display text-base font-bold">{title}</h2><p className="text-xs text-muted-foreground">{subtitle}</p></div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>{children}</div>;
}

function ToggleRow({ label, hint, checked, onToggle, disabled }) {
  return (
    <button onClick={onToggle} disabled={disabled} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 text-left disabled:opacity-50">
      <div><p className="text-sm font-semibold text-foreground">{label}</p><p className="text-xs text-muted-foreground">{hint}</p></div>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
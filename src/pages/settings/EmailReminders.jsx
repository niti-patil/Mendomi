const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { Mail, MailCheck, Loader2, Check } from "lucide-react";

import { usePatientProfile } from "@/hooks/usePatientProfile";
import SaveButton from "@/components/settings/SaveButton";
import SettingsShell, { Field, ToggleRow, SectionCard, Spinner } from "@/components/settings/SettingsShell";

const TOGGLES = [
  { key: "medication_reminders", label: "Medication reminders", hint: "Email if a dose isn't marked taken within 30 minutes" },
  { key: "daily_checkin_reminders", label: "Daily check-in reminders", hint: "Nudge to complete today's check-in by early evening" },
  { key: "appointment_reminders", label: "Appointment reminders", hint: "Day-before reminder for follow-up visits" },
];

export default function EmailReminders() {
  const { profile, patch, save, saving } = usePatientProfile();
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const sendTest = async () => {
    setTestSending(true); setTestResult(null);
    try {
      const res = await db.functions.invoke("sendNotificationEmail", {
        to: profile?.notification_email || "",
        subject: "Recovery Companion — test email",
        body: `Hi ${profile?.full_name || "there"},\n\nThis is a test email from your Recovery Companion app. If you received this, email reminders are working.\n\nTake care,\nMendly`,
        type: "appointment_reminder"
      });
      setTestResult(res.data);
    } catch (e) {
      setTestResult({ error: e.message });
    } finally { setTestSending(false); }
  };

  if (!profile) return <Spinner />;
  return (
    <SettingsShell title="Email reminders" subtitle="Choose which reminders Mendy sends to your inbox." icon={Mail}>
      <SectionCard icon={Mail} title="Reminders" subtitle="Sent from your connected Gmail account.">
        <Field label="Notification email">
          <input value={profile.notification_email || ""} onChange={(e) => patch({ notification_email: e.target.value })} placeholder={profile.email || "your email"} className="ipt" />
          <p className="mt-1 text-xs text-muted-foreground">Defaults to your account email. Edit to send reminders elsewhere.</p>
        </Field>
        <ToggleRow label="Email reminders enabled" hint="Master switch for all reminder emails" checked={profile.email_opt_in !== false} onToggle={() => patch({ email_opt_in: !(profile.email_opt_in !== false) })} />
        {TOGGLES.map((t) => (
          <ToggleRow key={t.key} label={t.label} hint={t.hint} checked={profile[t.key] !== false} onToggle={() => patch({ [t.key]: !(profile[t.key] !== false) })} disabled={profile.email_opt_in === false} />
        ))}
        <div className="mt-3 space-y-2">
          <button onClick={sendTest} disabled={testSending} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />} Send test email
          </button>
          {testResult?.sent && <p className="inline-flex items-center gap-1 text-xs font-medium text-success"><Check className="h-3.5 w-3.5" /> Sent!</p>}
          {testResult?.sent === false && <p className="text-xs font-medium text-muted-foreground">{testResult.reason === "opt_in_disabled" ? "That type is turned off" : testResult.reason === "already_sent_today" ? "Already sent today" : testResult.error || "Failed to send"}</p>}
          {testResult?.error && <p className="text-xs font-medium text-destructive">{testResult.error}</p>}
        </div>
      </SectionCard>
      <SaveButton save={save} saving={saving} />
    </SettingsShell>
  );
}
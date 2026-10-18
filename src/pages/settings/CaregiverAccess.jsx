import { getDemoClient } from "@/lib/demoClient";
const db = getDemoClient();

import { useState } from "react";
import { Users, ShieldCheck, Mail, MailCheck, Loader2, Check } from "lucide-react";

import { usePatientProfile } from "@/hooks/usePatientProfile";
import SaveButton from "@/components/settings/SaveButton";
import SettingsShell, { Field, ToggleRow, SectionCard, Spinner } from "@/components/settings/SettingsShell";

export default function CaregiverAccess() {
  const { profile, patch, save, saving } = usePatientProfile();
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const sendTest = async () => {
    setTestSending(true); setTestResult(null);
    try {
      const res = await db.functions.invoke("sendNotificationEmail", {
        to: profile?.caregiver_email || "",
        subject: "Mendly — caregiver test alert",
        body: `Hi,\n\nThis is a test caregiver alert from ${profile?.full_name || "your contact"}'s Mendly app. If you received this, caregiver alerts are working.\n\nTake care,\nMendly`,
        type: "caregiver_alert"
      });
      setTestResult(res.data);
    } catch (e) {
      setTestResult({ error: e.message });
    } finally { setTestSending(false); }
  };

  if (!profile) return <Spinner />;
  return (
    <SettingsShell title="Caregiver access" subtitle="All health data is yours by default. Sharing is opt-in." icon={Users}>
      <SectionCard icon={Users} title="Caregiver" subtitle="Grant a trusted person limited visibility.">
        <Field label="Caregiver email">
          <input value={profile.caregiver_email || ""} onChange={(e) => patch({ caregiver_email: e.target.value })} placeholder="caregiver@example.com" className="ipt" />
        </Field>
        <ToggleRow label="Send caregiver email alerts" hint="Nudge your caregiver when your update is ready" checked={!!profile.caregiver_alerts} onToggle={() => patch({ caregiver_alerts: !profile.caregiver_alerts })} />
        <ToggleRow label="Share check-in notes with caregiver" hint="Free-text notes from daily check-ins" checked={!!profile.share_notes_with_caregiver} onToggle={() => patch({ share_notes_with_caregiver: !profile.share_notes_with_caregiver })} />
        <ToggleRow label="Share Ask Mendy chat with caregiver" hint="Your Ask Mendy conversation history" checked={!!profile.share_chat_with_caregiver} onToggle={() => patch({ share_chat_with_caregiver: !profile.share_chat_with_caregiver })} />
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-muted/50 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p className="text-xs text-muted-foreground">Caregivers never see notes or chat unless you turn these on. They always see medication status, walking goal, sleep flag, and next appointment.</p>
        </div>
        <div className="mt-3 space-y-2">
          <button onClick={sendTest} disabled={testSending} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />} Send test email
          </button>
          {testResult?.sent && <p className="inline-flex items-center gap-1 text-xs font-medium text-success"><Check className="h-3.5 w-3.5" /> Sent!</p>}
          {testResult?.sent === false && <p className="text-xs font-medium text-muted-foreground">{testResult.reason === "opt_in_disabled" ? "Caregiver alerts are turned off" : testResult.reason === "already_sent_today" ? "Already sent today" : testResult.error || "Failed to send"}</p>}
          {testResult?.error && <p className="text-xs font-medium text-destructive">{testResult.error}</p>}
        </div>
      </SectionCard>
      <SaveButton save={save} saving={saving} />
    </SettingsShell>
  );
}
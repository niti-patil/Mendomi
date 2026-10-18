import { getDemoClient } from "@/lib/demoClient";
const db = getDemoClient();

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Camera, Hospital, Stethoscope, FileText, Syringe, Pill, Shield,
  Bell, Globe, ChevronDown, Plus, Trash2, Loader2, Check, Mail,
  MessageSquareText, Users, CalendarDays, ChevronRight, ShieldCheck, Upload as UploadIcon
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import MendyAvatar from "@/components/MendyAvatar";
import { todayStr } from "@/lib/recovery";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const STYLES = [
  { key: "encouraging", label: "Encouraging", hint: "Warm, cheerleading" },
  { key: "direct", label: "Direct & concise", hint: "Short, to the point" },
  { key: "gentle", label: "Gentle & detailed", hint: "Softer, more explanation" }
];
const TYPE_TOGGLES = [
  { key: "medication_reminders", label: "Medication reminders" },
  { key: "daily_checkin_reminders", label: "Daily check-in reminders" },
  { key: "appointment_reminders", label: "Appointment reminders" },
  { key: "caregiver_alerts", label: "Caregiver alerts" }
];
const COMMON_TZ = ["America/Los_Angeles","America/Denver","America/Chicago","America/New_York","America/Anchorage","Pacific/Honolulu","Europe/London","Europe/Paris","Asia/Tokyo","Australia/Sydney"];

export default function PatientProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState({ care: true, health: false, insurance: false, settings: false });
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const arr = await db.entities.PatientProfile.filter({});
    const p = arr[0] || { full_name: "" };
    if (!p.time_zone) p.time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";
    setProfile(p);
  };
  const patch = async (updates) => {
    setProfile((p) => ({ ...p, ...updates }));
    setSaving(true);
    try {
      if (profile.id) await db.entities.PatientProfile.update(profile.id, updates);
      else { const c = await db.entities.PatientProfile.create({ full_name: "Patient", ...updates }); setProfile(c); }
    } finally { setSaving(false); }
  };
  const uploadPhoto = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    try { const { file_url } = await db.integrations.Core.UploadFile({ file }); await patch({ profile_photo_url: file_url }); }
    finally { setPhotoUploading(false); }
  };
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const surgeryDate = profile?.procedure_date || profile?.surgery_date;
  const dayN = useMemo(() => {
    if (!surgeryDate) return null;
    const diff = Math.floor((new Date(todayStr()) - new Date(surgeryDate)) / 86400000);
    return diff >= 0 ? diff + 1 : null;
  }, [surgeryDate]);

  if (!profile) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>;

  return (
    <div>
      <PageHeader title="My profile" subtitle="Your recovery details, health info, and settings in one place." icon={User} />

      {/* Header card */}
      <div className="mb-5 card-soft p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            {profile.profile_photo_url
              ? <img src={profile.profile_photo_url} alt="profile" className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20" />
              : <div className="h-20 w-20 rounded-full bg-primary/10 text-primary grid place-items-center"><User className="h-8 w-8" /></div>}
            <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center cursor-pointer shadow-md hover:bg-primary/90">
              {photoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
            </label>
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold truncate">{profile.full_name || "Your name"}</h2>
            <p className="text-sm text-muted-foreground">{profile.procedure_name || profile.surgery_type || "Recovery"}</p>
            {dayN != null
              ? <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent-foreground"><CalendarDays className="h-3 w-3" /> Day {dayN} of recovery</span>
              : <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Add a procedure date to track your day</span>}
          </div>
        </div>
      </div>

      <Collapsible icon={Hospital} title="Care details" subtitle="Hospital, doctor, and procedure" open={open.care} onToggle={() => toggle("care")}>
        <Field label="Hospital name"><input value={profile.hospital_name || ""} onChange={(e) => patch({ hospital_name: e.target.value })} placeholder="e.g. St. Mary's" className="ipt" /></Field>
        <Field label="Primary doctor"><input value={profile.primary_doctor || ""} onChange={(e) => patch({ primary_doctor: e.target.value })} placeholder="Dr. Smith" className="ipt" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Procedure name"><input value={profile.procedure_name || ""} onChange={(e) => patch({ procedure_name: e.target.value })} placeholder="e.g. Knee arthroscopy" className="ipt" /></Field>
          <Field label="Procedure date"><input type="date" value={profile.procedure_date || ""} onChange={(e) => patch({ procedure_date: e.target.value })} className="ipt" /></Field>
        </div>
      </Collapsible>

      <Collapsible icon={FileText} title="Health info" subtitle="Records, vaccines, and allergies" open={open.health} onToggle={() => toggle("health")}>
        <MedicalRecords />
        <Vaccines />
        <AllergyMedications />
      </Collapsible>

      <Collapsible icon={Shield} title="Insurance" subtitle="Provider and member ID" open={open.insurance} onToggle={() => toggle("insurance")}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Insurance provider"><input value={profile.insurance_provider || ""} onChange={(e) => patch({ insurance_provider: e.target.value })} placeholder="e.g. Blue Cross" className="ipt" /></Field>
          <Field label="Member ID"><input value={profile.insurance_member_id || ""} onChange={(e) => patch({ insurance_member_id: e.target.value })} placeholder="XXX123456" className="ipt" /></Field>
        </div>
      </Collapsible>

      <Collapsible icon={Bell} title="Settings" subtitle="Reminders, caregiver, timezone, Mendy" open={open.settings} onToggle={() => toggle("settings")}>
        <SettingsSection profile={profile} patch={patch} />
      </Collapsible>

      {saving && <p className="mt-3 text-center text-xs text-muted-foreground">Saving…</p>}
    </div>
  );
}

function Collapsible({ icon: Icon, title, subtitle, open, onToggle, children }) {
  return (
    <div className="mb-4 card-soft overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-5 text-left">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div className="flex-1"><h2 className="font-display text-base font-bold">{title}</h2><p className="text-xs text-muted-foreground">{subtitle}</p></div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-4 px-5 pb-5">{children}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>{children}</div>;
}

function SettingsSection({ profile, patch }) {
  return (
    <div className="space-y-5">
      <div>
        <SubLabel icon={Mail}>Email reminders</SubLabel>
        <Field label="Notification email">
          <input value={profile.notification_email || ""} onChange={(e) => patch({ notification_email: e.target.value })} placeholder={profile.email || "your email"} className="ipt" />
        </Field>
        <ToggleRow label="Email reminders enabled" checked={profile.email_opt_in !== false} onToggle={() => patch({ email_opt_in: !(profile.email_opt_in !== false) })} />
        {TYPE_TOGGLES.map((t) => (
          <ToggleRow key={t.key} label={t.label} checked={profile[t.key] !== false} onToggle={() => patch({ [t.key]: !(profile[t.key] !== false) })} disabled={profile.email_opt_in === false} />
        ))}
      </div>

      <div>
        <SubLabel icon={Users}>Caregiver access</SubLabel>
        <Field label="Caregiver email"><input value={profile.caregiver_email || ""} onChange={(e) => patch({ caregiver_email: e.target.value })} placeholder="caregiver@example.com" className="ipt" /></Field>
        <ToggleRow label="Send caregiver email alerts" checked={!!profile.caregiver_alerts} onToggle={() => patch({ caregiver_alerts: !profile.caregiver_alerts })} />
        <ToggleRow label="Share check-in notes with caregiver" checked={!!profile.share_notes_with_caregiver} onToggle={() => patch({ share_notes_with_caregiver: !profile.share_notes_with_caregiver })} />
        <ToggleRow label="Share Ask Mendy chat with caregiver" checked={!!profile.share_chat_with_caregiver} onToggle={() => patch({ share_chat_with_caregiver: !profile.share_chat_with_caregiver })} />
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-muted/50 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p className="text-xs text-muted-foreground">Caregivers never see notes or chat unless you turn these on.</p>
        </div>
      </div>

      <div>
        <SubLabel icon={Globe}>Time zone</SubLabel>
        <Select value={profile.time_zone || undefined} onValueChange={(v) => patch({ time_zone: v })}>
          <SelectTrigger className="ipt h-11 md:h-9"><SelectValue placeholder="Select time zone" /></SelectTrigger>
          <SelectContent>
            {!COMMON_TZ.includes(profile.time_zone) && profile.time_zone && <SelectItem value={profile.time_zone}>{profile.time_zone}</SelectItem>}
            {COMMON_TZ.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <SubLabel icon={MessageSquareText}>Mendy's response style</SubLabel>
        <div className="flex items-center gap-3">
          <MendyAvatar size={40} />
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
            {STYLES.map((s) => (
              <button key={s.key} onClick={() => patch({ mendy_response_style: s.key })} className={`rounded-2xl border-2 p-3 text-left transition ${profile.mendy_response_style === s.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <p className="text-sm font-semibold">{s.label}</p><p className="text-xs text-muted-foreground">{s.hint}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

function SubLabel({ icon: Icon, children }) {
  return <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wide text-primary"><Icon className="h-3.5 w-3.5" /> {children}</div>;
}
function ToggleRow({ label, checked, onToggle, disabled }) {
  return (
    <button onClick={onToggle} disabled={disabled} className="mt-2 flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 text-left disabled:opacity-50">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/* ---- Health info sub-sections ---- */
function MedicalRecords() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const load = async () => setItems(await db.entities.MedicalRecord.list("-upload_date", 100));
  useEffect(() => { load(); }, []);
  const add = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      await db.entities.MedicalRecord.create({ title: title.trim() || file.name, file_url, file_name: file.name, upload_date: todayStr() });
      setTitle("");
      load();
    } finally { setUploading(false); }
  };
  const remove = async (id) => { await db.entities.MedicalRecord.delete(id); load(); };
  return (
    <div>
      <SubLabel icon={FileText}>Medical records</SubLabel>
      <div className="flex gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Record title (optional)" className="ipt" />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 shrink-0">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadIcon className="h-4 w-4" />} Upload
        </button>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => add(e.target.files?.[0])} />
      </div>
      <RecordList items={items} empty="No records yet" remove={remove} />
    </div>
  );
}

function Vaccines() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const load = async () => setItems(await db.entities.VaccineRecord.list("-date", 100));
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!name.trim()) return;
    await db.entities.VaccineRecord.create({ vaccine_name: name.trim(), date: date || todayStr(), notes: notes.trim() });
    setName(""); setDate(""); setNotes(""); load();
  };
  const remove = async (id) => { await db.entities.VaccineRecord.delete(id); load(); };
  return (
    <div>
      <SubLabel icon={Syringe}>Vaccine records</SubLabel>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vaccine name" className="ipt" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ipt" />
        </div>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="ipt" />
        <button onClick={add} disabled={!name.trim()} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:opacity-90 disabled:opacity-60">
          <Plus className="h-4 w-4" /> Add vaccine
        </button>
      </div>
      <RecordList items={items.map((v) => ({ id: v.id, title: v.vaccine_name, sub: v.date, notes: v.notes }))} empty="No vaccines yet" remove={remove} />
    </div>
  );
}

function AllergyMedications() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("allergy");
  const [notes, setNotes] = useState("");
  const load = async () => setItems(await db.entities.AllergyMedication.list("-created_date", 100));
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!name.trim()) return;
    await db.entities.AllergyMedication.create({ name: name.trim(), type, notes: notes.trim() });
    setName(""); setNotes(""); load();
  };
  const remove = async (id) => { await db.entities.AllergyMedication.delete(id); load(); };
  return (
    <div>
      <SubLabel icon={Pill}>Allergies & medications</SubLabel>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="ipt w-auto h-11 md:h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="allergy">Allergy</SelectItem>
              <SelectItem value="medication">Medication</SelectItem>
            </SelectContent>
          </Select>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="ipt" />
        </div>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="ipt" />
        <button onClick={add} disabled={!name.trim()} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-60">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      <RecordList items={items.map((a) => ({ id: a.id, title: a.name, sub: a.type, notes: a.notes }))} empty="None added yet" remove={remove} />
    </div>
  );
}

function RecordList({ items, empty, remove }) {
  if (!items.length) return <p className="mt-2 text-xs text-muted-foreground">{empty}</p>;
  return (
    <div className="mt-2 space-y-2">
      {items.map((it) => (
        <div key={it.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{it.title}</p>
            {it.sub && <p className="text-xs text-muted-foreground">{it.sub}{it.notes ? ` · ${it.notes}` : ""}</p>}
            {!it.sub && it.notes && <p className="text-xs text-muted-foreground">{it.notes}</p>}
          </div>
          <button onClick={() => remove(it.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
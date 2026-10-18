import { getDemoClient } from "@/lib/demoClient";
const db = getDemoClient();

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload as UploadIcon, Loader2, CheckCircle2, Sparkles, AlertCircle, Link2, FileText, X, Link as LinkIcon } from "lucide-react";

import { todayStr } from "@/lib/recovery";

const STEPS = { SELECT: "select", EXTRACTING: "extracting", REVIEW: "review", SAVED: "saved" };

let idc = 0;
const uid = () => `f${++idc}-${Date.now()}`;

export default function Upload() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.SELECT);
  const [files, setFiles] = useState([]);
  const [extracted, setExtracted] = useState(null);
  const [error, setError] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const navTimer = useRef(null);

  useEffect(() => () => { if (navTimer.current) clearTimeout(navTimer.current); }, []);

  const lowConf = (key) => extracted?.field_confidence && typeof extracted.field_confidence[key] === "number" && extracted.field_confidence[key] < 0.6;

  const addFiles = async (fileList) => {
    if (!fileList?.length) return;
    setError("");
    const entries = [...fileList].map((f) => ({ id: uid(), name: f.name, url: "", kind: "file", status: "uploading", file: f }));
    setFiles((prev) => [...prev, ...entries]);
    await Promise.all(entries.map(async (entry) => {
      try {
        const { file_url } = await db.integrations.Core.UploadFile({ file: entry.file });
        setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, url: file_url, status: "done" } : f)));
      } catch {
        setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "error" } : f)));
      }
    }));
  };

  const addLink = () => { setLinkOpen(true); setLinkValue(""); };
  const submitLink = () => {
    const url = linkValue.trim();
    if (url) {
      setError("");
      setFiles((prev) => {
        if (prev.some((f) => f.url === url)) return prev;
        return [...prev, { id: uid(), name: url, url, kind: "link", status: "done" }];
      });
    }
    setLinkOpen(false);
    setLinkValue("");
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const retryFile = async (entry) => {
    if (!entry.file) return;
    setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "uploading" } : f)));
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file: entry.file });
      setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, url: file_url, status: "done" } : f)));
    } catch {
      setFiles((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: "error" } : f)));
    }
  };

  const uploading = files.some((f) => f.status === "uploading");
  const readyFiles = files.filter((f) => f.status === "done");
  const hasFailures = files.some((f) => f.status === "error");
  const allReady = readyFiles.length > 0 && !uploading;

  const extract = async () => {
    if (!allReady) return;
    setError("");
    setStep(STEPS.EXTRACTING);
    try {
      const urls = readyFiles.map((f) => f.url);
      const result = await db.functions.invoke("generate_recovery_plan", { file_urls: urls });
      const data = result.data;
      if (data?.error) throw new Error(data.error);
      setExtracted(data);
      setStep(STEPS.REVIEW);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Could not read the documents. Please try clearer photos.");
      setStep(STEPS.SELECT);
    }
  };

  const savePlan = async () => {
    try {
      setStep(STEPS.SAVED);
      const today = todayStr();

      // Remove the built-in example paper (and all its sample data) before saving the real one.
      const existingDocs = await db.entities.DischargeDocument.list();
      for (const d of existingDocs) {
        if (d.is_sample) await db.entities.DischargeDocument.delete(d.id);
      }

      const sourceUrls = readyFiles.map((f) => f.url).join(", ");
      const doc = await db.entities.DischargeDocument.create({
        file_url: sourceUrls,
        file_name: readyFiles.map((f) => f.name).join(", ") || "Discharge document",
        status: "extracted",
        extracted_json: extracted,
        diagnosis: extracted.diagnosis || "",
        restrictions: extracted.restrictions || []
      });
      const meds = extracted.medications || [];
      const medRecords = meds.length ? await db.entities.Medication.bulkCreate(
        meds.map((m) => ({
          name: m.name || "Medication",
          dosage: m.dosage || "",
          frequency: m.frequency || "",
          instructions: m.instructions || "",
          purpose: m.purpose || "",
          schedule_times: m.reminders || [],
          active: true,
          source_doc_id: doc.id
        }))
      ) : [];
      const taskList = extracted.daily_tasks || [];
      const durationDays = Math.min(Math.max(extracted.recovery_duration_days || 14, 1), 30);
      const startDate = new Date(today + "T00:00:00");
      let medIdx = 0;
      const tasks = [];
      taskList.forEach((t, i) => {
        let medId = "";
        if (t.category === "medication" && medRecords[medIdx]) {
          medId = medRecords[medIdx].id;
          medIdx = Math.min(medIdx + 1, medRecords.length - 1);
        }
        const days = t.recurring === false ? 1 : durationDays;
        for (let d = 0; d < days; d++) {
          const day = new Date(startDate);
          day.setDate(day.getDate() + d);
          tasks.push({
            title: t.title || "Task",
            category: t.category || "self_care",
            scheduled_time: t.scheduled_time || "",
            task_date: day.toISOString().slice(0, 10),
            completed: false,
            order: i,
            medication_id: medId,
            recurring: t.recurring !== false,
            source_doc_id: doc.id
          });
        }
      });
      if (tasks.length) await db.entities.DailyTask.bulkCreate(tasks);
      if (extracted.appointment && extracted.appointment.title) {
        await db.entities.Appointment.create({
          title: extracted.appointment.title,
          provider: extracted.appointment.provider || "",
          location: extracted.appointment.location || "",
          date: extracted.appointment.date || today,
          time: extracted.appointment.time || "",
          notes: extracted.appointment.notes || "",
          source_doc_id: doc.id
        });
      }

      // Keep the profile in sync with the new paper.
      const profiles = await db.entities.PatientProfile.filter({});
      if (profiles[0]) {
        await db.entities.PatientProfile.update(profiles[0].id, {
          diagnosis: extracted.diagnosis || "",
          surgery_type: extracted.procedure || "",
          procedure_name: extracted.procedure || "",
          restrictions_summary: (extracted.restrictions || []).join("; ")
        });
      }

      navTimer.current = setTimeout(() => navigate("/plan?tab=plan"), 1100);
    } catch (e) {
      setError(e.message || "Could not save your plan.");
      setStep(STEPS.REVIEW);
    }
  };

  return (
    <div>
      <div className="mb-4 rounded-3xl border border-border/70 bg-card p-5">
        <h1 className="font-display text-xl font-bold tracking-tight">Upload discharge papers</h1>
        <p className="text-sm text-muted-foreground">Add one or more files or a link. Mendy reads them together and builds your recovery plan.</p>
      </div>

      {step === STEPS.SELECT && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <UploadCard className="md:hidden" icon={Camera} title="Take a photo" desc="Use your camera to photograph the papers" onClick={() => cameraRef.current?.click()} loading={uploading} />
            <UploadCard icon={UploadIcon} title="Choose files" desc="Upload one or more PDFs or images" onClick={() => fileRef.current?.click()} loading={uploading} />
            <UploadCard icon={Link2} title="Paste a link" desc="Use a link to your hospital portal or online papers" onClick={addLink} loading={uploading} />
            <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => { addFiles([...e.target.files]); e.target.value = ""; }} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { addFiles([...e.target.files]); e.target.value = ""; }} />
          </div>

          {files.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">{files.length} item{files.length > 1 ? "s" : ""} added</p>
              <ul className="space-y-2">
                {files.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 rounded-xl bg-background px-3 py-2.5">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      {f.kind === "link" ? <LinkIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.status === "uploading" ? "Uploading…" : f.status === "error" ? "Upload failed" : f.kind === "link" ? "Link ready" : "Ready"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {f.status === "uploading" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : f.status === "error" ? (
                        <button onClick={() => retryFile(f)} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10">Retry</button>
                      ) : null}
                      <button onClick={() => removeFile(f.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Remove">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <ErrorBanner message={error} />}

          <button
            onClick={extract}
            disabled={!allReady}
            className="w-full rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : allReady ? `Done — extract my plan${hasFailures ? " (skip failed)" : ""}` : "Add files to continue"}
          </button>
          {linkOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4" onClick={() => { if (linkValue.trim()) { submitLink(); } else { setLinkOpen(false); } }}>
              <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">Paste a link</h3>
                  <button onClick={() => setLinkOpen(false)} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
                </div>
                <input value={linkValue} onChange={(e) => setLinkValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && linkValue.trim()) { e.preventDefault(); submitLink(); } }} placeholder="https://…" className="ipt" autoFocus />
                <button onClick={submitLink} disabled={!linkValue.trim()} className="mt-3 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Add link</button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === STEPS.EXTRACTING && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border/70 bg-card py-16 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 font-display text-lg font-semibold">Mendy is reading your papers…</p>
          <p className="mt-1 text-sm text-muted-foreground">Extracting diagnosis, medications, and your recovery plan from {files.length} item{files.length > 1 ? "s" : ""}</p>
          <div className="mt-6 max-w-xs space-y-2 text-left">
            {["Reading diagnosis", "Finding medications", "Building daily plan", "Identifying follow-ups"].map((s) => (
              <p key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> {s}…
              </p>
            ))}
          </div>
        </div>
      )}

      {step === STEPS.REVIEW && extracted && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Mendy read your discharge papers</p>
              <p className="text-sm text-emerald-700">Review the plan below and we'll set it up for today.</p>
            </div>
          </div>

          <Section title="Diagnosis" warn={lowConf("diagnosis")}>
            <p className="font-semibold text-foreground">{extracted.diagnosis}</p>
            {extracted.procedure && <p className="text-sm text-muted-foreground">Procedure: {extracted.procedure}</p>}
            {extracted.summary && <p className="mt-2 text-sm text-foreground/80">{extracted.summary}</p>}
          </Section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="Medications" warn={lowConf("medications")}>
              {extracted.medications?.length ? extracted.medications.map((m, i) => (
                <div key={i} className="rounded-xl bg-sky-50 p-3 ring-1 ring-sky-100">
                  <p className="text-sm font-semibold text-foreground">{m.name} {m.dosage}</p>
                  <p className="text-xs text-muted-foreground">{m.frequency}</p>
                  {m.instructions && <p className="text-xs text-muted-foreground">{m.instructions}</p>}
                </div>
              )) : <Muted>None found</Muted>}
            </Section>
            <Section title="Restrictions" warn={lowConf("restrictions")}>
              {extracted.restrictions?.length ? (
                <ul className="space-y-1.5">{extracted.restrictions.map((r, i) => <li key={i} className="flex gap-2 text-sm text-foreground/80"><span className="text-primary">•</span>{r}</li>)}</ul>
              ) : <Muted>None found</Muted>}
            </Section>
          </div>

          <Section title="Daily recovery plan">
            <div className="flex flex-wrap gap-2">
              {extracted.daily_tasks?.map((t, i) => (
                <span key={i} className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground/80">{t.title}</span>
              ))}
            </div>
          </Section>

          {extracted.appointment?.title && (
            <Section title="Follow-up appointment" warn={lowConf("appointment")}>
              <p className="text-sm font-semibold text-foreground">{extracted.appointment.title}</p>
              <p className="text-sm text-muted-foreground">{extracted.appointment.provider} · {extracted.appointment.date} {extracted.appointment.time}</p>
            </Section>
          )}

          {error && <ErrorBanner message={error} />}

          <div className="flex gap-3">
            <button onClick={() => { setStep(STEPS.SELECT); setExtracted(null); }} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted">Redo</button>
            <button onClick={savePlan} className="flex-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:flex-none">Save & start recovery</button>
          </div>
        </div>
      )}

      {step === STEPS.SAVED && (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-emerald-50 py-16 text-center ring-1 ring-emerald-100">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <p className="mt-4 font-display text-xl font-semibold text-emerald-800">Your plan is ready!</p>
          <p className="mt-1 text-sm text-emerald-700">Taking you to today's plan…</p>
        </div>
      )}
    </div>
  );
}

function UploadCard({ icon: Icon, title, desc, onClick, loading, className = "" }) {
  return (
    <button onClick={onClick} disabled={loading} className={`flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card p-8 text-center transition-all hover:border-primary hover:bg-accent/30 disabled:opacity-60 ${className}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" strokeWidth={2.2} />}
      </div>
      <div>
        <p className="font-display font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

function Section({ title, warn, children }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        {warn && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200"><AlertCircle className="h-3 w-3" /> Please verify</span>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Muted({ children }) { return <p className="text-sm text-muted-foreground">{children}</p>; }
function ErrorBanner({ message }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
      <p className="text-sm text-rose-700">{message}</p>
    </div>
  );
}
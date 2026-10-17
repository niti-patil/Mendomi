const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useRef, useState } from "react";
import { FileText, Syringe, Pill, Plus, Trash2, Loader2, Upload as UploadIcon } from "lucide-react";

import { todayStr } from "@/lib/recovery";
import { SubLabel } from "@/components/settings/SettingsShell";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function MedicalRecords() {
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

export function Vaccines() {
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
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vaccine name" className="ipt min-w-0" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ipt min-w-0" />
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

export function AllergyMedications() {
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

export function RecordList({ items, empty, remove }) {
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
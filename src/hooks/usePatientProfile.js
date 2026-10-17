const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function usePatientProfile() {
  const qc = useQueryClient();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const arr = await db.entities.PatientProfile.filter({});
    const p = arr[0] || { full_name: "" };
    if (!p.time_zone) p.time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";
    setProfile(p);
  };

  useEffect(() => { load(); }, []);

  // Local-only update; call save() to persist.
  const patch = (updates) => {
    setProfile((p) => ({ ...p, ...updates }));
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      if (profile.id) {
        const updated = await db.entities.PatientProfile.update(profile.id, profile);
        setProfile(updated);
      } else {
        const created = await db.entities.PatientProfile.create({ full_name: "Patient", ...profile });
        setProfile(created);
      }
      qc.invalidateQueries({ queryKey: ['me-profile'] });
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setSaving(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      const next = { ...profile, profile_photo_url: file_url };
      setProfile(next);
      if (profile?.id) await db.entities.PatientProfile.update(profile.id, { profile_photo_url: file_url });
      else {
        const created = await db.entities.PatientProfile.create({ full_name: "Patient", profile_photo_url: file_url });
        setProfile(created);
      }
      qc.invalidateQueries({ queryKey: ['me-profile'] });
    } finally { setSaving(false); }
  };

  return { profile, patch, save, saving, uploadPhoto, setProfile, reload: load };
}
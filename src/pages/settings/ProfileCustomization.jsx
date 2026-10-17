import { User, Camera } from "lucide-react";
import { usePatientProfile } from "@/hooks/usePatientProfile";
import SaveButton from "@/components/settings/SaveButton";
import SettingsShell, { Field, Spinner } from "@/components/settings/SettingsShell";

export default function ProfileCustomization() {
  const { profile, patch, save, saving, uploadPhoto } = usePatientProfile();
  if (!profile) return <Spinner />;
  return (
    <SettingsShell title="Profile" subtitle="Your photo and contact details." icon={User}>
      <div className="mb-4 card-soft p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            {profile.profile_photo_url
              ? <img src={profile.profile_photo_url} alt="profile" className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20" />
              : <div className="h-20 w-20 rounded-full bg-primary/10 text-primary grid place-items-center"><User className="h-8 w-8" /></div>}
            <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center cursor-pointer shadow-md hover:bg-primary/90">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
            </label>
          </div>
          <div className="flex-1">
            <Field label="Full name">
              <input value={profile.full_name || ""} onChange={(e) => patch({ full_name: e.target.value })} placeholder="Your name" className="ipt" />
            </Field>
          </div>
        </div>
      </div>
      <div className="card-soft p-5">
        <Field label="Date of birth"><input type="date" value={profile.date_of_birth || ""} onChange={(e) => patch({ date_of_birth: e.target.value })} className="ipt" /></Field>
        <Field label="Phone"><input value={profile.phone || ""} onChange={(e) => patch({ phone: e.target.value })} placeholder="(555) 123-4567" className="ipt" /></Field>
        <Field label="Emergency contact name"><input value={profile.emergency_contact_name || ""} onChange={(e) => patch({ emergency_contact_name: e.target.value })} placeholder="e.g. Jane Doe" className="ipt" /></Field>
        <Field label="Emergency contact phone"><input value={profile.emergency_contact_phone || ""} onChange={(e) => patch({ emergency_contact_phone: e.target.value })} placeholder="(555) 123-4567" className="ipt" /></Field>
      </div>
      <SaveButton save={save} saving={saving} />
    </SettingsShell>
  );
}
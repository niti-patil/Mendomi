import { MessageSquareText } from "lucide-react";
import { usePatientProfile } from "@/hooks/usePatientProfile";
import SaveButton from "@/components/settings/SaveButton";
import SettingsShell, { SectionCard, Spinner } from "@/components/settings/SettingsShell";
import MendyAvatar from "@/components/MendyAvatar";

const STYLES = [
  { key: "encouraging", label: "Encouraging", hint: "Warm, cheerleading" },
  { key: "direct", label: "Direct & concise", hint: "Short, to the point" },
  { key: "gentle", label: "Gentle & detailed", hint: "Softer, more explanation" }
];

export default function MendyTone() {
  const { profile, patch, save, saving } = usePatientProfile();
  if (!profile) return <Spinner />;
  return (
    <SettingsShell title="Mendy's tone" subtitle="How Mendy phrases answers — tone only, never the medical info." icon={MessageSquareText}>
      <SectionCard icon={MessageSquareText} title="Response style">
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
      </SectionCard>
      <SaveButton save={save} saving={saving} />
    </SettingsShell>
  );
}
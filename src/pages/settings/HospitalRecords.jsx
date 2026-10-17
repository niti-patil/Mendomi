import { Hospital, Shield, FileText } from "lucide-react";
import { usePatientProfile } from "@/hooks/usePatientProfile";
import SaveButton from "@/components/settings/SaveButton";
import SettingsShell, { Field, SectionCard, Spinner } from "@/components/settings/SettingsShell";
import { MedicalRecords, Vaccines, AllergyMedications } from "@/components/health/HealthInfo";

export default function HospitalRecords() {
  const { profile, patch, save, saving } = usePatientProfile();
  if (!profile) return <Spinner />;
  return (
    <SettingsShell title="Hospital & records" subtitle="Procedure, insurance, and health records." icon={Hospital}>
      <SectionCard icon={Hospital} title="Care details" subtitle="Hospital, doctor, and procedure">
        <Field label="Hospital name"><input value={profile.hospital_name || ""} onChange={(e) => patch({ hospital_name: e.target.value })} placeholder="e.g. St. Mary's" className="ipt" /></Field>
        <Field label="Primary doctor"><input value={profile.primary_doctor || ""} onChange={(e) => patch({ primary_doctor: e.target.value })} placeholder="Dr. Smith" className="ipt" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Procedure name"><input value={profile.procedure_name || ""} onChange={(e) => patch({ procedure_name: e.target.value })} placeholder="e.g. Knee arthroscopy" className="ipt" /></Field>
          <Field label="Procedure date"><input type="date" value={profile.procedure_date || ""} onChange={(e) => patch({ procedure_date: e.target.value })} className="ipt" /></Field>
        </div>
        <Field label="Diagnosis"><input value={profile.diagnosis || ""} onChange={(e) => patch({ diagnosis: e.target.value })} placeholder="e.g. Meniscal tear" className="ipt" /></Field>
        <Field label="Restrictions summary"><textarea value={profile.restrictions_summary || ""} onChange={(e) => patch({ restrictions_summary: e.target.value })} placeholder="e.g. No heavy lifting for 6 weeks" className="ipt min-h-[80px]" /></Field>
      </SectionCard>
      <SectionCard icon={Shield} title="Insurance" subtitle="Provider and member ID">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Provider"><input value={profile.insurance_provider || ""} onChange={(e) => patch({ insurance_provider: e.target.value })} placeholder="e.g. Blue Cross" className="ipt" /></Field>
          <Field label="Member ID"><input value={profile.insurance_member_id || ""} onChange={(e) => patch({ insurance_member_id: e.target.value })} placeholder="XXX123456" className="ipt" /></Field>
        </div>
      </SectionCard>
      <SectionCard icon={FileText} title="Health info" subtitle="Records, vaccines, and allergies">
        <MedicalRecords />
        <Vaccines />
        <AllergyMedications />
      </SectionCard>
      <SaveButton save={save} saving={saving} />
    </SettingsShell>
  );
}
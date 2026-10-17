import { useSearchParams } from "react-router-dom";
import HubTabs from "@/components/HubTabs";
import DoctorReport from "@/pages/DoctorReport";
import CaregiverDashboard from "@/pages/CaregiverDashboard";
import { Stethoscope, Users } from "lucide-react";

const TABS = [
  { key: "report", label: "Doctor Report", icon: Stethoscope },
  { key: "caregiver", label: "Caregiver", icon: Users },
];

export default function ReportsHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "report";
  const setTab = (t) => setParams(t === "report" ? {} : { tab: t }, { replace: true });
  return (
    <div>
      <div className="mb-4"><HubTabs tabs={TABS} active={tab} onChange={setTab} /></div>
      <div>
        {tab === "report" && <DoctorReport />}
        {tab === "caregiver" && <CaregiverDashboard />}
      </div>
    </div>
  );
}
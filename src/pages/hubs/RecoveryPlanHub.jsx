import { useSearchParams } from "react-router-dom";
import HubTabs from "@/components/HubTabs";
import RecoveryPlan from "@/pages/RecoveryPlan";
import Medications from "@/pages/Medications";
import SymptomCheckIn from "@/pages/SymptomCheckin";
import Progress from "@/pages/Progress";
import { ListChecks, Pill, HeartPulse, LineChart } from "lucide-react";

const TABS = [
  { key: "plan", label: "Plan", icon: ListChecks },
  { key: "checkin", label: "Check-in", icon: HeartPulse },
  { key: "meds", label: "Medications", icon: Pill },
  { key: "progress", label: "Progress", icon: LineChart },
];

export default function RecoveryPlanHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "plan";
  const setTab = (t) => setParams(t === "plan" ? {} : { tab: t }, { replace: true });
  return (
    <div>
      <div className="mb-4"><HubTabs tabs={TABS} active={tab} onChange={setTab} /></div>
      <div>
        {tab === "plan" && <RecoveryPlan />}
        {tab === "meds" && <Medications />}
        {tab === "checkin" && <SymptomCheckIn />}
        {tab === "progress" && <Progress />}
      </div>
    </div>
  );
}
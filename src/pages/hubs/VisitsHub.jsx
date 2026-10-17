import { useSearchParams } from "react-router-dom";
import HubTabs from "@/components/HubTabs";
import Appointments from "@/pages/Appointments";
import FollowupReminder from "@/pages/FollowupReminder";
import { CalendarDays, ClipboardCheck } from "lucide-react";

const TABS = [
  { key: "appointments", label: "Appointments", icon: CalendarDays },
  { key: "followup", label: "Follow-up", icon: ClipboardCheck },
];

export default function VisitsHub() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "appointments";
  const setTab = (t) => setParams(t === "appointments" ? {} : { tab: t }, { replace: true });
  return (
    <div>
      <div className="mb-4"><HubTabs tabs={TABS} active={tab} onChange={setTab} /></div>
      <div>
        {tab === "appointments" && <Appointments />}
        {tab === "followup" && <FollowupReminder />}
      </div>
    </div>
  );
}
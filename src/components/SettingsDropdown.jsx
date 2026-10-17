import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as GearIcon, User, Hospital, Mail, MessageSquareText, Users, MoreHorizontal, Bookmark } from "lucide-react";

const ITEMS = [
  { to: "/settings/profile", label: "Profile", icon: User },
  { to: "/settings/hospital-records", label: "Hospital & Records", icon: Hospital },
  { to: "/settings/email", label: "Email reminders", icon: Mail },
  { to: "/settings/tone", label: "Mendy's tone", icon: MessageSquareText },
  { to: "/settings/saved", label: "Saved questions", icon: Bookmark },
  { to: "/settings/caregiver", label: "Caregiver access", icon: Users },
  { to: "/settings/other", label: "Other", icon: MoreHorizontal },
];

export default function SettingsDropdown({ triggerClassName = "", triggerStyle = {} }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  const go = (to) => { setOpen(false); navigate(to); };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  return (
    <div className="relative flex items-stretch" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={triggerStyle}
        className={triggerClassName || "p-2 rounded-lg hover:bg-muted text-foreground/80"}
        aria-label="Settings"
      >
        <GearIcon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">
          {ITEMS.map((it) => (
            <button key={it.to} onClick={() => go(it.to)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted">
              <it.icon className="h-4 w-4 text-muted-foreground" /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
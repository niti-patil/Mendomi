export default function HubTabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 pb-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition ${active === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
        >
          {t.icon && <t.icon className="h-4 w-4" />} {t.label}
        </button>
      ))}
    </div>
  );
}
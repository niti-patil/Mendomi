export function Spinner() {
  return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>;
}

export default function SettingsShell({ title, subtitle, children }) {
  return (
    <div>
      <div className="mb-4 rounded-3xl border border-border/70 bg-card p-5">
        <h1 className="font-display text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Field({ label, children }) {
  return <div className="mb-3 min-w-0"><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>{children}</div>;
}

export function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="mb-4 rounded-3xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div><h2 className="font-display text-base font-bold">{title}</h2>{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}</div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function ToggleRow({ label, hint, checked, onToggle, disabled }) {
  return (
    <button onClick={onToggle} disabled={disabled} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 text-left disabled:opacity-50">
      <div><p className="text-sm font-semibold text-foreground">{label}</p>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function SubLabel({ icon: Icon, children }) {
  return <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><Icon className="h-3.5 w-3.5" /> {children}</div>;
}
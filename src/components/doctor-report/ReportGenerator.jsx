const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Loader2, Pill, TrendingDown, Moon, Footprints, AlertTriangle, Sparkles } from 'lucide-react';

const DEFAULTS = {
  medication: true,
  pain: true,
  sleep: true,
  activity: true,
  flags: true,
  summary: true,
};

const OPTIONS = [
  { key: 'medication', label: 'Medication adherence', icon: Pill },
  { key: 'pain', label: 'Pain trend', icon: TrendingDown },
  { key: 'sleep', label: 'Sleep quality', icon: Moon },
  { key: 'activity', label: 'Activity summary', icon: Footprints },
  { key: 'flags', label: 'Symptom flags', icon: AlertTriangle },
  { key: 'summary', label: 'AI summary', icon: Sparkles },
];

export default function ReportGenerator({ onGenerated, onClose }) {
  const [sections, setSections] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (k) => setSections((s) => ({ ...s, [k]: !s[k] }));

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await db.functions.invoke('generateDoctorReport', { includedSections: sections });
      onGenerated(res.data);
    } catch (e) {
      setError(e.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-lg font-semibold">New report</h2>
        <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Choose which sections to include. Stats cover the period since your last report (or since discharge).</p>

      <div className="space-y-2 mb-5">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => toggle(o.key)}
            className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors ${
              sections[o.key] ? 'border-primary/40 bg-primary/5 text-foreground' : 'border-border bg-background text-muted-foreground'
            }`}
          >
            <o.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{o.label}</span>
            <span className={`w-9 h-5 rounded-full relative transition-colors ${sections[o.key] ? 'bg-primary' : 'bg-muted'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${sections[o.key] ? 'left-4' : 'left-0.5'}`} />
            </span>
          </button>
        ))}
      </div>

      <Button onClick={generate} disabled={loading} className="w-full rounded-xl h-11">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : 'Generate report'}
      </Button>
      {error && <p className="text-sm text-destructive mt-3">{error}</p>}
    </div>
  );
}
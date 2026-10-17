const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FileText, Share2, History, Loader2, Link2, Check, ChevronRight } from 'lucide-react';
import ReportView from '@/components/doctor-report/ReportView';
import ReportGenerator from '@/components/doctor-report/ReportGenerator';
import DemoBlockedNotice from '@/components/DemoBlockedNotice';
import { isDemoMode } from '@/lib/demoClient';

export default function DoctorReport() {
  const navigate = useNavigate();
  const [reports, setReports] = useState(null);
  const [selected, setSelected] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const all = await db.entities.DoctorReport.list('-generated_date', 50);
    setReports(all);
    setSelected(all[0] || null);
  };
  useEffect(() => { load(); }, []);

  const share = async () => {
    if (!selected) return;
    let token = selected.share_token;
    if (!token) {
      token = (crypto.randomUUID?.() || String(Date.now())) + Math.random().toString(36).slice(2);
      await db.entities.DoctorReport.update(selected.id, { share_token: token, shared: true });
    }
    const link = `${window.location.origin}/shared/report/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
    setSelected((s) => ({ ...s, share_token: token, shared: true }));
    setReports((rs) => (rs || []).map((r) => (r.id === selected.id ? { ...r, share_token: token, shared: true } : r)));
  };

  const loading = reports === null;

  return (
    <div className="space-y-6">
      <header className="print:hidden">
        <h1 className="font-display text-2xl font-bold tracking-tight">Doctor report</h1>
        <p className="mt-1 text-sm text-muted-foreground">A summary of your recovery for your next visit.</p>
        {!generating && !isDemoMode() && reports?.length > 0 && (
          <button onClick={() => setGenerating(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 whitespace-nowrap">
            Generate report
          </button>
        )}
      </header>

      {generating && (
        <ReportGenerator
          onClose={() => setGenerating(false)}
          onGenerated={(rec) => { setGenerating(false); setReports((r) => [rec, ...(r || [])]); setSelected(rec); }}
        />
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : reports.length === 0 && !generating ? (
        isDemoMode() ? (
          <DemoBlockedNotice
            title="Can't generate reports in demo mode"
            message="Demo users can't generate new doctor reports until an account is created. You can still view the sample report below."
          />
        ) : (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary/10 text-primary grid place-items-center"><FileText className="w-7 h-7" /></div>
          <h2 className="font-display text-lg font-semibold">No reports yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">Generate your first report to review your recovery stats and share it with your doctor.</p>
          <button onClick={() => setGenerating(true)} className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Generate report</button>
        </div>
        )
      ) : selected ? (
        <>
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={share} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              {copied ? <><Check className="h-4 w-4" /> Link copied</> : <><Share2 className="h-4 w-4" /> Share with my doctor</>}
            </button>
            {copied && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Link2 className="h-3.5 w-3.5" /> Read-only link ready</span>}
          </div>

          <ReportView report={selected} />

          {reports.length > 1 && (
            <div className="print:hidden">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <History className="h-3.5 w-3.5" /> Past reports
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {reports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/reports/${r.id}`)}
                    className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <div className="text-sm font-medium">{r.generated_date}</div>
                      <div className="text-xs text-muted-foreground">{r.period_start} → {r.period_end}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
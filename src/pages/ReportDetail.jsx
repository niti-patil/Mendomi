import { getDemoClient } from "@/lib/demoClient";
const db = getDemoClient();

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Loader2, Share2, Printer, Check, Link2 } from 'lucide-react';
import ReportView from '@/components/doctor-report/ReportView';

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setReport(await db.entities.DoctorReport.get(id));
      } catch {
        setReport(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const share = async () => {
    if (!report) return;
    let token = report.share_token;
    if (!token) {
      token = (crypto.randomUUID?.() || String(Date.now())) + Math.random().toString(36).slice(2);
      await db.entities.DoctorReport.update(report.id, { share_token: token, shared: true });
      setReport((s) => ({ ...s, share_token: token, shared: true }));
    }
    const link = `${window.location.origin}/shared/report/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  };

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!report) return <div className="py-10 text-center text-muted-foreground">Report not found.</div>;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold tracking-tight">Recovery report</h1>
      <div className="flex items-center gap-2 print:hidden">
        <button onClick={share} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          {copied ? <><Check className="h-4 w-4" /> Link copied</> : <><Share2 className="h-4 w-4" /> Share with my doctor</>}
        </button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
          <Printer className="h-4 w-4" /> Print
        </button>
        {copied && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Link2 className="h-3.5 w-3.5" /> Read-only link ready</span>}
      </div>
      <div className="print:hidden"><ReportView report={report} /></div>
      <div className="hidden print:block"><ReportView report={report} /></div>
    </div>
  );
}
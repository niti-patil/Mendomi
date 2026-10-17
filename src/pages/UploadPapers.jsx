const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, Camera, Sparkles, CheckCircle2 } from 'lucide-react';

export default function UploadPapers() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle | uploading | extracting | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setStatus('uploading');
    setError('');
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      setStatus('extracting');
      const res = await db.functions.invoke('extractDischargeDocument', { file_url, file_name: file.name });
      setResult(res.data);
      setStatus('done');
    } catch (e) {
      setError(e.message || 'Something went wrong');
      setStatus('error');
    }
  };

  if (status === 'done' && result?.extracted) {
    const e = result.extracted;
    return (
      <div className="max-w-2xl mx-auto px-5 py-10">
        <div className="bg-card rounded-3xl border border-border p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-success/15 text-success grid place-items-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Recovery plan created</h1>
          <p className="text-muted-foreground mt-1 text-sm">We've built your daily plan from your discharge papers.</p>

          <div className="grid grid-cols-2 gap-3 mt-6 text-left">
            <SummaryCell label="Diagnosis" value={e.diagnosis} />
            <SummaryCell label="Surgery" value={e.surgery_type} />
            <SummaryCell label="Medications" value={`${(e.medications || []).length} added`} />
            <SummaryCell label="Restrictions" value={`${(e.restrictions || []).length} listed`} />
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setStatus('idle'); setResult(null); }}>
              Upload another
            </Button>
            <Button className="flex-1 rounded-xl" onClick={() => navigate('/plan')}>
              View recovery plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Upload discharge papers</h1>
        <p className="text-muted-foreground mt-1">Snap a photo or upload a PDF. Aria will extract your diagnosis, medications, restrictions, and follow-ups.</p>
      </header>

      {status === 'idle' && (
        <div className="grid gap-3">
          <label className="block bg-card rounded-3xl border-2 border-dashed border-border p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <div className="font-medium">Take a photo</div>
            <div className="text-sm text-muted-foreground">Use your camera to capture discharge papers</div>
          </label>
          <label className="block bg-card rounded-2xl border border-border p-5 text-center cursor-pointer hover:bg-muted/50 transition-all">
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4" /> Or choose a file from your device
            </div>
          </label>
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Your data stays private to your account.
          </p>
        </div>
      )}

      {(status === 'uploading' || status === 'extracting') && (
        <div className="bg-card rounded-3xl border border-border p-10 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <div className="font-medium">{status === 'uploading' ? 'Uploading your document…' : 'Aria is reading your discharge papers…'}</div>
          <div className="text-sm text-muted-foreground mt-1">This usually takes a few seconds.</div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-8 text-center">
          <div className="font-medium text-destructive">Something went wrong</div>
          <div className="text-sm text-muted-foreground mt-1">{error}</div>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setStatus('idle')}>Try again</Button>
        </div>
      )}
    </div>
  );
}

function SummaryCell({ label, value }) {
  return (
    <div className="bg-muted/50 rounded-2xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-sm mt-0.5">{value || '—'}</div>
    </div>
  );
}
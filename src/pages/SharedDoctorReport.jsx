const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Loader2, FileX } from 'lucide-react';
import ReportView from '@/components/doctor-report/ReportView';

export default function SharedDoctorReport() {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await db.functions.invoke('getSharedReport', { token });
        setReport(res.data);
      } catch (e) {
        setError(e.message || 'Unable to load report');
      }
    })();
  }, [token]);

  if (error) {
    return (
      <main className="min-h-screen grid place-items-center bg-background p-6">
        <div className="text-center">
          <FileX className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h1 className="font-display text-lg font-semibold">Report unavailable</h1>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-8 space-y-5">
        <div className="text-sm font-medium text-muted-foreground">Shared recovery report</div>
        <ReportView report={report} readOnly />
      </div>
    </main>
  );
}
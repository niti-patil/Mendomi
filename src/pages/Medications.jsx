import { getDemoClient } from "@/lib/demoClient";
const db = getDemoClient();

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Medications() {
  const qc = useQueryClient();
  const { data: meds = [], refetch } = useQuery({
    queryKey: ['medications'],
    queryFn: async () => await db.entities.Medication.list('-created_date', 100),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-primary">Medications</div>
          <h1 className="font-display text-3xl font-semibold mt-1">Your medications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{meds.length} active · tap one for details</p>
        </div>
      </header>

      {meds.length === 0 ? (
        <div className="text-center bg-card rounded-3xl border border-dashed border-border p-10">
          <p className="text-muted-foreground text-sm">No medications yet. They'll appear here after you upload discharge papers.</p>
          <Button asChild variant="outline" className="mt-4 rounded-xl"><Link to="/upload">Upload papers</Link></Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {meds.map((m) => (
            <Link key={m.id} to={`/medications/${m.id}`} className="block bg-card rounded-2xl border border-border p-6 hover:shadow-sm transition-all group">
              <h3 className="font-display text-xl font-semibold text-foreground">{m.name}</h3>
              {m.dosage && <p className="text-sm text-muted-foreground mt-0.5">{m.dosage}</p>}
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{m.frequency || (m.schedule_times || []).join(', ') || 'as needed'}</span>
                </div>
                {m.purpose && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="w-4 h-4 shrink-0" />
                    <span>{m.purpose}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
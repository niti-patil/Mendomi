const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Pill, Clock, CheckCircle2, Circle, Info as InfoIcon } from 'lucide-react';

export default function MedicationDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: med } = useQuery({
    queryKey: ['medication', id],
    queryFn: async () => await db.entities.Medication.get(id),
    enabled: !!id,
  });

  const { data: medTasks = [], refetch } = useQuery({
    queryKey: ['med-tasks', id],
    queryFn: async () => {
      const all = await db.entities.DailyTask.filter({ medication_id: id });
      return all.sort((a, b) => (a.task_date < b.task_date ? -1 : 1));
    },
    enabled: !!id,
  });

  if (!med) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  const toggle = async (t) => {
    const next = { completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null };
    const prev = qc.getQueryData(['med-tasks', id]);
    qc.setQueryData(['med-tasks', id], (old = []) => old.map((x) => (x.id === t.id ? { ...x, ...next } : x)));
    try {
      await db.entities.DailyTask.update(t.id, next);
    } catch (e) {
      qc.setQueryData(['med-tasks', id], prev);
    } finally {
      qc.invalidateQueries(['med-tasks', id]);
    }
  };

  const todayTasks = medTasks.filter((t) => t.task_date === today);
  const historyTasks = medTasks.filter((t) => t.task_date < today);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 rounded-3xl border border-primary/20 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center">
            <Pill className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">{med.name}</h1>
            <p className="text-muted-foreground">{med.dosage}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Meta icon={<Clock className="w-4 h-4" />} label="Schedule" value={med.frequency || (med.schedule_times || []).join(', ') || 'As needed'} />
          <Meta icon={<InfoIcon className="w-4 h-4" />} label="Purpose" value={med.purpose || '—'} />
        </div>
      </div>

      {med.instructions && (
        <div className="bg-card rounded-2xl border border-border p-4 flex gap-3">
          <InfoIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium">How to take</div>
            <p className="text-sm text-muted-foreground mt-0.5">{med.instructions}</p>
          </div>
        </div>
      )}

      <section>
        <h2 className="font-display text-lg font-semibold mb-3">Today's doses</h2>
        {todayTasks.length === 0 ? (
          <div className="bg-card rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No doses scheduled today.
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayTasks.map((t) => (
              <button key={t.id} onClick={() => toggle(t)} className="w-full flex items-center gap-3 bg-card rounded-2xl border border-border p-3.5 hover:shadow-sm transition-all text-left">
                {t.completed ? <CheckCircle2 className="w-6 h-6 text-success" /> : <Circle className="w-6 h-6 text-muted-foreground/40" />}
                <div className="flex-1">
                  <div className={`text-sm font-medium ${t.completed ? 'line-through text-muted-foreground' : ''}`}>{t.title}</div>
                  {t.scheduled_time && <div className="text-xs text-muted-foreground">{t.scheduled_time}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {historyTasks.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold mb-3">Recent history</h2>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border">
            {historyTasks.slice(-7).reverse().map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3.5">
                {t.completed ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Circle className="w-4 h-4 text-muted-foreground/30" />}
                <div className="flex-1 text-sm">{t.task_date}</div>
                <div className={`text-xs ${t.completed ? 'text-success' : 'text-muted-foreground'}`}>
                  {t.completed ? 'Taken' : 'Missed'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Meta({ icon, label, value }) {
  return (
    <div className="bg-card/60 rounded-xl p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1">{icon} {label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}
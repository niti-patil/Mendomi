import { getDemoClient } from "@/lib/demoClient";
const db = getDemoClient();

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import TaskItem from '@/components/TaskItem';
import { HeartPulse, MessageCircleHeart, ChevronRight, Sparkles, CalendarDays, Plus } from 'lucide-react';

function ProgressRing({ done, total }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <div className="relative w-36 h-36">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-3xl font-semibold">{Math.round(pct * 100)}%</div>
          <div className="text-xs text-muted-foreground">{done} of {total} done</div>
        </div>
      </div>
    </div>
  );
}

export default function Today() {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: async () => (await db.entities.PatientProfile.list())[0],
  });

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['today-tasks'],
    queryFn: async () => {
      const all = await db.entities.Task.filter({ date: today });
      return all.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    },
  });

  const { data: appts = [] } = useQuery({
    queryKey: ['appts'],
    queryFn: async () => (await db.entities.Appointment.list('date', 20)).filter((a) => a.date >= today && !a.completed),
  });

  const toggle = async (task) => {
    const next = { completed: !task.completed, completed_at: !task.completed ? new Date().toISOString() : null };
    const prev = qc.getQueryData(['today-tasks']);
    qc.setQueryData(['today-tasks'], (old = []) => old.map((t) => (t.id === task.id ? { ...t, ...next } : t)));
    try {
      await db.entities.Task.update(task.id, next);
    } catch (e) {
      qc.setQueryData(['today-tasks'], prev);
    } finally {
      qc.invalidateQueries(['today-tasks']);
    }
  };

  const completed = tasks.filter((t) => t.completed).length;
  const nextAppt = appts[0];
  const medTasks = tasks.filter((t) => t.type === 'medication');
  const nextMed = medTasks.find((t) => !t.completed);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="max-w-3xl mx-auto px-5 py-8 space-y-7">
      <header>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="font-display text-3xl font-semibold mt-1">{greeting}, {profile?.full_name?.split(' ')[0] || 'there'}.</h1>
        <p className="text-muted-foreground mt-1">Here's your recovery plan for today.</p>
      </header>

      {!profile?.surgery_type && (
        <Link to="/upload" className="block bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center"><Sparkles className="w-5 h-5" /></div>
            <div className="flex-1">
              <div className="font-medium">Upload your discharge papers</div>
              <div className="text-sm text-muted-foreground">Let AI build your recovery plan in seconds.</div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Link>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card rounded-3xl border border-border p-6 flex flex-col items-center justify-center gap-3">
          <ProgressRing done={completed} total={tasks.length} />
          <p className="text-sm text-muted-foreground">Today's progress</p>
        </div>

        <div className="space-y-3">
          <Link to="/checkin" className="block bg-card rounded-2xl border border-border p-4 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-chart-3/15 text-chart-3 grid place-items-center"><HeartPulse className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="font-medium text-sm">Daily symptom check-in</div>
                <div className="text-xs text-muted-foreground">2 minutes · Aria will respond</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
          <Link to="/ask" className="block bg-card rounded-2xl border border-border p-4 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-chart-5/15 text-chart-5 grid place-items-center"><MessageCircleHeart className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="font-medium text-sm">Ask Aria</div>
                <div className="text-xs text-muted-foreground">Answers from your discharge papers</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
          {nextAppt && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><CalendarDays className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{nextAppt.title}</div>
                  <div className="text-xs text-muted-foreground">{nextAppt.date} {nextAppt.time && `· ${nextAppt.time}`}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-semibold">Today's plan</h2>
          <Link to="/plan" className="text-sm text-primary hover:underline">Manage</Link>
        </div>
        {tasks.length === 0 ? (
          <div className="text-center bg-card rounded-3xl border border-dashed border-border p-10">
            <p className="text-muted-foreground text-sm">No tasks yet. Upload your discharge papers to generate a plan.</p>
            <Link to="/upload" className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary font-medium hover:underline">
              <Plus className="w-4 h-4" /> Upload now
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((t) => <TaskItem key={t.id} task={t} onToggle={toggle} />)}
          </div>
        )}
      </section>
    </div>
  );
}
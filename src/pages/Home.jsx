const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, HeartPulse, CalendarClock, FilePlus, ChevronRight, Footprints, TrendingUp, Pill } from "lucide-react";

import ProgressRing from "@/components/ProgressRing";
import TaskRow from "@/components/TaskRow";
import { EmptyState } from "@/components/PageHeader";
import { todayStr, formatDateLong, formatDateShort, prettifyTime, ensureTodaysTasks } from "@/lib/recovery";

export default function Home() {
  const qc = useQueryClient();
  const today = todayStr();
  const [now] = useState(new Date());

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['day-tasks', today],
    queryFn: async () => {
      await ensureTodaysTasks();
      const all = await db.entities.DailyTask.filter({ task_date: today });
      return all.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const appts = await db.entities.Appointment.list("date", 50);
      return appts.filter((a) => a.date >= today && a.status !== "cancelled").slice(0, 3);
    },
  });

  const { data: checkins = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: async () => db.entities.SymptomCheckin.list("-date", 14),
  });

  const { data: discharge = null } = useQuery({
    queryKey: ['discharge-doc'],
    queryFn: async () => (await db.entities.DischargeDocument.list("-created_date", 1))[0] || null,
  });

  const toggleTask = async (task) => {
    const completed = !task.completed;
    qc.setQueryData(['day-tasks', today], (old = []) =>
      old.map((t) => (t.id === task.id ? { ...t, completed, completed_at: completed ? new Date().toISOString() : "" } : t))
    );
    try {
      await db.entities.DailyTask.update(task.id, { completed, completed_at: completed ? new Date().toISOString() : "" });
    } catch {
      qc.invalidateQueries({ queryKey: ['day-tasks'] });
    }
  };

  const loading = tasksLoading && !discharge;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pct = tasks.length ? Math.round(completedCount / tasks.length * 100) : 0;
  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };
  const nextAppt = appointments[0];
  const todayCheckin = checkins.find((c) => c.date === today);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>;
  }

  return (
    <div>
      {/* Hero greeting */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary p-6 text-primary-foreground shadow-xl shadow-primary/20 sm:p-8">
        <p className="text-sm font-medium text-primary-foreground/80">{formatDateLong(todayStr())}</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{greeting()} 💙</h1>
        <p className="mt-1.5 max-w-md text-sm text-primary-foreground/85">
          {discharge ? (discharge.diagnosis ? `Recovering from ${discharge.diagnosis}.` : "Recovery in progress.") : "Let's get your recovery plan set up."}
        </p>
        {!discharge &&
        <Link to="/upload" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/25">
            <FilePlus className="h-4 w-4" /> Upload discharge papers
          </Link>
        }
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Progress ring */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border/70 bg-card p-6 text-center shadow-sm">
          <ProgressRing value={pct} sublabel="Today" />
          <p className="mt-3 text-sm font-medium text-foreground">{completedCount} of {tasks.length} recovery activities done</p>
        </div>

        {/* Quick actions */}
        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-display text-base font-semibold">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink to="/plan?tab=checkin" icon={HeartPulse} label="Symptom check-in" tone="rose" done={!!todayCheckin} />
            <QuickLink to="/plan?tab=meds" icon={Pill} label="Medications" tone="violet" />
            <QuickLink to="/plan?tab=plan" icon={Footprints} label="Today's plan" tone="emerald" />
            <QuickLink to="/plan?tab=progress" icon={TrendingUp} label="Progress" tone="sky" />
          </div>
        </div>

        {/* Next appointment */}
        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold"><CalendarClock className="h-4 w-4 text-primary" /> Next appointment</h2>
          {nextAppt ?
          <div className="rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-100">
              <p className="font-semibold text-foreground">{nextAppt.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{nextAppt.provider}</p>
              <p className="mt-2 text-sm font-medium text-violet-700">
                {formatDateShort(nextAppt.date)}{nextAppt.time ? ` · ${prettifyTime(nextAppt.time)}` : ""}
              </p>
              {nextAppt.location && <p className="text-xs text-muted-foreground">{nextAppt.location}</p>}
            </div> :

          <Link to="/visits?tab=appointments" className="flex items-center justify-between rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground hover:bg-muted">
              No upcoming appointments <ChevronRight className="h-4 w-4" />
            </Link>
          }
          <Link to="/reports?tab=report" className="mt-3 flex items-center justify-between rounded-2xl border border-border/70 p-3.5 text-sm font-medium text-foreground hover:border-primary/40">
            Prepare doctor report <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Today's tasks */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Today's plan</h2>
          <Link to="/plan?tab=plan" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {tasks.length ?
        <div className="grid gap-2.5 md:grid-cols-2">
            {tasks.slice(0, 6).map((t) => <TaskRow key={t.id} task={t} onToggle={toggleTask} linkTo={linkFor} />)}
          </div> :

        <EmptyState icon={FilePlus} title="No plan yet" description="Upload your discharge papers and Mendy will build a personalized daily recovery plan for you."
        action={<Link to="/upload" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><FilePlus className="h-4 w-4" /> Upload papers</Link>} />
        }
      </div>
    </div>);

}

function linkFor(task) {
  if (task.category === "medication") return `/medications${task.medication_id ? `/${task.medication_id}` : ""}`;
  if (task.category === "check_in") return "/checkin/history";
  return null;
}

const TONES = {
  rose: "bg-[#C2948A]/15 text-[#C2948A] ring-[#C2948A]/30",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  emerald: "bg-[#28536B]/15 text-[#28536B] ring-[#28536B]/25",
  sky: "bg-[#CAD49D]/25 text-[#5F6B33] ring-[#CAD49D]/45"
};
function QuickLink({ to, icon: Icon, label, tone, done }) {
  return (
    <Link to={to} className={`flex flex-col items-start gap-2 rounded-2xl p-4 ring-1 transition-transform hover:-translate-y-0.5 ${TONES[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </div>
      <span className="text-xs leading-tight [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-semibold">{label}</span>
    </Link>);

}
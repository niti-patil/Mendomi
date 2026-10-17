const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";
import { ListChecks, Plus, Trash2, ArrowUp, ArrowDown, X, Pencil } from "lucide-react";

import PageHeader, { EmptyState } from "@/components/PageHeader";
import TaskRow from "@/components/TaskRow";
import { todayStr, ensureTodaysTasks, CATEGORY_META } from "@/lib/recovery";

export default function TodayPlan() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    await ensureTodaysTasks();
    const all = await db.entities.DailyTask.list("-task_date", 500);
    const today = todayStr();
    setTasks(all.filter((t) => t.task_date === today).sort((a, b) => (a.order || 0) - (b.order || 0)));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (task) => {
    const completed = !task.completed;
    setTasks((p) => p.map((t) => (t.id === task.id ? { ...t, completed } : t)));
    await db.entities.DailyTask.update(task.id, { completed, completed_at: completed ? new Date().toISOString() : "" });
  };

  const move = async (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= tasks.length) return;
    const a = tasks[idx], b = tasks[j];
    const next = [...tasks];
    next[idx] = { ...a, order: b.order };
    next[j] = { ...b, order: a.order };
    next.sort((x, y) => (x.order || 0) - (y.order || 0));
    setTasks(next);
    await db.entities.DailyTask.bulkUpdate([
      { id: a.id, order: b.order },
      { id: b.id, order: a.order }
    ]);
  };

  const remove = async (task) => {
    setTasks((p) => p.filter((t) => t.id !== task.id));
    await db.entities.DailyTask.delete(task.id);
  };

  const linkFor = (task) => {
    if (task.category === "medication") return `/medications${task.medication_id ? `/${task.medication_id}` : ""}`;
    if (task.category === "check_in") return "/checkin/history";
    return null;
  };

  const completed = tasks.filter((t) => t.completed).length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div>
      <PageHeader title="Today's plan" subtitle="Check things off as you go. You can add, edit, or reorder anything." icon={ListChecks}
        action={<button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> Add task</button>} />

      {tasks.length > 0 && (
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>
      ) : tasks.length ? (
        <div className="space-y-2.5">
          {tasks.map((t, i) => (
            <div key={t.id} className="group relative">
              <TaskRow task={t} onToggle={toggle} linkTo={linkFor} />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => setEditing(t)} className="rounded-lg bg-background/90 p-1.5 text-muted-foreground shadow-sm hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => move(i, -1)} className="rounded-lg bg-background/90 p-1.5 text-muted-foreground shadow-sm hover:text-primary"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => move(i, 1)} className="rounded-lg bg-background/90 p-1.5 text-muted-foreground shadow-sm hover:text-primary"><ArrowDown className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(t)} className="rounded-lg bg-background/90 p-1.5 text-muted-foreground shadow-sm hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={ListChecks} title="No tasks for today" description="Add your own tasks or upload your discharge papers to let Nova build a plan."
          action={<button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Add your first task</button>} />
      )}

      {(adding || editing) && (
        <TaskSheet
          task={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={() => { setAdding(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function TaskSheet({ task, onClose, onSaved }) {
  const [title, setTitle] = useState(task?.title || "");
  const [category, setCategory] = useState(task?.category || "self_care");
  const [scheduledTime, setScheduledTime] = useState(task?.scheduled_time || "");
  const [recurring, setRecurring] = useState(task ? !!task.recurring : true);

  const save = async () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      category,
      scheduled_time: scheduledTime,
      recurring,
      task_date: todayStr()
    };
    if (task?.id) {
      await db.entities.DailyTask.update(task.id, payload);
    } else {
      await db.entities.DailyTask.create({ ...payload, completed: false, order: Date.now() });
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{task ? "Edit task" : "New task"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">What to do</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Walk 20 minutes" className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_META).filter(([k]) => k !== "appointment").map(([key, meta]) => (
                <button key={key} onClick={() => setCategory(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${category === key ? `${meta.bg} ${meta.color} ring-current` : "bg-background text-muted-foreground ring-border"}`}>
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time (optional)</label>
              <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Repeat daily</label>
              <button onClick={() => setRecurring(!recurring)} className={`flex h-[42px] w-full items-center justify-center rounded-xl border text-sm font-medium ${recurring ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground"}`}>
                {recurring ? "Yes, every day" : "Just today"}
              </button>
            </div>
          </div>
          <button onClick={save} disabled={!title.trim()} className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {task ? "Save changes" : "Add to plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
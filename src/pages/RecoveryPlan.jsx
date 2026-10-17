const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import TaskItem from '@/components/TaskItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, ListChecks, X } from 'lucide-react';
import { ensureTodaysTasks } from "@/lib/recovery";

export default function RecoveryPlan() {
  const qc = useQueryClient();
  const [dayOffset, setDayOffset] = useState(0);
  const dateObj = new Date();
  dateObj.setDate(dateObj.getDate() + dayOffset);
  const dateStr = dateObj.toISOString().slice(0, 10);

  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', type: 'custom', scheduled_time: '' });

  const { data: tasks = [] } = useQuery({
    queryKey: ['day-tasks', dateStr],
    queryFn: async () => {
      if (dayOffset === 0) await ensureTodaysTasks();
      const all = await db.entities.DailyTask.filter({ task_date: dateStr });
      return all.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
  });

  const toggle = async (task) => {
    const next = !task.completed;
    const now = next ? new Date().toISOString() : null;
    qc.setQueryData(['day-tasks', dateStr], (old = []) =>
      old.map((t) => (t.id === task.id ? { ...t, completed: next, completed_at: now } : t))
    );
    try {
      await db.entities.DailyTask.update(task.id, { completed: next, completed_at: now });
    } catch {
      qc.setQueryData(['day-tasks', dateStr], (old = []) =>
        old.map((t) => (t.id === task.id ? { ...t, completed: task.completed, completed_at: task.completed_at } : t))
      );
    }
  };

  const move = async (task, dir) => {
    const idx = tasks.indexOf(task);
    const swap = tasks[idx + dir];
    if (!swap) return;
    await db.entities.DailyTask.bulkUpdate([
      { id: task.id, order: swap.order },
      { id: swap.id, order: task.order },
    ]);
    qc.invalidateQueries({ queryKey: ['day-tasks'] });
  };

  const remove = async (task) => {
    await db.entities.DailyTask.delete(task.id);
    qc.invalidateQueries({ queryKey: ['day-tasks'] });
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    const maxOrder = tasks.reduce((m, t) => Math.max(m, t.order ?? 0), -1);
    await db.entities.DailyTask.create({
      title: newTask.title,
      category: newTask.type,
      task_date: dateStr,
      scheduled_time: newTask.scheduled_time || null,
      order: maxOrder + 1,
      recurring: false,
      completed: false,
    });
    setNewTask({ title: '', type: 'custom', scheduled_time: '' });
    setAdding(false);
    qc.invalidateQueries({ queryKey: ['day-tasks'] });
  };

  const completed = tasks.filter((t) => t.completed).length;
  const isToday = dayOffset === 0;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary"><ListChecks className="w-5 h-5" /><span className="text-sm font-medium">Recovery Plan</span></div>
        <h1 className="font-display text-3xl font-semibold">{dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h1>
        <div className="flex gap-1.5 shrink-0">
          <Button variant="outline" size="sm" className="rounded-xl" disabled={dayOffset === -3} onClick={() => setDayOffset((d) => d - 1)}>Prev</Button>
          {!isToday && <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setDayOffset(0)}>Today</Button>}
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setDayOffset((d) => d + 1)}>Next</Button>
        </div>
        <p className="text-muted-foreground text-sm">{completed}/{tasks.length} recovery activities complete</p>
      </header>

      {tasks.length === 0 ? (
        <div className="text-center bg-card rounded-3xl border border-dashed border-border p-10">
          <p className="text-muted-foreground text-sm">No recovery activities for this day. Add one below, or upload discharge papers to auto-generate a plan.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((t) => (
            <TaskItem key={t.id} task={t} onToggle={toggle} onMove={move} onDelete={remove} showControls />
          ))}
        </div>
      )}

      {adding ? (
        <form onSubmit={addTask} className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">New recovery activity</span>
            <button type="button" onClick={() => setAdding(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
          <Input placeholder="Task title" value={newTask.title} onChange={(e) => setNewTask((n) => ({ ...n, title: e.target.value }))} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={newTask.type} onValueChange={(v) => setNewTask((n) => ({ ...n, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="care">Care</SelectItem>
                  <SelectItem value="checkin">Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" value={newTask.scheduled_time} onChange={(e) => setNewTask((n) => ({ ...n, scheduled_time: e.target.value }))} />
            </div>
          </div>
          <Button type="submit" className="w-full rounded-xl">Add recovery activity</Button>
        </form>
      ) : (
        <Button variant="outline" className="w-full rounded-xl border-dashed" onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4" /> Add a recovery activity
        </Button>
      )}
      <p className="text-xs text-muted-foreground text-center">Hover a recovery activity to reorder or remove it.</p>
    </div>
  );
}
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Pill, Activity, HeartHandshake, Stethoscope, CalendarDays, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeMeta = {
  medication: { icon: Pill, color: 'text-primary', bg: 'bg-primary/10' },
  activity: { icon: Activity, color: 'text-accent', bg: 'bg-accent/10' },
  care: { icon: HeartHandshake, color: 'text-chart-4', bg: 'bg-chart-4/10' },
  checkin: { icon: Stethoscope, color: 'text-chart-3', bg: 'bg-chart-3/10' },
  appointment: { icon: CalendarDays, color: 'text-chart-5', bg: 'bg-chart-5/10' },
  custom: { icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export default function TaskItem({ task, onToggle, onMove, onDelete, showControls = false }) {
  const meta = typeMeta[task.type] || typeMeta.custom;
  const Icon = meta.icon;
  return (
    <div className={cn(
      'group flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-all hover:shadow-sm',
      task.completed && 'opacity-60'
    )}>
      <button
        onClick={() => onToggle(task)}
        className="shrink-0 transition-transform active:scale-90"
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed
          ? <CheckCircle2 className="w-6 h-6 text-success" />
          : <Circle className="w-6 h-6 text-muted-foreground/40 hover:text-primary" />}
      </button>

      <div className={cn('shrink-0 w-9 h-9 rounded-xl grid place-items-center', meta.bg)}>
        <Icon className={cn('w-4 h-4', meta.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className={cn('truncate text-sm font-medium', task.completed && 'line-through text-muted-foreground')}>
          {task.type === 'medication' ? (
            <Link to={`/medications/${task.medication_id}`} className="hover:underline">{task.title}</Link>
          ) : task.type === 'checkin' ? (
            <Link to="/checkin" className="hover:underline">{task.title}</Link>
          ) : task.title}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          {task.scheduled_time && <span>{task.scheduled_time}</span>}
          {task.notes && <span className="truncate">· {task.notes}</span>}
        </div>
      </div>

      {showControls && (
        <button onClick={() => onDelete(task)} className="shrink-0 self-end rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100" aria-label="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
import React from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, Circle, Pill, Footprints, Droplets, HeartPulse, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_META, prettifyTime } from "@/lib/recovery";

const ICONS = { Pill, Footprints, Droplets, HeartPulse, CalendarClock };

export default function TaskRow({ task, onToggle, linkTo }) {
  const meta = CATEGORY_META[task.category] || CATEGORY_META.self_care;
  const Icon = ICONS[meta.icon] || Circle;

  const Inner = (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm",
        task.completed && "opacity-60"
      )}
    >
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle?.(task); }}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          task.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background hover:border-primary/60"
        )}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        {task.completed && <Check className="h-4 w-4" strokeWidth={3} />}
      </button>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1", meta.bg, meta.ring, meta.color)}>
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold leading-snug break-words text-foreground", task.completed && "line-through text-muted-foreground")}>{task.title}</p>
        <div className="mt-0.5 flex items-center gap-1">
          <span className={cn("text-[11px] font-semibold uppercase tracking-wide", meta.color)}>{meta.label}</span>
          {task.scheduled_time && <span className="text-[11px] text-muted-foreground"> · {prettifyTime(task.scheduled_time)}</span>}
        </div>
      </div>
      {linkTo && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-primary" />}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo(task)} className="block">
        {Inner}
      </Link>
    );
  }
  return Inner;
}
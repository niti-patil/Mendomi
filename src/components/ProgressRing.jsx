import React from "react";

export default function ProgressRing({ value, size = 120, stroke = 10, label, sublabel }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value || 0));
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--primary))" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-foreground">{Math.round(pct)}{label ?? "%"}</span>
        {sublabel && <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  );
}
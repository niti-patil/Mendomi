const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { HeartPulse, Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react";

import PageHeader, { EmptyState } from "@/components/PageHeader";
import { formatDateShort } from "@/lib/recovery";

export default function CheckInHistory() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const all = await db.entities.SymptomCheckin.list("date", 200);
      setCheckins(all.sort((a, b) => a.date.localeCompare(b.date)));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>;

  const data = checkins.map((c) => ({
    date: formatDateShort(c.date),
    pain: c.pain_level,
    energy: c.energy_level,
    sleep: c.sleep_hours,
    activity: c.activity_minutes
  }));

  const recent = [...checkins].reverse().slice(0, 7).reverse();
  const painVals = checkins.map((c) => c.pain_level).filter((x) => x != null);
  const trend = (() => {
    if (painVals.length < 2) return "stable";
    const mid = Math.floor(painVals.length / 2);
    const first = painVals.slice(0, mid).reduce((s, x) => s + x, 0) / mid;
    const second = painVals.slice(mid).reduce((s, x) => s + x, 0) / (painVals.length - mid);
    if (second < first - 0.7) return "improving";
    if (second > first + 0.7) return "worsening";
    return "stable";
  })();

  return (
    <div>
      <PageHeader title="Symptom report" subtitle="Your wellness history and Mendy's notes." icon={HeartPulse} />

      {checkins.length === 0 ? (
        <EmptyState icon={HeartPulse} title="No check-ins yet" description="Complete a daily check-in and your trends will appear here." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {painVals.length >= 2 && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 ring-1 ring-border/70">
              <span className="text-sm font-medium text-muted-foreground">Pain trend:</span>
              <span className={`inline-flex items-center gap-1 text-sm font-semibold ${trend === "improving" ? "text-emerald-600" : trend === "worsening" ? "text-rose-600" : "text-muted-foreground"}`}>
                {trend === "improving" ? <><TrendingDown className="h-4 w-4" /> Improving</> : trend === "worsening" ? <><TrendingUp className="h-4 w-4" /> Worsening</> : <><Minus className="h-4 w-4" /> Stable</>}
              </span>
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-border/70 bg-card p-5 lg:col-span-2">
            <h3 className="mb-4 font-display text-base font-semibold">Pain & energy over time</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[1, 10]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Line type="monotone" dataKey="pain" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} name="Pain" />
                  <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Energy" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-3 font-display text-base font-semibold">Recent check-ins</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {recent.map((c) => (
                <div key={c.id} className="rounded-2xl border border-border/70 bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{formatDateShort(c.date)}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-rose-600">Pain {c.pain_level}/10</span>
                      <span className="text-emerald-600">Energy {c.energy_level}/10</span>
                      <span className="text-violet-600">Sleep {c.sleep_hours}h</span>
                    </div>
                  </div>
                  {c.ai_response && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-violet-50 p-3 ring-1 ring-violet-100">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                      <p className="text-sm text-foreground/80">{c.ai_response}</p>
                    </div>
                  )}
                  {c.notes && <p className="mt-2 text-sm text-muted-foreground">“{c.notes}”</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
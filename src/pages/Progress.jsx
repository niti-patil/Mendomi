const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useQuery } from '@tanstack/react-query';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingDown, Moon, Activity, CheckCircle2, LineChart as LineIcon } from 'lucide-react';

export default function Progress() {
  const { data: checkins = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: async () => (await db.entities.SymptomCheckin.list('-date', 30)).sort((a, b) => (a.date < b.date ? -1 : 1)),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => await db.entities.Task.list('-date', 200),
  });

  const dateCounts = {};
  checkins.forEach((c) => { dateCounts[c.date] = (dateCounts[c.date] || 0) + 1; });
  const fmtTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  const chartData = checkins.map((c) => {
    const day = c.date.slice(5);
    const time = fmtTime(c.created_date);
    const label = dateCounts[c.date] > 1 && time ? `${day} ${time}` : day;
    return {
      date: label,
      pain: c.pain_level,
      sleep: c.sleep_hours,
      activity: c.activity_minutes,
      energy: c.energy_level,
    };
  });

  const completed = tasks.filter((t) => t.completed).length;
  const adherence = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const medAdherence = checkins.length ? Math.round((checkins.filter((c) => c.took_medications).length / checkins.length) * 100) : 0;

  const avg = (key) => checkins.length ? (checkins.reduce((s, c) => s + (c[key] || 0), 0) / checkins.length).toFixed(1) : '—';

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-primary"><LineIcon className="w-5 h-5" /><span className="text-sm font-medium">Progress</span></div>
        <h1 className="font-display text-3xl font-semibold mt-1">Your recovery trends</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Based on {checkins.length} check-ins and {tasks.length} tasks.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Task adherence" value={`${adherence}%`} icon={<CheckCircle2 className="w-4 h-4" />} tone="primary" />
        <Stat label="Med adherence" value={`${medAdherence}%`} icon={<CheckCircle2 className="w-4 h-4" />} tone="success" />
        <Stat label="Avg pain" value={`${avg('pain_level')}`} icon={<TrendingDown className="w-4 h-4" />} tone="chart3" />
        <Stat label="Avg sleep" value={`${avg('sleep_hours')}h`} icon={<Moon className="w-4 h-4" />} tone="chart4" />
      </div>

      {chartData.length === 0 ? (
        <div className="bg-card rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Complete a few daily check-ins to see your trends here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Chart title="Pain level" data={chartData} color="hsl(var(--chart-3))" dataKey="pain" domain={[1, 10]} type="line" />
          <Chart title="Sleep (hours)" data={chartData} color="hsl(var(--chart-4))" dataKey="sleep" type="bar" />
          <Chart title="Activity (minutes)" data={chartData} color="hsl(var(--accent))" dataKey="activity" type="bar" />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, tone }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    chart3: 'bg-chart-3/15 text-chart-3',
    chart4: 'bg-chart-4/15 text-chart-4',
  };
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <span className={`w-6 h-6 rounded-lg grid place-items-center ${tones[tone]}`}>{icon}</span>
        {label}
      </div>
      <div className="font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Chart({ title, data, color, dataKey, type, domain }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="text-sm font-medium mb-3">{title}</div>
      <ResponsiveContainer width="100%" height={180}>
        {type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={domain || [0, 'auto']} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={28} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={28} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
            <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
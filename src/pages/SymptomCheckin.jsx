const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { HeartPulse, Loader2, Sparkles, AlertTriangle, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const moods = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'low', emoji: '😕', label: 'Low' },
  { value: 'rough', emoji: '😣', label: 'Rough' },
];

export default function SymptomCheckin() {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    pain_level: 3, energy_level: 3, sleep_hours: 7, temperature: '', activity_minutes: 30,
    mood: 'good', took_medications: true, notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const { data: history = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: async () => (await db.entities.SymptomCheckin.list('-date', 14)).sort((a, b) => (a.date < b.date ? -1 : 1)),
  });

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await db.functions.invoke('wellnessCoach', { ...form, date: today });
      setResult(res.data);
      qc.invalidateQueries(['checkins']);
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = history.map((c) => ({ date: c.date.slice(5), pain: c.pain_level }));

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
      <header>
        <div className="flex items-center gap-2 text-chart-3"><HeartPulse className="w-5 h-5" /><span className="text-sm font-medium">Daily check-in</span></div>
        <h1 className="font-display text-3xl font-semibold mt-1">How are you feeling?</h1>
        <p className="text-muted-foreground text-sm mt-0.5">A quick survey — your coach Aria will respond.</p>
      </header>

      {chartData.length > 1 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Pain trend (last {chartData.length} days)</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={28} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Line type="monotone" dataKey="pain" stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {result ? (
        <div className={`bg-card rounded-3xl border p-6 space-y-4 ${result.urgent_flag ? 'border-destructive/40' : 'border-chart-3/40'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-2xl grid place-items-center shrink-0 ${result.urgent_flag ? 'bg-destructive/15 text-destructive' : 'bg-chart-3/15 text-chart-3'}`}>
              {result.urgent_flag ? <AlertTriangle className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </div>
            <div>
              <div className="font-display text-lg font-semibold">{result.urgent_flag ? 'Please check in with your care team' : 'From Aria'}</div>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{result.ai_response}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-xl" onClick={() => setResult(null)}>
            Submit another check-in
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-3xl border border-border p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between"><Label>Pain level</Label><span className="text-sm font-medium text-primary">{form.pain_level}/10</span></div>
            <Slider value={[form.pain_level]} min={0} max={10} step={1} onValueChange={(v) => setForm((f) => ({ ...f, pain_level: v[0] }))} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between"><Label>Energy level</Label><span className="text-sm font-medium text-primary">{form.energy_level}/5</span></div>
            <Slider value={[form.energy_level]} min={1} max={5} step={1} onValueChange={(v) => setForm((f) => ({ ...f, energy_level: v[0] }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sleep (hours)</Label>
              <Input type="number" min={0} max={24} value={form.sleep_hours} onChange={(e) => setForm((f) => ({ ...f, sleep_hours: +e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Temperature (°C)</Label>
              <Input type="number" step={0.1} value={form.temperature} onChange={(e) => setForm((f) => ({ ...f, temperature: +e.target.value }))} placeholder="optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Activity (minutes)</Label>
              <Input type="number" min={0} value={form.activity_minutes} onChange={(e) => setForm((f) => ({ ...f, activity_minutes: +e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Medications today</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={form.took_medications ? 'default' : 'outline'} className="rounded-xl flex-1" onClick={() => setForm((f) => ({ ...f, took_medications: true }))}>Yes</Button>
                <Button type="button" size="sm" variant={!form.took_medications ? 'default' : 'outline'} className="rounded-xl flex-1" onClick={() => setForm((f) => ({ ...f, took_medications: false }))}>No</Button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Mood</Label>
            <div className="grid grid-cols-5 gap-2">
              {moods.map((m) => (
                <button key={m.value} type="button" onClick={() => setForm((f) => ({ ...f, mood: m.value }))}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${form.mood === m.value ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Anything else? (optional)</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="How was your day?" />
          </div>

          <Button onClick={submit} disabled={submitting} className="w-full h-12 rounded-xl text-base">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send to Aria'}
          </Button>
        </div>
      )}
    </div>
  );
}
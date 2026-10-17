const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeartPulse, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', date_of_birth: '', phone: '',
    surgery_type: '', surgery_date: '',
    emergency_contact_name: '', emergency_contact_phone: ''
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.surgery_type) return;
    setLoading(true);
    try {
      const existing = await db.entities.PatientProfile.list();
      if (existing.length) {
        await db.entities.PatientProfile.update(existing[0].id, { ...form, onboarding_complete: true });
      } else {
        await db.entities.PatientProfile.create({ ...form, onboarding_complete: true });
      }
      qc.invalidateQueries(['me-profile']);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-5">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="font-display text-2xl font-semibold">Welcome to Recovery Companion</h1>
            <p className="text-sm text-muted-foreground">Everything you need to heal, in one place.</p>
          </div>
        </div>

        <form onSubmit={submit} className="bg-card rounded-3xl border border-border p-6 space-y-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="full_name">Full name *</Label>
              <Input id="full_name" value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={set('phone')} placeholder="for reminders" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="stype">Type of surgery / procedure *</Label>
              <Input id="stype" value={form.surgery_type} onChange={set('surgery_type')} required placeholder="e.g. Knee arthroscopy" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sdate">Surgery date</Label>
              <Input id="sdate" type="date" value={form.surgery_date} onChange={set('surgery_date')} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="emname">Emergency contact name</Label>
              <Input id="emname" value={form.emergency_contact_name} onChange={set('emergency_contact_name')} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="emphone">Emergency contact phone</Label>
              <Input id="emphone" value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl text-base">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start my recovery'}
          </Button>
        </form>
      </div>
    </div>
  );
}
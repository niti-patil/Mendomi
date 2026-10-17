const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";

import SettingsShell, { Spinner } from "@/components/settings/SettingsShell";
import { EmptyState } from "@/components/PageHeader";

export default function SavedQuestions() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const qs = await db.entities.QueuedQuestion.list("-created_date", 200);
      setItems(qs || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (q) => {
    setItems((prev) => (prev || []).filter((x) => x.id !== q.id));
    await db.entities.QueuedQuestion.delete(q.id);
  };

  return (
    <SettingsShell title="Saved questions" subtitle="Prompts and messages you saved from Ask Mendy for your next visit." icon={Bookmark}>
      {loading ? (
        <Spinner />
      ) : !items || items.length === 0 ? (
        <EmptyState icon={Bookmark} title="No saved questions yet" description="When you save a question from Ask Mendy, it will appear here for your next visit." />
      ) : (
        <div className="space-y-3">
          {items.map((q) => (
            <div key={q.id} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{q.question}</p>
                <div className="mt-1.5">
                  <span className="text-[11px] text-muted-foreground">{new Date(q.created_date).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => remove(q)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </SettingsShell>
  );
}
const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Loader2, BookmarkPlus, BookmarkCheck, FilePlus, Lock } from "lucide-react";

import MendyAvatar from "@/components/MendyAvatar";
import UrgentBanner from "@/components/UrgentBanner";
import { isDemoMode } from "@/lib/demoClient";

export default function AskMendy() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [queued, setQueued] = useState([]);
  const [savedIdx, setSavedIdx] = useState(new Set());
  const [discharge, setDischarge] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [recent, docs] = await Promise.all([
        db.entities.Conversation.filter({ context_type: "assistant" }, "-created_date", 30),
        db.entities.DischargeDocument.list("-created_date", 1),
      ]);
      setDischarge(docs[0] || null);
      const ordered = (recent || []).slice().reverse();
      setMessages(ordered.map((m) => ({ role: m.role === "assistant" ? "mendy" : "user", content: m.content, urgent: m.urgent_flag })));
      try {
        const qs = await db.entities.QueuedQuestion.list("-created_date", 50);
        setQueued(qs || []);
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const queueQuestion = async (text, idx) => {
    try {
      await db.entities.QueuedQuestion.create({ question: text, added_from_chat: true });
      setQueued((q) => [{ question: text, added_from_chat: true }, ...q]);
      setSavedIdx((s) => new Set(s).add(idx));
    } catch {}
  };

  const ask = async (text) => {
    if (isDemoMode()) return;
    const q = (text ?? input).trim();
    if (!q || sending) return;
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await db.functions.invoke("askAssistant", { question: q });
      const data = res.data;
      if (data?.error) throw new Error(data.error);
      setMessages([...next, { role: "mendy", content: data.answer, urgent: data.urgent_flag, urgentReason: data.urgent_reason }]);
    } catch (e) {
      setMessages([...next, { role: "mendy", content: "I had trouble answering that. Please try again in a moment.", error: true }]);
    } finally {
      setSending(false);
    }
  };

  const noPapers = loaded && !discharge;

  return (
    <div>
      {noPapers && (
        <div className="mb-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <FilePlus className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">For accurate advice about your specific recovery, <Link to="/upload" className="font-semibold underline">upload your discharge papers</Link>. I can still help with general recovery questions in the meantime.</p>
        </div>
      )}
      <div className="flex flex-col rounded-3xl border border-border/70 bg-card md:min-h-[calc(100vh-12rem)]" style={{ minHeight: "58vh" }}>
        <div className="px-5 pt-4 pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <MendyAvatar size={26} />
            <h2 className="font-display text-lg font-bold">Ask Mendy</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Answers grounded in your discharge instructions — with a clear urgent-care banner when it matters. Mendy is supportive guidance, not a substitute for your medical team.</p>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              {m.role === "mendy" ? (
                <div className="flex max-w-[88%] gap-3">
                  <MendyAvatar size={36} />
                  <div className="min-w-0">
                    {m.urgent && (
                      <div className="mb-2">
                        <UrgentBanner message={m.urgentReason || "Contact your doctor or seek emergency care right away."} />
                      </div>
                    )}
                    <div className={`whitespace-pre-wrap rounded-2xl rounded-tl-sm px-4 py-3 text-sm ${m.error ? "bg-rose-50 text-rose-700" : "bg-muted text-foreground"}`}>{m.content}</div>
                  </div>
                </div>
              ) : (
                <div className="max-w-[82%]">
                  <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">{m.content}</div>
                  <button
                    onClick={() => queueQuestion(m.content, i)}
                    disabled={savedIdx.has(i)}
                    className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary disabled:opacity-60"
                  >
                    {savedIdx.has(i) ? <><BookmarkCheck className="h-3 w-3" /> Saved for doctor</> : <><BookmarkPlus className="h-3 w-3" /> Save for next visit</>}
                  </button>
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex gap-3">
              <MendyAvatar size={36} />
              <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Mendy is thinking…</div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="border-t border-border/70 p-3">
          {isDemoMode() ? (
            <div className="flex items-center justify-center gap-2 rounded-full bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Mendy can't answer new questions in demo mode —</span>
              <Link to="/auth" className="font-semibold underline">create an account</Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask Mendy about your recovery…" className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              <button onClick={() => ask()} disabled={sending || !input.trim()} className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
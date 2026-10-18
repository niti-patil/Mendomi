import { getDemoClient } from "@/lib/demoClient";
const db = getDemoClient();

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Send, AlertTriangle, Loader2, Heart } from "lucide-react";

import PageHeader from "@/components/PageHeader";

const SUGGESTIONS = [
  "How much water should I drink today?",
  "When can I start walking again?",
  "Is my pain level normal for this stage?",
  "What signs mean I should call my doctor?"
];

export default function AskNova() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [dischargeText, setDischargeText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      const docs = await db.entities.DischargeDocument.list("-created_date", 1);
      if (docs[0]) setDischargeText(docs[0].raw_text || docs[0].summary || "");
      setMessages([{ role: "nova", content: "Hi, I'm Aria 💙 your recovery companion. Ask me anything about your discharge instructions, medications, or how you're healing. I'm here to help you feel confident at home." }]);
    })();
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const ask = async (text) => {
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
      setMessages([...next, { role: "nova", content: data.answer, urgent: data.urgent_flag, urgentReason: data.urgent_reason, suggestions: data.suggestions || [] }]);
    } catch (e) {
      setMessages([...next, { role: "nova", content: "I had trouble answering that. Please try again in a moment.", error: true }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Ask Aria" subtitle="AI answers grounded in your discharge instructions — with an urgent-care flag when it matters." icon={Sparkles} />

      <div className="flex flex-col rounded-3xl border border-border/70 bg-card" style={{ minHeight: "60vh" }}>
        <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              {m.role === "nova" ? (
                <div className="flex max-w-[88%] gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-white"><Sparkles className="h-4 w-4" /></div>
                  <div>
                    {m.urgent && (
                      <div className="mb-2 flex items-start gap-2 rounded-2xl bg-rose-50 p-3 ring-1 ring-rose-200">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                        <div>
                          <p className="text-sm font-bold text-rose-700">This sounds urgent</p>
                          {m.urgentReason && <p className="mt-0.5 text-sm text-rose-600">{m.urgentReason}</p>}
                        </div>
                      </div>
                    )}
                    <div className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm ${m.error ? "bg-rose-50 text-rose-700" : "bg-muted text-foreground"}`}>{m.content}</div>
                    {m.suggestions?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.suggestions.map((s, j) => <span key={j} className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-medium text-violet-700">💡 {s}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">{m.content}</div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-white"><Sparkles className="h-4 w-4" /></div>
              <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-muted-foreground inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Nova is thinking…</div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 hover:border-primary hover:text-primary">{s}</button>
            ))}
          </div>
        )}

        <div className="border-t border-border/70 p-3">
          <div className="flex items-center gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask Nova about your recovery…" className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <button onClick={() => ask()} disabled={sending || !input.trim()} className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground"><Heart className="h-3 w-3" /> Nova is supportive guidance, not a substitute for your medical team.</p>
        </div>
      </div>
    </div>
  );
}
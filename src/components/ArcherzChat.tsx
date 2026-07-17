import { useChat } from "@ai-sdk/react";
import { Bot, X } from "lucide-react";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "archerz-chat-v1";

const SUGGESTIONS = [
  "What is ARCHERZ?",
  "Engane join cheyyam?",
  "Ethokke events und?",
  "GPTC Attingal CS association?",
];

function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

function textOf(message: UIMessage): string {
  if (!message.parts) return "";
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}

export function ArcherzChat() {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [initial, setInitial] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setInitial(loadMessages());
    setHydrated(true);
    let alive = true;
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "chatbot_enabled")
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        if (data && (data.value === false || data.value === "false")) setEnabled(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const { messages, sendMessage, status, setMessages, error } = useChat({
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  // Persist on every change
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // storage full or unavailable — non-fatal
    }
  }, [messages, hydrated]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Focus textarea when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, status]);

  const busy = status === "submitted" || status === "streaming";

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    await sendMessage({ text: trimmed });
  }

  function reset() {
    setMessages([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  if (!enabled) return null;

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      {/* Floating bubble */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close ARCHERZ AI" : "Ask ARCHERZ AI"}
        className="fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-signal text-background shadow-[6px_6px_0_0_hsl(var(--foreground))] transition-all duration-300 hover:-translate-y-0.5 md:bottom-8 md:right-8"
      >
        {open ? <X className="h-6 w-6" strokeWidth={2.5} /> : <Bot className="h-7 w-7" strokeWidth={2} />}
      </button>

      {/* Backdrop (desktop side sheet + mobile full page) */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-[68] bg-foreground/30 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel: full page on mobile, right side-sheet on desktop */}
      <aside
        role="dialog"
        aria-label="ARCHERZ AI assistant"
        aria-hidden={!open}
        className={`fixed inset-0 z-[69] flex flex-col bg-background transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:inset-y-0 md:right-0 md:left-auto md:w-[460px] md:border-l md:border-hairline md:shadow-[-20px_0_60px_-30px_hsl(var(--foreground)/0.4)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-hairline bg-surface px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-signal text-background">
                <Bot className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-signal">
                  ARCHERZ // BOT
                </div>
                <div className="mt-0.5 font-display text-sm">Beyond the classroom</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reset}
                className="tap-target font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground hover:text-signal"
                aria-label="Clear conversation"
              >
                ↻ RESET
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="tap-target flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-hairline/40 hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-5">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-md space-y-6 pt-6 md:pt-10">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-signal/10 text-signal">
                    <Bot className="h-7 w-7" strokeWidth={1.8} />
                  </div>
                  <h2 className="font-display text-2xl leading-tight text-foreground">Ask ARCHERZ AI</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    The student-built assistant for the CS &amp; Technology association at GPTC Attingal.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void submit(s)}
                      className="tap-target rounded-xl border border-hairline px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.16em] text-foreground transition-colors hover:border-signal hover:text-signal"
                    >
                      → {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user";
                const body = textOf(m);
                return (
                  <div key={m.id} className={isUser ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={
                        isUser
                          ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-foreground px-3.5 py-2.5 text-sm leading-relaxed text-background"
                          : "max-w-[92%] text-sm leading-relaxed text-foreground"
                      }
                    >
                      {isUser ? (
                        <span className="whitespace-pre-wrap">{body}</span>
                      ) : (
                        <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:font-display prose-headings:mt-3 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-foreground prose-a:text-signal">
                          <ReactMarkdown>{body || "…"}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {status === "submitted" && (
              <div className="flex justify-start">
                <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
                  thinking<span className="animate-pulse">…</span>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded border border-signal/40 bg-signal/5 p-3 font-mono text-[11px] uppercase tracking-[0.16em] text-signal">
                {error.message?.includes("Rate limit") ? error.message : error.message?.includes("disabled") ? "Chatbot is off right now — admins have paused it." : "Chat failed. Try again in a moment."}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit(input);
            }}
            className="border-t border-hairline bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-4"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit(input);
                  }
                }}
                rows={1}
                placeholder="Ask about ARCHERZ…"
                aria-label="Message ARCHERZ AI"
                className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border border-hairline bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none focus:border-signal"
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="tap-target flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-signal text-background transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                aria-label="Send message"
              >
                →
              </button>
            </div>
            <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
              Answers may be imperfect. Verify important details on the site.
            </div>
          </form>
      </aside>
    </>
  );
}


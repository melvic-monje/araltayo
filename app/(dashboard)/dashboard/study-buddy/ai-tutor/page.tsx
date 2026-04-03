"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import MarkdownContent from "@/components/MarkdownContent";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TUTOR_NAMES = [
  "Sir Gorio", "Sir Boyet", "Sir Nanding", "Sir Totoy", "Sir Lito",
  "Sir Dodong", "Sir Ferdie", "Sir Nonoy", "Sir Entong", "Sir Ruben",
  "Ma'am Fely", "Ma'am Nene", "Ma'am Loring", "Ma'am Coring", "Ma'am Babes",
  "Ma'am Inday", "Ma'am Chit", "Ma'am Tessie", "Ma'am Nida", "Ma'am Lumen",
];

function getRandomTutorName() {
  return TUTOR_NAMES[Math.floor(Math.random() * TUTOR_NAMES.length)];
}

const SUGGESTED_SUBJECTS = [
  "Math", "Science", "Filipino", "English", "History",
  "Physics", "Chemistry", "Biology", "Economics", "Statistics",
];

export default function AITutorPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("");
  const [tutorName, setTutorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTutorName(getRandomTutorName());
    fetch("/api/auth/usage")
      .then((r) => r.json())
      .then((d) => setRemaining(d.remaining ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setError("");
    setLoading(true);

    const res = await fetch("/api/ai/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, subject }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    if (data.remaining !== undefined) setRemaining(data.remaining);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isLimitReached = remaining !== null && remaining <= 0;

  return (
    <div className="max-w-2xl flex flex-col" style={{ height: "calc(100vh - 120px)" }}>

      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <button
          onClick={() => router.push("/dashboard/study-buddy")}
          className="flex items-center gap-1.5 text-sm mb-4 transition-colors"
          style={{ color: "#6b5a8a" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C8B8E8")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b5a8a")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Study Buddy
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-heading)" }}>
              AI Tutor
            </h1>
            <p className="text-sm" style={{ color: "#8b78b0" }}>
              Ask anything. Get clear explanations with Filipino context.
            </p>
          </div>
          {remaining !== null && (
            <span className="text-xs font-semibold flex-shrink-0 mt-1"
              style={{ color: remaining <= 2 ? "#FDCF6D" : "#00CBFF" }}>
              {remaining}/10 left today
            </span>
          )}
        </div>

        {/* Subject selector */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSubject("")}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={!subject ? {
                background: "linear-gradient(90deg, rgba(103,33,255,0.4), rgba(0,203,255,0.2))",
                color: "#fff",
                border: "1px solid rgba(103,33,255,0.5)",
              } : {
                color: "#6b5a8a",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              General
            </button>
            {SUGGESTED_SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={subject === s ? {
                  background: "linear-gradient(90deg, rgba(103,33,255,0.4), rgba(0,203,255,0.2))",
                  color: "#fff",
                  border: "1px solid rgba(103,33,255,0.5)",
                } : {
                  color: "#6b5a8a",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "rgba(22,0,66,0.7)", border: "1px solid rgba(103,33,255,0.15)", minHeight: 0 }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(103,33,255,0.15)", border: "1px solid rgba(103,33,255,0.25)" }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: "#a78bfa" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.613-1.388 2.613H4.186c-1.418 0-2.389-1.613-1.388-2.613L4.2 15.3" />
                </svg>
              </div>
              <p className="font-semibold text-white mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                Kumusta! I&apos;m {tutorName}.
              </p>
              <p className="text-sm" style={{ color: "#8b78b0" }}>
                Ask me anything about your studies. I&apos;m here to help!
              </p>
              <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
                {["Explain photosynthesis simply.", "How do I solve quadratic equations?", "What caused World War II?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-sm text-left px-4 py-2.5 rounded-xl transition-all"
                    style={{ background: "rgba(103,33,255,0.08)", color: "#C8B8E8", border: "1px solid rgba(103,33,255,0.15)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(103,33,255,0.4)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(103,33,255,0.15)")}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mr-2 mt-0.5"
                  style={{ background: "rgba(103,33,255,0.2)" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ color: "#a78bfa" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.613-1.388 2.613H4.186c-1.418 0-2.389-1.613-1.388-2.613L4.2 15.3" />
                  </svg>
                </div>
              )}
              <div className="max-w-[80%]">
                {msg.role === "user" ? (
                  <div
                    className="rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap"
                    style={{
                      background: "linear-gradient(135deg, rgba(103,33,255,0.4), rgba(0,203,255,0.2))",
                      color: "#fff",
                      borderBottomRightRadius: "6px",
                    }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "#C8B8E8",
                      borderBottomLeftRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <MarkdownContent content={msg.content} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mr-2"
                style={{ background: "rgba(103,33,255,0.2)" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: "#a78bfa" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.613-1.388 2.613H4.186c-1.418 0-2.389-1.613-1.388-2.613L4.2 15.3" />
                </svg>
              </div>
              <div className="rounded-2xl px-4 py-3 flex gap-1 items-center"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderBottomLeftRadius: "6px" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#a78bfa", animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#a78bfa", animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#a78bfa", animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {error && (
            <div className="text-center">
              <span className="text-sm px-4 py-2 rounded-xl inline-block"
                style={{ background: "rgba(220,38,38,0.1)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.2)" }}>
                {error}
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 flex gap-2 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(103,33,255,0.12)" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || isLimitReached}
            placeholder={isLimitReached ? "Daily limit reached. Come back tomorrow!" : "Ask a question… (Enter to send, Shift+Enter for new line)"}
            rows={1}
            className="dark-input flex-1 resize-none"
            style={{ minHeight: "42px", maxHeight: "120px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || isLimitReached}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #6721FF, #00CBFF)" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

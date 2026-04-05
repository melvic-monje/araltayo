"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import DrawingBoard, { type DrawCommand, type DrawingBoardHandle } from "@/components/DrawingBoard";

interface Room {
  id: string;
  topic: string;
  host_id: string;
  host_name: string;
  partner_id: string | null;
  partner_name: string | null;
  status: string;
  is_private: boolean;
  room_code: string | null;
  shared_notes: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  ts: number;
}

const POMODORO = 25 * 60;

function fmtTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

// Safe calculator evaluator — only allows digits, operators, math functions, parens
function calcEval(expr: string): string {
  const sanitized = expr
    .replace(/\^/g, "**")
    .replace(/√\(/g, "Math.sqrt(")
    .replace(/sin\(/g, "Math.sin(")
    .replace(/cos\(/g, "Math.cos(")
    .replace(/tan\(/g, "Math.tan(")
    .replace(/log\(/g, "Math.log10(")
    .replace(/ln\(/g, "Math.log(")
    .replace(/π/g, "Math.PI")
    .replace(/e(?![0-9])/g, "Math.E");
  // allow only safe characters
  if (!/^[0-9+\-*/().,%\sMathsqriclognePI*]+$/.test(sanitized)) return "Error";
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (!isFinite(result)) return "Error";
    const n = parseFloat(result.toPrecision(10));
    return String(n);
  } catch {
    return "Error";
  }
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [myId, setMyId] = useState("");
  const [myName, setMyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rightTab, setRightTab] = useState<"notes" | "board" | "calc">("notes");

  // Shared notes
  const [notes, setNotes] = useState("");
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typing indicator
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  // Pomodoro timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(POMODORO);
  const [displayTime, setDisplayTime] = useState(POMODORO);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const timerAutoStarted = useRef(false);

  // Copy invite
  const [copied, setCopied] = useState(false);

  // Calculator
  const [calcExpr, setCalcExpr] = useState("0");
  const [calcHistory, setCalcHistory] = useState("");
  const [calcSci, setCalcSci] = useState(false);
  const [calcJustEvaled, setCalcJustEvaled] = useState(false);

  const msgChannelRef = useRef<RealtimeChannel | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<DrawingBoardHandle>(null);

  // Timer interval
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
      const left = Math.max(0, timerRemaining - elapsed);
      setDisplayTime(left);
      if (left === 0) {
        setTimerRunning(false);
        setShowContinuePrompt(true);
      }
    }, 500);
    return () => clearInterval(id);
  }, [timerRunning, timerStartedAt, timerRemaining]);

  // Auto-start timer when room becomes active (host triggers, partner syncs via broadcast)
  const myIdRef = useRef(myId);
  myIdRef.current = myId;
  useEffect(() => {
    if (room?.status !== "active" || timerAutoStarted.current || !myIdRef.current) return;
    if (room.host_id !== myIdRef.current) return;
    timerAutoStarted.current = true;
    setTimeout(() => {
      const now = Date.now();
      setTimerStartedAt(now);
      setTimerRunning(true);
      msgChannelRef.current?.send({
        type: "broadcast", event: "timer",
        payload: { action: "start", startedAt: now, remaining: POMODORO },
      });
    }, 800);
  }, [room?.status, room?.host_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    const suffix = crypto.randomUUID();
    let roomChannel: RealtimeChannel;
    let aborted = false;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (aborted || !user) { if (!user) router.push("/login"); return; }
      setMyId(user.id);

      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
      const name = profile?.display_name ?? "Unknown";
      setMyName(name);

      const res = await fetch(`/api/study-rooms/${roomId}`);
      if (aborted) return;
      if (!res.ok) { setError("Room not found."); setLoading(false); return; }
      const { room: roomData }: { room: Room } = await res.json();

      setNotes(roomData.shared_notes ?? "");

      if (roomData.host_id !== user.id && roomData.partner_id !== user.id) {
        if (roomData.status !== "waiting" || roomData.partner_id !== null) {
          setError("This room is no longer available.");
          setLoading(false); return;
        }
        const joinRes = await fetch(`/api/study-rooms/${roomId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join", partnerName: name }),
        });
        if (aborted) return;
        if (!joinRes.ok) {
          const d = await joinRes.json();
          setError(d.error ?? "Failed to join room.");
          setLoading(false); return;
        }
        const { room: joined } = await joinRes.json();
        setRoom(joined);
      } else {
        setRoom(roomData);
      }

      setLoading(false);

      roomChannel = supabase
        .channel(`room-watch:${roomId}:${suffix}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "study_rooms", filter: `id=eq.${roomId}` },
          (payload) => { setRoom(payload.new as Room); })
        .subscribe();

      msgChannelRef.current = supabase
        .channel(`room-chat:${roomId}`)
        .on("broadcast", { event: "message" }, ({ payload }) => {
          setMessages((prev) => [...prev, payload as Message]);
        })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload.senderId === user.id) return;
          setPartnerTyping(true);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setPartnerTyping(false), 2000);
        })
        .on("broadcast", { event: "timer" }, ({ payload }) => {
          if (payload.action === "start") {
            setTimerStartedAt(payload.startedAt);
            setTimerRemaining(payload.remaining);
            setTimerRunning(true);
            setShowContinuePrompt(false);
          } else if (payload.action === "reset") {
            setTimerRunning(false);
            setTimerStartedAt(0);
            setTimerRemaining(POMODORO);
            setDisplayTime(POMODORO);
            setShowContinuePrompt(false);
          }
        })
        .on("broadcast", { event: "notes" }, ({ payload }) => {
          if (payload.senderId !== user.id) setNotes(payload.content);
        })
        .on("broadcast", { event: "draw" }, ({ payload }) => {
          if (payload.senderId !== user.id) boardRef.current?.executeCommand(payload as DrawCommand);
        })
        .subscribe();
    }

    init();

    const handleUnload = () => { navigator.sendBeacon(`/api/study-rooms/${roomId}`); };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      aborted = true;
      if (roomChannel) supabase.removeChannel(roomChannel);
      if (msgChannelRef.current) supabase.removeChannel(msgChannelRef.current);
      window.removeEventListener("beforeunload", handleUnload);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Screen warning shown to sender only
  const [screenWarning, setScreenWarning] = useState("");
  const [screenBanned, setScreenBanned] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text || !myId || !msgChannelRef.current || screenBanned) return;
    setScreenWarning("");

    // Screen message before sending
    try {
      const res = await fetch(`/api/study-rooms/${roomId}/screen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!data.ok) {
        setScreenWarning(data.reason);
        if (data.banned) setScreenBanned(true);
        return; // message never reaches other students
      }
    } catch {
      // fail open — allow message if screener is down
    }

    const msg: Message = { id: crypto.randomUUID(), sender_id: myId, sender_name: myName, content: text, ts: Date.now() };
    setMessages((prev) => [...prev, msg]);
    setInput("");
    await msgChannelRef.current.send({ type: "broadcast", event: "message", payload: msg });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const now = Date.now();
    if (now - lastTypingSent.current > 1000 && msgChannelRef.current) {
      lastTypingSent.current = now;
      msgChannelRef.current.send({ type: "broadcast", event: "typing", payload: { senderId: myId } });
    }
  }

  function handleNotesChange(content: string) {
    setNotes(content);
    if (msgChannelRef.current) {
      msgChannelRef.current.send({ type: "broadcast", event: "notes", payload: { content, senderId: myId } });
    }
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(() => {
      fetch(`/api/study-rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "notes", content }),
      });
    }, 2000);
  }

  function resetTimer() {
    setTimerRunning(false); setTimerStartedAt(0); setTimerRemaining(POMODORO); setDisplayTime(POMODORO);
    setShowContinuePrompt(false);
    msgChannelRef.current?.send({ type: "broadcast", event: "timer", payload: { action: "reset" } });
  }

  function handleDrawCommand(cmd: DrawCommand) {
    if (!msgChannelRef.current) return;
    msgChannelRef.current.send({ type: "broadcast", event: "draw", payload: { ...cmd, senderId: myId } });
  }

  function continueSession() {
    setShowContinuePrompt(false);
    const now = Date.now();
    setTimerStartedAt(now); setTimerRemaining(POMODORO); setTimerRunning(true);
    msgChannelRef.current?.send({ type: "broadcast", event: "timer", payload: { action: "start", startedAt: now, remaining: POMODORO } });
  }

  function copyInvite() {
    const text = room?.is_private ? (room.room_code ?? "") : window.location.href;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function leaveRoom() {
    await fetch(`/api/study-rooms/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    router.push("/dashboard/study-buddy/partner");
  }

  // Calculator helpers
  function calcPress(val: string) {
    if (val === "C") {
      setCalcExpr("0"); setCalcHistory(""); setCalcJustEvaled(false); return;
    }
    if (val === "⌫") {
      setCalcExpr((p) => p.length > 1 ? p.slice(0, -1) : "0");
      setCalcJustEvaled(false); return;
    }
    if (val === "=") {
      const result = calcEval(calcExpr);
      setCalcHistory(calcExpr + " =");
      setCalcExpr(result);
      setCalcJustEvaled(true); return;
    }
    const isOp = ["+", "-", "*", "/", "^", "%"].includes(val);
    if (calcJustEvaled && !isOp) {
      setCalcExpr(val === "." ? "0." : val); setCalcJustEvaled(false); return;
    }
    if (calcJustEvaled && isOp) {
      setCalcJustEvaled(false);
    }
    if (val === "." && calcExpr.split(/[+\-*/^%]/).pop()?.includes(".")) return;
    setCalcExpr((p) => {
      if (p === "0" && !isOp && val !== ".") return val;
      return p + val;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>Connecting…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-sm mb-4" style={{ color: "var(--accent-red)" }}>{error}</p>
        <button onClick={() => router.push("/dashboard/study-buddy/partner")} className="btn-glow"
          style={{ background: "linear-gradient(90deg,#6721FF,#00CBFF)" }}>
          Back to lobby
        </button>
      </div>
    );
  }

  if (!room) return null;

  const isHost = room.host_id === myId;
  const partnerName = isHost ? room.partner_name : room.host_name;
  const isWaiting = room.status === "waiting";
  const isEnded = room.status === "ended";
  const timerDone = displayTime === 0 && !timerRunning;

  const sciButtons = [
    ["sin(", "cos(", "tan(", "ln(", "log("],
    ["√(", "x²", "xⁿ", "π", "e"],
    ["(", ")", "%", "^", "⌫"],
  ];
  const basicRows = [
    ["C", "(", ")", "/"],
    ["7", "8", "9", "*"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];

  return (
    <div className="flex flex-col w-full" style={{ height: "calc(100vh - 120px)", maxWidth: "1400px" }}>

      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {room.is_private && (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: "var(--accent-purple)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              <h1 className="text-xl font-bold truncate" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                {room.topic}
              </h1>
            </div>
            <p className="text-xs" style={{ color: isWaiting ? "var(--accent-yellow)" : isEnded ? "var(--text-faint)" : "var(--accent-green)" }}>
              {isWaiting ? "Waiting for a partner…" : isEnded ? "Session ended" : `Studying with ${partnerName}`}
            </p>
          </div>

          {/* Timer + actions */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: timerRunning ? "var(--accent-green)" : "var(--text-faint)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-mono font-bold tabular-nums"
                style={{ color: timerDone ? "var(--accent-yellow)" : timerRunning ? "var(--accent-green)" : "var(--text-primary)" }}>
                {fmtTime(displayTime)}
              </span>
              <button onClick={resetTimer} title="Restart timer"
                className="w-5 h-5 flex items-center justify-center rounded-lg transition-all"
                style={{ color: "var(--text-faint)" }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <button onClick={copyInvite} title={room.is_private ? "Copy room code" : "Copy room link"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: copied ? "var(--accent-green)" : "var(--text-muted)" }}>
              {copied ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {copied ? "Copied!" : room.is_private ? room.room_code : "Invite"}
            </button>

            <button onClick={leaveRoom}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "var(--accent-red-bg)", color: "var(--accent-red)", border: "1px solid rgba(220,38,38,0.15)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent-red-border)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent-red-bg)")}>
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex-1 flex gap-3 min-h-0">

        {/* ── Left: Chat ── */}
        <div className="flex flex-col rounded-2xl overflow-hidden relative"
          style={{ flex: "0 0 340px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>Chat</p>

            {/* Safety reminder */}
            <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
              style={{ background: "var(--accent-green-bg)", border: "1px solid var(--accent-green-border)" }}>
              <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: "var(--accent-green)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: "var(--accent-green)" }}>
                Stay safe! Bawal mag-share ng phone number, social media, email, o personal info. I-keep ang conversation sa platform lang.
              </p>
            </div>

            {isWaiting && (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-3"
                  style={{ background: "var(--accent-yellow-bg)", color: "var(--accent-yellow)", border: "1px solid rgba(253,207,109,0.2)" }}>
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />
                  Waiting for a partner…
                </div>
                {room.is_private && room.room_code && (
                  <div className="inline-block mt-2 px-4 py-3 rounded-2xl"
                    style={{ background: "var(--accent-purple-bg)", border: "1px solid rgba(103,33,255,0.25)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>
                      Room Code
                    </p>
                    <p className="text-2xl font-extrabold font-mono tracking-widest gradient-text"
                      style={{ fontFamily: "var(--font-heading)" }}>
                      {room.room_code}
                    </p>
                  </div>
                )}
                {!room.is_private && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                    Share the invite link or wait for someone from the lobby.
                  </p>
                )}
              </div>
            )}

            {isEnded && messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Session ended.</p>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.sender_id === myId;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%]">
                    {!isMe && (
                      <p className="text-xs font-semibold mb-1 px-1" style={{ color: "var(--text-muted)" }}>
                        {msg.sender_name}
                      </p>
                    )}
                    <div className="rounded-2xl px-3 py-2 text-sm"
                      style={isMe ? {
                        background: "linear-gradient(135deg,rgba(103,33,255,0.4),rgba(0,203,255,0.2))",
                        color: "var(--text-primary)", borderBottomRightRadius: "6px",
                      } : {
                        background: "var(--bg-white-subtle)", color: "var(--text-body)",
                        borderBottomLeftRadius: "6px", border: "1px solid var(--bg-white-subtle)",
                      }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {isEnded && messages.length > 0 && (
              <div className="text-center py-2">
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{ background: "rgba(220,38,38,0.1)", color: "var(--accent-red)" }}>
                  Session ended
                </span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {!isEnded && (
            <div className="flex-shrink-0" style={{ borderTop: "1px solid var(--border-divider)" }}>
              {screenWarning && (
                <div className="mx-3 mt-2 px-3 py-2 rounded-xl text-xs leading-relaxed"
                  style={{ background: "var(--accent-red-bg)", color: "var(--accent-red)", border: "1px solid var(--accent-red-border)" }}>
                  {screenWarning}
                </div>
              )}
              {partnerTyping && !isWaiting && (
                <p className="px-4 pt-2 text-xs" style={{ color: "var(--text-faint)" }}>
                  {partnerName} is typing…
                </p>
              )}
              <div className="p-3 flex gap-2">
                <textarea value={input} onChange={handleInputChange}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  disabled={isWaiting || screenBanned}
                  placeholder={screenBanned ? "Na-ban ka pansamantala…" : isWaiting ? "Waiting for partner…" : "Type a message…"}
                  rows={1} className="dark-input flex-1 resize-none text-sm"
                  style={{ minHeight: "38px", maxHeight: "100px" }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
                  }} />
                <button onClick={sendMessage} disabled={isWaiting || screenBanned || !input.trim()}
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#6721FF,#00CBFF)" }}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {isEnded && (
            <div className="p-3 text-center flex-shrink-0" style={{ borderTop: "1px solid rgba(103,33,255,0.12)" }}>
              <button onClick={() => router.push("/dashboard/study-buddy/partner")} className="btn-glow text-sm"
                style={{ background: "linear-gradient(90deg,#6721FF,#00CBFF)", padding: "8px 20px" }}>
                Back to lobby
              </button>
            </div>
          )}

          {/* Continue prompt overlay (chat side) */}
          {showContinuePrompt && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-10"
              style={{ background: "var(--bg-overlay)", backdropFilter: "blur(8px)" }}>
              <div className="text-center px-6 py-6 rounded-2xl mx-4"
                style={{ background: "var(--bg-card-solid)", border: "1px solid rgba(103,33,255,0.3)", maxWidth: "300px" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "var(--accent-yellow-bg)" }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--accent-yellow)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                  25-minute session done!
                </h3>
                <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                  Great work! Continue for another 25 minutes?
                </p>
                <div className="flex gap-2">
                  <button onClick={leaveRoom}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: "var(--bg-white-subtle)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                    End
                  </button>
                  <button onClick={continueSession}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold btn-glow"
                    style={{ background: "linear-gradient(90deg,#6721FF,#00CBFF)" }}>
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Notes / Board / Calculator ── */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden min-w-0"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>

          {/* Right tab bar */}
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5"
            style={{ borderBottom: "1px solid rgba(103,33,255,0.12)" }}>
            {(["notes", "board", "calc"] as const).map((t) => (
              <button key={t} onClick={() => setRightTab(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                style={rightTab === t ? {
                  background: "linear-gradient(90deg,rgba(103,33,255,0.35),rgba(0,203,255,0.15))",
                  color: "var(--text-primary)", border: "1px solid rgba(103,33,255,0.4)",
                } : { color: "var(--text-muted)", border: "1px solid transparent" }}>
                {t === "calc" ? "Calculator" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Notes */}
          {rightTab === "notes" && (
            <div className="flex-1 flex flex-col p-4" style={{ minHeight: 0 }}>
              <p className="text-xs mb-2" style={{ color: "var(--text-faint)" }}>
                Both of you can edit in real-time
              </p>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                disabled={isEnded}
                placeholder="Start typing your notes here… both of you can edit at the same time."
                className="flex-1 w-full rounded-xl p-4 text-sm resize-none outline-none transition-all"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid rgba(103,33,255,0.15)",
                  color: "var(--text-body)",
                  fontFamily: "var(--font-sans)",
                  lineHeight: "1.7",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
              />
            </div>
          )}

          {/* Board */}
          {rightTab === "board" && (
            <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
              <DrawingBoard ref={boardRef} onCommand={handleDrawCommand} disabled={isEnded} />
            </div>
          )}

          {/* Calculator */}
          {rightTab === "calc" && (
            <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start">
              <div className="w-full" style={{ maxWidth: "340px" }}>
                {/* Mode toggle */}
                <div className="flex gap-1 mb-3 p-1 rounded-xl w-fit"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                  {(["Basic", "Scientific"] as const).map((m) => (
                    <button key={m} onClick={() => setCalcSci(m === "Scientific")}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={(m === "Scientific") === calcSci ? {
                        background: "linear-gradient(90deg,rgba(103,33,255,0.35),rgba(0,203,255,0.15))",
                        color: "var(--text-primary)", border: "1px solid rgba(103,33,255,0.4)",
                      } : { color: "var(--text-muted)", border: "1px solid transparent" }}>
                      {m}
                    </button>
                  ))}
                </div>

                {/* Display */}
                <div className="rounded-2xl p-4 mb-3 text-right"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-xs h-4 mb-1 truncate" style={{ color: "var(--text-faint)" }}>{calcHistory}</p>
                  <p className="text-3xl font-bold font-mono truncate"
                    style={{ color: calcExpr === "Error" ? "var(--accent-red)" : "var(--text-primary)" }}>
                    {calcExpr}
                  </p>
                </div>

                {/* Scientific row */}
                {calcSci && (
                  <div className="mb-2 space-y-1.5">
                    {sciButtons.map((row, ri) => (
                      <div key={ri} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}>
                        {row.map((btn) => (
                          <button key={btn}
                            onClick={() => {
                              if (btn === "x²") { calcPress("^"); calcPress("2"); }
                              else if (btn === "x³") { calcPress("^"); calcPress("3"); }
                              else if (btn === "xⁿ") { calcPress("^"); }
                              else calcPress(btn);
                            }}
                            className="py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{ background: "var(--border-divider)", color: "var(--accent-purple)", border: "1px solid rgba(103,33,255,0.2)" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent-purple-border)")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--border-divider)")}>
                            {btn}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Basic rows */}
                <div className="space-y-1.5">
                  {basicRows.map((row, ri) => (
                    <div key={ri} className="grid gap-1.5"
                      style={{ gridTemplateColumns: row.length === 3 ? "1fr 1fr 2fr" : "repeat(4, 1fr)" }}>
                      {row.map((btn) => {
                        const isEq = btn === "=";
                        const isOp = ["/", "*", "-", "+"].includes(btn);
                        const isClear = btn === "C";
                        return (
                          <button key={btn} onClick={() => calcPress(btn)}
                            className="py-3.5 rounded-xl text-sm font-semibold transition-all"
                            style={isEq ? {
                              background: "linear-gradient(135deg,#6721FF,#00CBFF)", color: "#fff",
                            } : isClear ? {
                              background: "rgba(220,38,38,0.12)", color: "var(--accent-red)", border: "1px solid rgba(220,38,38,0.2)",
                            } : isOp ? {
                              background: "rgba(0,203,255,0.1)", color: "var(--accent-cyan)", border: "1px solid rgba(0,203,255,0.2)",
                            } : {
                              background: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)",
                            }}
                            onMouseEnter={(e) => {
                              if (!isEq) (e.currentTarget as HTMLElement).style.opacity = "0.8";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.opacity = "1";
                            }}>
                            {btn}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Room {
  id: string;
  topic: string;
  host_id: string;
  host_name: string;
  partner_id: string | null;
  partner_name: string | null;
  status: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  ts: number;
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

  const msgChannelRef = useRef<RealtimeChannel | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;
    const channelSuffix = crypto.randomUUID();
    let roomChannel: RealtimeChannel;
    let aborted = false;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (aborted || !user) { if (!user) router.push("/login"); return; }
      setMyId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      const name = profile?.display_name ?? "Unknown";
      setMyName(name);

      // Fetch room
      const res = await fetch(`/api/study-rooms/${roomId}`);
      if (aborted) return;
      if (!res.ok) { setError("Room not found."); setLoading(false); return; }
      const { room: roomData }: { room: Room } = await res.json();

      // If neither host nor partner, try to join
      if (roomData.host_id !== user.id && roomData.partner_id !== user.id) {
        if (roomData.status !== "waiting" || roomData.partner_id !== null) {
          setError("This room is no longer available to join.");
          setLoading(false);
          return;
        }
        const joinRes = await fetch(`/api/study-rooms/${roomId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join", partnerName: name }),
        });
        if (aborted) return;
        if (!joinRes.ok) { setError("Failed to join room."); setLoading(false); return; }
        const { room: joined } = await joinRes.json();
        setRoom(joined);
      } else {
        setRoom(roomData);
      }

      setLoading(false);

      // Watch room status via postgres_changes
      roomChannel = supabase
        .channel(`room-watch:${roomId}:${channelSuffix}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "study_rooms", filter: `id=eq.${roomId}` },
          (payload) => { setRoom(payload.new as Room); }
        )
        .subscribe();

      // Broadcast channel for messages
      msgChannelRef.current = supabase
        .channel(`room-chat:${roomId}`)
        .on("broadcast", { event: "message" }, ({ payload }) => {
          setMessages((prev) => [...prev, payload as Message]);
        })
        .subscribe();
    }

    init();

    // End room if user closes the tab
    // sendBeacon uses POST — the POST handler on this route ends the room
    const handleUnload = () => {
      navigator.sendBeacon(`/api/study-rooms/${roomId}`);
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      aborted = true;
      if (roomChannel) supabase.removeChannel(roomChannel);
      if (msgChannelRef.current) supabase.removeChannel(msgChannelRef.current);
      window.removeEventListener("beforeunload", handleUnload);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || !myId || !msgChannelRef.current) return;

    const msg: Message = {
      id: crypto.randomUUID(),
      sender_id: myId,
      sender_name: myName,
      content: text,
      ts: Date.now(),
    };

    // Add own message locally immediately
    setMessages((prev) => [...prev, msg]);
    setInput("");

    await msgChannelRef.current.send({
      type: "broadcast",
      event: "message",
      payload: msg,
    });
  }

  async function leaveRoom() {
    await fetch(`/api/study-rooms/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    router.push("/dashboard/study-buddy/partner");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>Connecting…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-sm mb-4" style={{ color: '#fca5a5' }}>{error}</p>
        <button onClick={() => router.push("/dashboard/study-buddy/partner")}
          className="btn-glow" style={{ background: 'linear-gradient(90deg, #6721FF, #00CBFF)' }}>
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

  return (
    <div className="max-w-2xl flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-faint)' }}>
            Studying
          </p>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {room.topic}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: isWaiting ? '#FDCF6D' : '#00C39A' }}>
            {isWaiting
              ? "Waiting for a partner to join…"
              : isEnded
              ? "Session ended"
              : `Studying with ${partnerName}`}
          </p>
        </div>
        <button onClick={leaveRoom}
          className="px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0"
          style={{ background: 'rgba(220,38,38,0.1)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.2)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220,38,38,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(220,38,38,0.1)')}>
          Leave
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', minHeight: 0 }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isWaiting && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                style={{ background: 'rgba(253,207,109,0.1)', color: '#FDCF6D', border: '1px solid rgba(253,207,109,0.2)' }}>
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />
                Waiting for a partner…
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-faint)' }}>
                Share this link with a classmate or wait for someone to join from the lobby.
              </p>
            </div>
          )}

          {isEnded && messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Session ended.</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.sender_id === myId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[75%]">
                  {!isMe && (
                    <p className="text-xs font-semibold mb-1 px-1" style={{ color: 'var(--text-muted)' }}>
                      {msg.sender_name}
                    </p>
                  )}
                  <div className="rounded-2xl px-4 py-2.5 text-sm"
                    style={isMe ? {
                      background: 'linear-gradient(135deg, rgba(103,33,255,0.4), rgba(0,203,255,0.2))',
                      color: 'var(--text-primary)',
                      borderBottomRightRadius: '6px',
                    } : {
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-body)',
                      borderBottomLeftRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.06)',
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
                style={{ background: 'rgba(220,38,38,0.1)', color: '#fca5a5' }}>
                Session ended
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!isEnded && (
          <div className="p-4 flex gap-2 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(103,33,255,0.12)' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={isWaiting ? "Waiting for partner to connect…" : "Type a message…"}
              disabled={isWaiting}
              className="dark-input flex-1"
            />
            <button
              onClick={sendMessage}
              disabled={isWaiting || !input.trim()}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #6721FF, #00CBFF)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        )}

        {isEnded && (
          <div className="p-4 text-center flex-shrink-0"
            style={{ borderTop: '1px solid rgba(103,33,255,0.12)' }}>
            <button onClick={() => router.push("/dashboard/study-buddy/partner")}
              className="btn-glow text-sm"
              style={{ background: 'linear-gradient(90deg, #6721FF, #00CBFF)', padding: '10px 24px' }}>
              Back to lobby
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

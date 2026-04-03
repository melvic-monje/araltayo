"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

interface Room {
  id: string;
  topic: string;
  host_name: string;
  status: string;
  created_at: string;
}

export default function PartnerLobbyPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [topic, setTopic] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRooms();

    const supabase = createClient();
    const channel = supabase
      .channel("lobby-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "study_rooms" },
        () => { loadRooms(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadRooms() {
    const res = await fetch("/api/study-rooms");
    if (res.ok) {
      const data = await res.json();
      setRooms(data.rooms ?? []);
    }
  }

  async function handleCreate() {
    if (!topic.trim()) return;
    setError(""); setCreating(true);
    const res = await fetch("/api/study-rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    setCreating(false);
    if (!res.ok) { setError("Failed to create room."); return; }
    const data = await res.json();
    router.push(`/dashboard/study-buddy/partner/${data.room.id}`);
  }

  async function handleJoin(roomId: string) {
    setJoining(roomId);
    router.push(`/dashboard/study-buddy/partner/${roomId}`);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <button onClick={() => router.push("/dashboard/study-buddy")}
          className="flex items-center gap-1.5 text-sm mb-4 transition-colors"
          style={{ color: 'var(--text-faint)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-body)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Study Buddy
        </button>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          Find a Study Partner
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Post a topic to find someone to study with, or join an open room.
        </p>
      </div>

      {/* Create room */}
      <div className="rounded-2xl p-6 mb-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)' }}>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
          What are you studying?
        </label>
        <div className="flex gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="e.g. Cell Division, World War II, Calculus…"
            className="dark-input flex-1"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !topic.trim()}
            className="btn-glow flex-shrink-0 px-5"
            style={{ background: 'linear-gradient(90deg, #0066cc, #00CBFF)', padding: '10px 20px' }}>
            {creating ? "Creating…" : "Post"}
          </button>
        </div>
        {error && (
          <p className="text-sm mt-2" style={{ color: '#fca5a5' }}>{error}</p>
        )}
      </div>

      {/* Open rooms */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            Open rooms
          </p>
          <button onClick={loadRooms} className="text-xs transition-colors" style={{ color: 'var(--text-faint)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-body)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}>
            Refresh
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-card)' }}>
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
              No open rooms right now. Post a topic and wait for someone to join!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div key={room.id}
                className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{room.topic}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    Posted by {room.host_name}
                  </p>
                </div>
                <button
                  onClick={() => handleJoin(room.id)}
                  disabled={joining === room.id}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{ background: 'rgba(0,203,255,0.12)', color: '#00CBFF', border: '1px solid rgba(0,203,255,0.3)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(0,203,255,0.2)';
                    (e.currentTarget as HTMLElement).style.borderColor = '#00CBFF';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(0,203,255,0.12)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,203,255,0.3)';
                  }}>
                  {joining === room.id ? "Joining…" : "Join"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

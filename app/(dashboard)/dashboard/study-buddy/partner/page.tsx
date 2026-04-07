"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

const SUBJECTS = ["Math", "Science", "Filipino", "English", "History", "Physics", "Chemistry", "Biology", "Economics", "Statistics"];

interface RoomMember { id: string; name: string; gender: string | null; }

interface Room {
  id: string;
  topic: string;
  host_name: string;
  status: string;
  subject: string | null;
  host_gender: string | null;
  preferred_gender: string | null;
  max_members: number;
  members: RoomMember[];
  created_at: string;
}

export default function PartnerLobbyPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxMembers, setMaxMembers] = useState(2);
  const [preferGender, setPreferGender] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [filterGender, setFilterGender] = useState("");

  const [privateCode, setPrivateCode] = useState("");
  const [joiningPrivate, setJoiningPrivate] = useState(false);
  const [privateError, setPrivateError] = useState("");

  const filterRef = useRef(filterSubject);
  filterRef.current = filterSubject;
  const filterGenderRef = useRef(filterGender);
  filterGenderRef.current = filterGender;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("display_name").eq("id", user.id).single()
        .then(({ data }) => { if (data) setDisplayName(data.display_name); });
    });

    const channel = supabase
      .channel("lobby-" + crypto.randomUUID())
      .on("postgres_changes", { event: "*", schema: "public", table: "study_rooms" }, () => loadRooms())
      .subscribe();

    loadRooms();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadRooms(); }, [filterSubject, filterGender]);

  async function loadRooms() {
    const params = new URLSearchParams();
    if (filterRef.current) params.set("subject", filterRef.current);
    if (filterGenderRef.current) params.set("gender", filterGenderRef.current);
    const res = await fetch(`/api/study-rooms${params.size ? "?" + params : ""}`);
    if (res.ok) setRooms((await res.json()).rooms ?? []);
  }

  async function handleCreate() {
    if (!topic.trim()) return;
    setError(""); setCreating(true);
    const res = await fetch("/api/study-rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, subject: subject || null, is_private: isPrivate, max_members: maxMembers, preferred_gender: preferGender || null }),
    });
    setCreating(false);
    if (!res.ok) { setError("Failed to create room."); return; }
    const { room } = await res.json();
    router.push(`/dashboard/study-buddy/partner/${room.id}`);
  }

  async function handleJoinPrivate() {
    const code = privateCode.trim().toUpperCase();
    if (code.length !== 6) { setPrivateError("Enter a valid 6-character code."); return; }
    setJoiningPrivate(true); setPrivateError("");

    const findRes = await fetch(`/api/study-rooms?code=${code}`);
    if (!findRes.ok) {
      setPrivateError((await findRes.json()).error ?? "Invalid room code.");
      setJoiningPrivate(false); return;
    }
    const { room } = await findRes.json();

    const joinRes = await fetch(`/api/study-rooms/${room.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", partnerName: displayName || "Anonymous", roomCode: code }),
    });
    if (!joinRes.ok) {
      setPrivateError((await joinRes.json()).error ?? "Could not join room.");
      setJoiningPrivate(false); return;
    }
    router.push(`/dashboard/study-buddy/partner/${room.id}`);
  }

  return (
    <div className="flex flex-col" style={{ maxWidth: "1100px" }}>
      <button onClick={() => router.push("/dashboard/study-buddy")}
        className="flex items-center gap-1.5 text-sm mb-6 transition-colors w-fit"
        style={{ color: "var(--text-faint)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-body)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-faint)")}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Study Buddy
      </button>

      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
        Find a Study Partner
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Post a topic or join an open room. Private rooms need a 6-character code.
      </p>

      {/* Split layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ── Left: Create + Join private ── */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-[300px] lg:flex-shrink-0">

          {/* Create room */}
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-accent)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              Post a room
            </p>
            <input value={topic} onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Cell Division, Calculus…" className="dark-input mb-3" />
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button onClick={() => setSubject("")} className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={!subject ? { background: "var(--accent-purple-bg-strong)", color: "#fff", border: "1px solid rgba(103,33,255,0.5)" }
                  : { color: "var(--text-faint)", border: "1px solid var(--bg-white-muted)" }}>
                General
              </button>
              {SUBJECTS.map((s) => (
                <button key={s} onClick={() => setSubject(s)} className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={subject === s ? { background: "var(--accent-purple-bg-strong)", color: "#fff", border: "1px solid rgba(103,33,255,0.5)" }
                    : { color: "var(--text-faint)", border: "1px solid var(--bg-white-muted)" }}>
                  {s}
                </button>
              ))}
            </div>
            {/* Room size */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Room size:</span>
              {[2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setMaxMembers(n)}
                  className="w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center"
                  style={maxMembers === n ? {
                    background: "linear-gradient(135deg,rgba(103,33,255,0.3),rgba(0,203,255,0.15))",
                    color: "var(--text-primary)", border: "1px solid var(--border-strong)",
                  } : {
                    color: "var(--text-faint)", border: "1px solid var(--border-subtle)",
                  }}>
                  {n}
                </button>
              ))}
            </div>

            {/* Preferred gender */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Prefer:</span>
              {[{ value: "", label: "Anyone" }, { value: "male", label: "Male" }, { value: "female", label: "Female" }].map((g) => (
                <button key={g.value} onClick={() => setPreferGender(g.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={preferGender === g.value ? {
                    background: "linear-gradient(135deg,rgba(103,33,255,0.3),rgba(0,203,255,0.15))",
                    color: "var(--text-primary)", border: "1px solid var(--border-strong)",
                  } : {
                    color: "var(--text-faint)", border: "1px solid var(--border-subtle)",
                  }}>
                  {g.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2.5 mb-4 cursor-pointer select-none">
              <div onClick={() => setIsPrivate((p) => !p)}
                className="w-10 h-5 rounded-full relative transition-all flex-shrink-0"
                style={{ background: isPrivate ? "linear-gradient(90deg,#6721FF,#00CBFF)" : "var(--bg-white-muted)" }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: isPrivate ? "calc(100% - 18px)" : "2px" }} />
              </div>
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Private room
              </span>
            </label>
            <button onClick={handleCreate} disabled={creating || !topic.trim()} className="btn-glow w-full"
              style={{ background: "linear-gradient(90deg,#6721FF,#00CBFF)", padding: "10px 20px", fontSize: "13px" }}>
              {creating ? "Creating…" : "Post room"}
            </button>
            {error && <p className="text-xs mt-2" style={{ color: "var(--accent-red)" }}>{error}</p>}
          </div>

          {/* Join private room */}
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid rgba(103,33,255,0.2)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              Join private room
            </p>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--text-faint)" }}>
              Got a 6-character code from your study partner? Enter it here.
            </p>
            <input value={privateCode}
              onChange={(e) => setPrivateCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleJoinPrivate()}
              placeholder="AB3X9Z" className="dark-input mb-3 text-center tracking-widest font-mono text-lg"
              maxLength={6} />
            <button onClick={handleJoinPrivate} disabled={joiningPrivate || privateCode.length !== 6}
              className="btn-glow w-full"
              style={{ background: "linear-gradient(90deg,#a855f7,#6721FF)", padding: "10px 20px", fontSize: "13px" }}>
              {joiningPrivate ? "Joining…" : "Join private room"}
            </button>
            {privateError && <p className="text-xs mt-2" style={{ color: "var(--accent-red)" }}>{privateError}</p>}
          </div>
        </div>

        {/* ── Right: Open rooms ── */}
        <div className="flex-1 min-w-0">
          {/* Subject filter */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Filter:</p>
            <button onClick={() => setFilterSubject("")} className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={!filterSubject ? { background: "var(--accent-purple-bg)", color: "#fff", border: "1px solid rgba(103,33,255,0.4)" }
                : { color: "var(--text-faint)", border: "1px solid var(--bg-white-muted)" }}>
              All
            </button>
            {SUBJECTS.map((s) => (
              <button key={s} onClick={() => setFilterSubject(s)} className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={filterSubject === s ? { background: "var(--accent-purple-bg)", color: "#fff", border: "1px solid rgba(103,33,255,0.4)" }
                  : { color: "var(--text-faint)", border: "1px solid var(--bg-white-muted)" }}>
                {s}
              </button>
            ))}
          </div>

          {/* Gender filter */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Gender:</p>
            {[{ value: "", label: "All" }, { value: "male", label: "Male" }, { value: "female", label: "Female" }].map((g) => (
              <button key={g.value} onClick={() => setFilterGender(g.value)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={filterGender === g.value ? { background: "var(--accent-cyan-bg)", color: "var(--accent-cyan)", border: "1px solid var(--accent-cyan-border)" }
                  : { color: "var(--text-faint)", border: "1px solid var(--bg-white-muted)" }}>
                {g.label}
              </button>
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
              Open rooms {rooms.length > 0 && `(${rooms.length})`}
            </p>
            <button onClick={loadRooms} className="text-xs" style={{ color: "var(--text-faint)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-body)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-faint)")}>
              Refresh
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px dashed var(--border-card)" }}>
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                No open rooms{filterSubject ? ` for ${filterSubject}` : ""} right now. Post one and wait for someone to join!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <div key={room.id} className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{room.topic}</p>
                      {room.subject && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "rgba(103,33,255,0.12)", color: "var(--accent-purple)", border: "1px solid rgba(103,33,255,0.2)" }}>
                          {room.subject}
                        </span>
                      )}
                      {room.preferred_gender && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: room.preferred_gender === "female" ? "rgba(236,72,153,0.1)" : "rgba(59,130,246,0.1)",
                            color: room.preferred_gender === "female" ? "#ec4899" : "#3b82f6",
                            border: `1px solid ${room.preferred_gender === "female" ? "rgba(236,72,153,0.2)" : "rgba(59,130,246,0.2)"}` }}>
                          {room.preferred_gender === "female" ? "Girls only" : "Boys only"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs" style={{ color: "var(--text-faint)" }}>by {room.host_name}</p>
                      {room.host_gender && room.host_gender !== "prefer_not_to_say" && (
                        <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: room.host_gender === "female" ? "rgba(236,72,153,0.1)" : "rgba(59,130,246,0.1)",
                            color: room.host_gender === "female" ? "#ec4899" : "#3b82f6",
                            border: `1px solid ${room.host_gender === "female" ? "rgba(236,72,153,0.2)" : "rgba(59,130,246,0.2)"}` }}>
                          {room.host_gender === "female" ? "F" : "M"}
                        </span>
                      )}
                      <span className="text-xs font-semibold" style={{ color: "var(--accent-green)" }}>
                        {(room.members?.length ?? 1)}/{room.max_members ?? 2}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => { setJoining(room.id); router.push(`/dashboard/study-buddy/partner/${room.id}`); }}
                    disabled={joining === room.id}
                    className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={{ background: "var(--accent-cyan-bg)", color: "var(--accent-cyan)", border: "1px solid rgba(0,203,255,0.3)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--accent-cyan-border)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-cyan)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--accent-cyan-bg)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-cyan-border)";
                    }}>
                    {joining === room.id ? "Joining…" : "Join"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

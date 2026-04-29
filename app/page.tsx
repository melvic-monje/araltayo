"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { usePlayerId } from "@/lib/usePlayer";
import { playMusic } from "@/lib/sounds";
import { useClickSfx } from "@/lib/useClickSfx";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export default function Landing() {
  const router = useRouter();
  const playerId = usePlayerId();
  const [mode, setMode] = useState<"home" | "join">("home");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { playMusic("menu", 0.25); }, []);
  useClickSfx(true);

  async function createRoom() {
    if (!playerId) return;
    setCreating(true);
    setError(null);
    const supabase = getSupabase();

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const { error: insertErr } = await supabase
        .from("rooms")
        .insert({ code, host_id: playerId, status: "lobby" });
      if (!insertErr) {
        router.push(`/room/${code}?host=1`);
        return;
      }
      if (!insertErr.message.toLowerCase().includes("duplicate")) {
        setError(insertErr.message);
        setCreating(false);
        return;
      }
    }
    setError("Could not allocate a unique room code, please try again.");
    setCreating(false);
  }

  function joinRoom(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) {
      setError("Room codes are 4 characters.");
      return;
    }
    router.push(`/room/${code}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="brand-title text-6xl sm:text-7xl mb-3">
          <span className="neon-text">Bardagulan 2026</span>
        </h1>
        <p className="text-slate-300 mb-10 italic font-bold tracking-wide">
          Let&apos;s get ready to <span className="neon-text">BARDUGS</span>! 🥊
        </p>

        {mode === "home" && (
          <div className="flex flex-col gap-3">
            <button
              className="btn-neon text-lg py-4"
              disabled={!playerId || creating}
              onClick={createRoom}
            >
              {creating ? "Creating..." : "Create Room"}
            </button>
            <button className="btn-ghost text-lg py-4" onClick={() => setMode("join")}>
              Join Room
            </button>
          </div>
        )}

        {mode === "join" && (
          <form onSubmit={joinRoom} className="flex flex-col gap-3">
            <input
              autoFocus
              className="code-input"
              maxLength={4}
              placeholder="ABCD"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
            <button className="btn-neon text-lg py-4" type="submit">
              Join
            </button>
            <button
              type="button"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors mt-2"
              onClick={() => {
                setMode("home");
                setError(null);
                setJoinCode("");
              }}
            >
              ← Back
            </button>
          </form>
        )}

        {error && <p className="text-pink-400 text-sm mt-4">{error}</p>}
      </div>
    </main>
  );
}

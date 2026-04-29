"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, type Player, type Room } from "@/lib/supabase";
import { useRoom } from "@/lib/useRoom";
import { usePlayerId } from "@/lib/usePlayer";
import { avatarFor } from "@/lib/avatars";
import { useGameInput } from "@/lib/useGameInput";
import HUD from "@/components/HUD";
import Leaderboard from "@/components/Leaderboard";
import Confetti from "@/components/Confetti";
import AvatarUpload from "@/components/AvatarUpload";
import OrientationGate from "@/components/OrientationGate";

const RACE_DURATION_SEC = 90;
const COUNTDOWN_LEAD_SEC = 4;

const GameScene = dynamic(() => import("@/components/scene/GameScene"), { ssr: false });

export default function RoomClient({ code }: { code: string }) {
  const router = useRouter();
  const playerId = usePlayerId();
  const { room, players, error, setRoom, setPlayers } = useRoom(code);

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [confettiTick, setConfettiTick] = useState(0);
  const [phase, setPhase] = useState<"countdown" | "racing" | "post">("countdown");

  const [cooldowns, setCooldowns] = useState({ throw: 0, harpoon: 0 });
  const [meStatus, setMeStatus] = useState({ distance: 0, place: 1 });

  const me = useMemo(
    () => (playerId ? players.find((p) => p.id === playerId) ?? null : null),
    [playerId, players]
  );
  const isHost = !!playerId && !!room && room.host_id === playerId;

  const { inputRef, skillTriggerRef, setForward, setTurn, triggerThrow, triggerHarpoon } = useGameInput();
  const finishRecordedRef = useRef(false);

  async function joinAsPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId) return;
    if (!name.trim()) {
      setJoinError("Pick a name first.");
      return;
    }
    if (!room) {
      setJoinError("Room not found.");
      return;
    }
    if (room.status !== "lobby") {
      setJoinError("Race already in progress — wait for the next round.");
      return;
    }
    setJoining(true);
    setJoinError(null);
    const supabase = getSupabase();
    const payload = {
      id: playerId,
      room_code: code,
      name: name.trim().slice(0, 20),
      press_count: 0,
      avatar_url: avatarUrl,
      finish_ms: null,
      finished_at: null,
    };
    const { data, error: upsertErr } = await supabase
      .from("players")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();
    if (upsertErr) {
      setJoinError(upsertErr.message);
    } else if (data) {
      setPlayers((prev) => {
        const inserted = data as Player;
        const exists = prev.some((p) => p.id === inserted.id);
        return exists
          ? prev.map((p) => (p.id === inserted.id ? inserted : p))
          : [...prev, inserted];
      });
    }
    setJoining(false);
  }

  async function startRace() {
    if (!room || !isHost) return;
    const supabase = getSupabase();
    const startsAt = new Date(Date.now() + COUNTDOWN_LEAD_SEC * 1000);
    const endsAt = new Date(startsAt.getTime() + RACE_DURATION_SEC * 1000);
    await supabase
      .from("players")
      .update({ finish_ms: null, finished_at: null, rank: null })
      .eq("room_code", code);
    await supabase
      .from("rooms")
      .update({
        status: "racing",
        race_starts_at: startsAt.toISOString(),
        race_ends_at: endsAt.toISOString(),
      })
      .eq("code", code);
  }

  async function playAgain() {
    if (!room || !isHost) return;
    const supabase = getSupabase();
    await supabase
      .from("players")
      .update({ finish_ms: null, finished_at: null, rank: null })
      .eq("room_code", code);
    await supabase
      .from("rooms")
      .update({ status: "lobby", race_starts_at: null, race_ends_at: null })
      .eq("code", code);
    finishRecordedRef.current = false;
    setPhase("countdown");
  }

  // Phase ticker
  useEffect(() => {
    if (room?.status !== "racing" || !room.race_starts_at || !room.race_ends_at) return;
    const tick = () => {
      const now = Date.now();
      const startMs = new Date(room.race_starts_at!).getTime();
      const endMs = new Date(room.race_ends_at!).getTime();
      if (now < startMs) setPhase("countdown");
      else if (now < endMs) setPhase("racing");
      else setPhase("post");
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [room?.status, room?.race_starts_at, room?.race_ends_at]);

  // Any client flips to finished when time expires (or when loading a stale racing room)
  useEffect(() => {
    if (room?.status !== "racing" || !room.race_ends_at) return;
    const endMs = new Date(room.race_ends_at).getTime();
    if (Date.now() < endMs) return;
    let cancelled = false;
    (async () => {
      const supabase = getSupabase();
      const { data, error: updErr } = await supabase
        .from("rooms")
        .update({ status: "finished" })
        .eq("code", code)
        .eq("status", "racing")
        .select()
        .maybeSingle();
      if (cancelled) return;
      if (updErr) {
        console.error("[race] timer-end flip failed", updErr);
        return;
      }
      console.log("[race] timer expired → room finished");
      if (data) setRoom(data as Room);
    })();
    return () => { cancelled = true; };
  }, [phase, room, code, setRoom]);

  // End the race the moment any player crosses the finish line (winner-takes-all)
  useEffect(() => {
    if (room?.status !== "racing" || players.length === 0) return;
    const someoneFinished = players.some(
      (p) => (p as Player & { finish_ms?: number | null }).finish_ms != null
    );
    if (!someoneFinished) return;
    let cancelled = false;
    (async () => {
      const supabase = getSupabase();
      const { data, error: updErr } = await supabase
        .from("rooms")
        .update({ status: "finished" })
        .eq("code", code)
        .eq("status", "racing")
        .select()
        .maybeSingle();
      if (cancelled) return;
      if (updErr) {
        console.error("[race] winner-finish flip failed", updErr);
        return;
      }
      console.log("[race] someone finished → room finished");
      if (data) setRoom(data as Room);
    })();
    return () => { cancelled = true; };
  }, [players, room?.status, code, setRoom]);

  // Reset on lobby
  useEffect(() => {
    if (room?.status === "lobby") {
      finishRecordedRef.current = false;
      setPhase("countdown");
    }
  }, [room?.status]);

  // Confetti when finished
  useEffect(() => {
    if (room?.status === "finished") setConfettiTick((t) => t + 1);
  }, [room?.status]);

  async function handleFinish(finishMs: number) {
    if (!playerId || finishRecordedRef.current) return;
    finishRecordedRef.current = true;
    const supabase = getSupabase();
    const { data, error: updErr } = await supabase
      .from("players")
      .update({ finish_ms: finishMs, finished_at: new Date().toISOString() })
      .eq("id", playerId)
      .select()
      .single();
    if (updErr) {
      console.error("[race] handleFinish failed", updErr);
      return;
    }
    console.log("[race] handleFinish ok", { finishMs });
    if (data) {
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? (data as Player) : p))
      );
    }
  }

  if (error) {
    return (
      <Center>
        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
        <p className="text-slate-400 mb-6">{error}</p>
        <Link href="/" className="btn-ghost">← Home</Link>
      </Center>
    );
  }

  if (!room) {
    return (
      <Center>
        <p className="text-slate-400">Loading room <span className="font-mono">{code}</span>…</p>
      </Center>
    );
  }

  // Join screen
  if (!me) {
    return (
      <Center>
        <h1 className="text-4xl font-extrabold mb-2">Room <span className="neon-text font-mono">{code}</span></h1>
        <p className="text-slate-400 mb-6">Pick a name and (optionally) a picture to join.</p>
        <form onSubmit={joinAsPlayer} className="flex flex-col gap-4 max-w-xs mx-auto items-center">
          {playerId && (
            <AvatarUpload
              playerId={playerId}
              initialUrl={avatarUrl}
              onChange={setAvatarUrl}
            />
          )}
          <input
            autoFocus
            className="text-input"
            placeholder="Your name"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn-neon w-full" type="submit" disabled={joining || !playerId}>
            {joining ? "Joining…" : "Join Race"}
          </button>
          {joinError && <p className="text-pink-400 text-sm">{joinError}</p>}
        </form>
        {players.length > 0 && (
          <div className="mt-8 text-sm text-slate-400">
            Already in: {players.map((p) => p.name).join(", ")}
          </div>
        )}
      </Center>
    );
  }

  // Lobby
  if (room.status === "lobby") {
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <div className="max-w-3xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">← Home</Link>
            <span className="text-xs uppercase tracking-widest text-slate-500">Lobby</span>
          </header>

          <div className="text-center mb-10">
            <p className="text-sm uppercase tracking-widest text-slate-400 mb-2">Room Code</p>
            <h1 className="text-7xl sm:text-9xl font-extrabold neon-text font-mono tracking-widest">{code}</h1>
            <p className="text-slate-400 mt-3">Share this code with players to join.</p>
          </div>

          <PlayerGrid players={players} selfId={playerId} />

          <div className="mt-10 text-center">
            {isHost ? (
              <button className="btn-neon text-xl" onClick={startRace} disabled={players.length < 1}>
                Start Race
              </button>
            ) : (
              <p className="text-slate-400 italic">Waiting for host to start…</p>
            )}
          </div>

          <p className="text-center text-xs text-slate-500 mt-8 leading-relaxed">
            Controls: Arrow keys to move/turn · U throw (stuns target) · I harpoon (yanks target back) · 3 s cooldown each. Mobile: on-screen joystick + buttons.
          </p>
        </div>
      </main>
    );
  }

  // Racing — 3D scene + HUD
  if (room.status === "racing" && room.race_starts_at && room.race_ends_at) {
    const startsAtMs = new Date(room.race_starts_at).getTime();
    const endsAtMs = new Date(room.race_ends_at).getTime();
    const inCountdown = phase === "countdown";
    const initialPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      avatarUrl: (p as Player & { avatar_url?: string | null }).avatar_url ?? null,
    }));

    return (
      <OrientationGate>
        <main className="fixed inset-0 overflow-hidden" style={{ background: "#0B0E1A" }}>
          <div className="absolute inset-0">
            <GameScene
              code={code}
              selfId={playerId!}
              startsAt={startsAtMs}
              endsAt={endsAtMs}
              initialPlayers={initialPlayers}
              inputRef={inputRef}
              skillTriggerRef={skillTriggerRef}
              onCooldown={setCooldowns}
              onLap={setMeStatus}
              onFinish={handleFinish}
            />
          </div>

          <HUD
            cooldowns={cooldowns}
            distance={meStatus.distance}
            place={meStatus.place}
            totalPlayers={players.length}
            endsAt={endsAtMs}
            onTouchForward={setForward}
            onTouchTurn={setTurn}
            onTouchThrow={triggerThrow}
            onTouchHarpoon={triggerHarpoon}
          />

          {inCountdown && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
              <CountdownOverlay startsAtMs={startsAtMs} />
            </div>
          )}

          <div className="absolute top-4 right-4 hidden md:block z-10">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-200 bg-black/40 backdrop-blur rounded-full px-3 py-1">
              Leave
            </Link>
          </div>
        </main>
      </OrientationGate>
    );
  }

  // Results
  return (
    <main className="min-h-screen p-6 sm:p-10">
      <Confetti trigger={confettiTick} />
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <span className="text-sm text-slate-400 font-mono">Room {code}</span>
          <span className="text-xs uppercase tracking-widest text-slate-500">Final results</span>
        </header>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-center mb-2">
          <span className="neon-text">Race over</span>
        </h1>

        <Leaderboard players={players} />

        <div className="mt-10 text-center flex flex-col sm:flex-row gap-3 justify-center">
          {isHost ? (
            <button className="btn-neon text-lg" onClick={playAgain}>Play Again</button>
          ) : (
            <p className="text-slate-400 italic">Waiting for host to start a new round…</p>
          )}
          <button className="btn-ghost" onClick={() => router.push("/")}>Leave</button>
        </div>
      </div>
    </main>
  );
}

function CountdownOverlay({ startsAtMs }: { startsAtMs: number }) {
  const [s, setS] = useState(() => Math.ceil((startsAtMs - Date.now()) / 1000));
  useEffect(() => {
    const id = setInterval(() => setS(Math.ceil((startsAtMs - Date.now()) / 1000)), 100);
    return () => clearInterval(id);
  }, [startsAtMs]);
  if (s <= 0) {
    return <div className="text-9xl font-extrabold neon-text animate-pulse">GO!</div>;
  }
  return <div className="text-9xl font-extrabold neon-text">{s}</div>;
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">{children}</div>
    </main>
  );
}

function PlayerGrid({ players, selfId }: { players: Player[]; selfId: string | null }) {
  if (players.length === 0) {
    return <p className="text-center text-slate-400 italic">No players have joined yet…</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {players.map((p) => {
        const avatar = avatarFor(p.id);
        const url = (p as Player & { avatar_url?: string | null }).avatar_url;
        return (
          <div
            key={p.id}
            className="rounded-2xl p-4 text-center border"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: p.id === selfId ? avatar.color : "rgba(255,255,255,0.1)",
              boxShadow: p.id === selfId ? `0 0 24px ${avatar.color}55` : "none",
            }}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="w-12 h-12 mx-auto mb-2 rounded-full object-cover" />
            ) : (
              <div className="text-4xl mb-1">{avatar.emoji}</div>
            )}
            <div className="font-bold truncate" style={{ color: avatar.color }}>{p.name}</div>
            {p.id === selfId && <div className="text-xs text-slate-400 mt-0.5">you</div>}
          </div>
        );
      })}
    </div>
  );
}

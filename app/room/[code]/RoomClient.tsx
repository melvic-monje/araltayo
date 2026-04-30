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
import CharacterPicker from "@/components/CharacterPicker";
import { DEFAULT_CHARACTER, type CharacterId, isCharacterId } from "@/lib/characters";
import { playMusic, stopMusic } from "@/lib/sounds";
import { useClickSfx } from "@/lib/useClickSfx";

// Safety only — race normally ends when someone crosses the finish line.
// Stale rooms get auto-finished after this if no one ever finishes.
const RACE_DURATION_SEC = 10 * 60;
const COUNTDOWN_LEAD_SEC = 4;

const GameScene = dynamic(() => import("@/components/scene/GameScene"), { ssr: false });

export default function RoomClient({ code }: { code: string }) {
  const router = useRouter();
  const playerId = usePlayerId();
  const { room, players, error, setRoom, setPlayers } = useRoom(code);

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [characterId, setCharacterId] = useState<CharacterId>(DEFAULT_CHARACTER);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [confettiTick, setConfettiTick] = useState(0);
  const [phase, setPhase] = useState<"countdown" | "racing" | "post">("countdown");
  const [togglingReady, setTogglingReady] = useState(false);

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
      character_id: characterId,
      is_ready: false,
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

  async function tryFullscreenLandscape() {
    if (typeof window === "undefined") return;
    const isCoarse = matchMedia("(pointer: coarse)").matches;
    if (!isCoarse) return;
    try {
      if (document.fullscreenElement == null) {
        await document.documentElement.requestFullscreen?.();
      }
    } catch {
      /* iOS Safari rejects on non-video elements; ignore. */
    }
    try {
      type SO = ScreenOrientation & { lock?: (o: string) => Promise<void> };
      await (screen.orientation as SO).lock?.("landscape");
    } catch {
      /* OS may refuse without fullscreen. */
    }
  }

  async function toggleReady() {
    if (!playerId || !me || togglingReady) return;
    setTogglingReady(true);
    const next = !me.is_ready;
    if (next) {
      // The Ready click is a user gesture — try to enter fullscreen + lock
      // landscape now so the race screen renders correctly.
      await tryFullscreenLandscape();
    }
    const supabase = getSupabase();
    const { data } = await supabase
      .from("players")
      .update({ is_ready: next })
      .eq("id", playerId)
      .select()
      .single();
    if (data) {
      setPlayers((prev) => prev.map((p) => (p.id === playerId ? (data as Player) : p)));
    }
    setTogglingReady(false);
  }

  async function startRace() {
    if (!room || !isHost) return;
    const supabase = getSupabase();
    const startsAt = new Date(Date.now() + COUNTDOWN_LEAD_SEC * 1000);
    const endsAt = new Date(startsAt.getTime() + RACE_DURATION_SEC * 1000);
    await supabase
      .from("players")
      .update({ finish_ms: null, finished_at: null, rank: null, is_ready: false })
      .eq("room_code", code);
    const { data, error: updErr } = await supabase
      .from("rooms")
      .update({
        status: "racing",
        race_starts_at: startsAt.toISOString(),
        race_ends_at: endsAt.toISOString(),
      })
      .eq("code", code)
      .select()
      .maybeSingle();
    if (updErr) {
      console.error("[race] startRace failed", updErr);
      return;
    }
    if (data) setRoom(data as Room);
  }

  async function playAgain() {
    if (!room || !isHost) return;
    const supabase = getSupabase();
    await supabase
      .from("players")
      .update({ finish_ms: null, finished_at: null, rank: null, is_ready: false })
      .eq("room_code", code);
    const { data } = await supabase
      .from("rooms")
      .update({ status: "lobby", race_starts_at: null, race_ends_at: null })
      .eq("code", code)
      .select()
      .maybeSingle();
    if (data) setRoom(data as Room);
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

  // End the race once every joined player has crossed the finish line.
  // Individual finishers see the leaderboard immediately (handled above),
  // so the race continues for the remaining drivers in the meantime.
  useEffect(() => {
    if (room?.status !== "racing" || players.length === 0) return;
    const allFinished = players.every(
      (p) => (p as Player & { finish_ms?: number | null }).finish_ms != null
    );
    if (!allFinished) return;
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
        console.error("[race] all-finished flip failed", updErr);
        return;
      }
      console.log("[race] all players finished → room finished");
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

  // Music: racing track during the race, menu loop everywhere else.
  useEffect(() => {
    if (room?.status === "racing") playMusic("racing", 0.3);
    else playMusic("menu", 0.25);
    return () => { /* keep playing across unmounts; landing handles its own */ };
  }, [room?.status]);

  useEffect(() => () => { stopMusic(); }, []);

  // Click sound on buttons everywhere except the race screen.
  useClickSfx(room?.status !== "racing");

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
        <p className="text-slate-400 mb-6">Pick your character, name, and (optional) picture.</p>
        <form onSubmit={joinAsPlayer} className="flex flex-col gap-5 max-w-md mx-auto items-center">
          <CharacterPicker value={characterId} onChange={setCharacterId} />
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
            {joining ? "Joining…" : "Join Lobby"}
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

  // Lobby — 3D warm-up scene with overlay UI
  if (room.status === "lobby") {
    const initialPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatar_url ?? null,
      characterId: isCharacterId(p.character_id) ? p.character_id : null,
    }));
    const readyCount = players.filter((p) => p.is_ready).length;
    const allReady = players.length > 0 && readyCount === players.length;
    const farFuture = Date.now() + 10 * 60 * 1000;
    return (
      <OrientationGate>
        <main className="fixed inset-0 overflow-hidden" style={{ background: "#0B0E1A" }}>
          <div className="absolute inset-0">
            <GameScene
              key="lobby"
              code={code}
              selfId={playerId!}
              startsAt={Date.now()}
              endsAt={farFuture}
              initialPlayers={initialPlayers}
              inputRef={inputRef}
              skillTriggerRef={skillTriggerRef}
              onCooldown={setCooldowns}
              onLap={setMeStatus}
              onFinish={() => {}}
              lobbyMode
            />
          </div>

          {/* Top bar — code + leave */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-none z-10">
            <div className="bg-black/40 backdrop-blur rounded-xl px-4 py-2">
              <div className="text-[10px] uppercase tracking-widest text-slate-300">Room Code</div>
              <div className="text-3xl sm:text-4xl font-extrabold neon-text font-mono tracking-widest">{code}</div>
            </div>
            <Link href="/" className="text-xs text-slate-300 hover:text-white bg-black/40 backdrop-blur rounded-full px-3 py-1.5 pointer-events-auto">Leave</Link>
          </div>

          {/* Right panel — player ready states */}
          <div className="absolute top-24 sm:top-28 right-3 max-w-[220px] pointer-events-none z-10">
            <div className="bg-black/40 backdrop-blur rounded-xl px-3 py-2 space-y-1.5">
              <div className="text-[10px] uppercase tracking-widest text-slate-300">
                <span className="font-mono font-bold" style={{ color: allReady ? "#22D3EE" : "#F472B6" }}>
                  {readyCount}/{players.length}
                </span> ready
              </div>
              {players.map((p) => {
                const av = avatarFor(p.id);
                return (
                  <div key={p.id} className="flex items-center gap-2 text-xs">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: av.color + "44" }}>{av.emoji}</span>
                    )}
                    <span className="truncate flex-1" style={{ color: av.color }}>
                      {p.name}{p.id === playerId ? " (you)" : ""}
                    </span>
                    {p.is_ready && <span className="text-[#22D3EE] font-bold">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* HUD with skill cooldown buttons (works in lobby for practice).
              Top bar hidden so it doesn't overlap the room code panel. */}
          <HUD
            cooldowns={cooldowns}
            distance={meStatus.distance}
            place={meStatus.place}
            totalPlayers={players.length}
            hideTopBar
            onTouchForward={setForward}
            onTouchTurn={setTurn}
            onTouchThrow={triggerThrow}
            onTouchHarpoon={triggerHarpoon}
          />

          {/* Lobby controls — Ready + Start. Sit above the skill HUD so the
              throw/harpoon buttons don't overlap on desktop. */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                className={me?.is_ready ? "btn-ghost" : "btn-neon"}
                onClick={toggleReady}
                disabled={togglingReady}
              >
                {me?.is_ready ? "Unready" : "I'm Ready"}
              </button>
              {isHost && (
                <button
                  className="btn-neon"
                  onClick={startRace}
                  disabled={!allReady}
                >
                  Start Race
                </button>
              )}
            </div>
            {!isHost && (
              <p className="text-[11px] text-slate-300 bg-black/40 backdrop-blur rounded-full px-3 py-1">
                {allReady ? "Waiting for host to start…" : "Warm up while waiting — tap I'm Ready when set."}
              </p>
            )}
          </div>
        </main>
      </OrientationGate>
    );
  }

  // Racing — 3D scene + HUD. Once *this* player has finished, drop them
  // straight to the live leaderboard so they can't keep roaming the track.
  const meFinished = me?.finish_ms != null;
  if (room.status === "racing" && meFinished) {
    const sortedFinished = [...players].sort((a, b) => {
      const af = a.finish_ms;
      const bf = b.finish_ms;
      if (af != null && bf != null) return af - bf;
      if (af != null) return -1;
      if (bf != null) return 1;
      return 0;
    });
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <div className="max-w-3xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <span className="text-sm text-slate-400 font-mono">Room {code}</span>
            <span className="text-xs uppercase tracking-widest text-slate-500">You finished</span>
          </header>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-2 brand-title">
            <span className="neon-text">Finish line!</span>
          </h1>
          <p className="text-center text-slate-300 mb-8">
            Your time: <span className="font-mono font-bold" style={{ color: "#22D3EE" }}>{(me!.finish_ms! / 1000).toFixed(2)}s</span>
            {" · "}Race still in progress…
          </p>
          <Leaderboard players={sortedFinished} />
        </div>
      </main>
    );
  }

  if (room.status === "racing" && room.race_starts_at && room.race_ends_at) {
    const startsAtMs = new Date(room.race_starts_at).getTime();
    const endsAtMs = new Date(room.race_ends_at).getTime();
    const inCountdown = phase === "countdown";
    const initialPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatar_url ?? null,
      characterId: isCharacterId(p.character_id) ? p.character_id : null,
    }));

    return (
      <OrientationGate>
        <main className="fixed inset-0 overflow-hidden" style={{ background: "#0B0E1A" }}>
          <div className="absolute inset-0">
            <GameScene
              key={`race-${room.race_starts_at}`}
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
        const url = p.avatar_url;
        const ready = p.is_ready;
        return (
          <div
            key={p.id}
            className="relative rounded-2xl p-4 text-center border transition-all"
            style={{
              background: ready ? "rgba(34,211,238,0.08)" : "rgba(255,255,255,0.04)",
              borderColor: ready ? "#22D3EE" : p.id === selfId ? avatar.color : "rgba(255,255,255,0.1)",
              boxShadow: ready
                ? "0 0 24px rgba(34,211,238,0.35)"
                : p.id === selfId ? `0 0 24px ${avatar.color}55` : "none",
            }}
          >
            {ready && (
              <span className="absolute top-2 right-2 text-xs font-bold" style={{ color: "#22D3EE" }}>
                ✓ READY
              </span>
            )}
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="w-12 h-12 mx-auto mb-2 rounded-full object-cover" />
            ) : (
              <div className="text-4xl mb-1">{avatar.emoji}</div>
            )}
            <div className="text-xl sm:text-2xl font-bold truncate" style={{ color: avatar.color }}>{p.name}</div>
            {p.id === selfId && <div className="text-xs text-slate-400 mt-0.5">you</div>}
          </div>
        );
      })}
    </div>
  );
}

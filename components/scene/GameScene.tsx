"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  ACCEL,
  FRICTION,
  HARPOON_CONE_DEG,
  HARPOON_LINE_LIFETIME_MS,
  HARPOON_PULL_BACK,
  HARPOON_RANGE,
  HARPOON_STUN_MS,
  MAX_SPEED,
  OBSTACLES,
  PLAYER_RADIUS,
  POSITION_BROADCAST_HZ,
  PROJECTILE_HIT_RADIUS,
  PROJECTILE_LIFETIME_MS,
  PROJECTILE_SPEED,
  SKILL_COOLDOWN_MS,
  STUN_DURATION_MS,
  TRACK_LENGTH,
  TRACK_WIDTH,
  TURN_RATE,
  type GameEvent,
  type PlayerInput,
  type PlayerState,
  type Projectile as ProjectileT,
} from "@/lib/game";
import { useGameChannel, type RemotePos } from "@/lib/useGameChannel";
import { playSfx } from "@/lib/sounds";
import Track from "./Track";
import PlayerMesh from "./PlayerMesh";
import Projectile from "./Projectile";
import HarpoonLine from "./HarpoonLine";

type HarpoonShot = { id: string; fromX: number; fromZ: number; toX: number; toZ: number; bornAt: number };

export type GameSceneProps = {
  code: string;
  selfId: string;
  startsAt: number;
  endsAt: number;
  initialPlayers: { id: string; name: string; avatarUrl: string | null; characterId: string | null }[];
  inputRef: React.MutableRefObject<PlayerInput>;
  skillTriggerRef: React.MutableRefObject<{ throw?: number; harpoon?: number }>;
  onCooldown: (s: { throw: number; harpoon: number }) => void;
  onLap: (data: { distance: number; place: number }) => void;
  onFinish: (finishMs: number) => void;
  /** Lobby/practice mode: no finish detection, looser camera, controls still work. */
  lobbyMode?: boolean;
};

export default function GameScene(props: GameSceneProps) {
  const [generation, setGeneration] = useState(0);
  return (
    <Canvas
      key={generation}
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [-12, 8, 0], fov: 60 }}
      style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #1B2244 0%, #0B0E1A 100%)" }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        const onLost = (e: Event) => {
          e.preventDefault();
          // Force a remount so Three rebuilds the scene cleanly.
          setTimeout(() => setGeneration((g) => g + 1), 200);
        };
        canvas.addEventListener("webglcontextlost", onLost as EventListener, false);
      }}
      gl={{ powerPreference: "default", antialias: true, preserveDrawingBuffer: false }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <fog attach="fog" args={["#0B0E1A", 60, 220]} />
      <Track />
      <World {...props} />
    </Canvas>
  );
}

function World({
  code,
  selfId,
  startsAt,
  endsAt,
  initialPlayers,
  inputRef,
  skillTriggerRef,
  onCooldown,
  onLap,
  onFinish,
  lobbyMode = false,
}: GameSceneProps) {
  const { camera } = useThree();
  const lastFrameRef = useRef<number>(performance.now());
  const lastBroadcastRef = useRef<number>(0);

  // Last time the user pressed the skill key (rising-edge tracker)
  const lastThrowTriggerRef = useRef<number>(0);
  const lastHarpoonTriggerRef = useRef<number>(0);
  // Last time the skill actually fired (for cooldown)
  const lastThrowFiredRef = useRef<number>(-Infinity);
  const lastHarpoonFiredRef = useRef<number>(-Infinity);

  const finishedRef = useRef(false);
  // Active harpoon pull on self — interpolates x over the stun window.
  const pullRef = useRef<{ startMs: number; endMs: number; fromX: number; toX: number } | null>(null);

  const avatarMap = useMemo<Record<string, string | null>>(() => {
    const m: Record<string, string | null> = {};
    initialPlayers.forEach((p) => { m[p.id] = p.avatarUrl; });
    return m;
  }, [initialPlayers]);

  const characterMap = useMemo<Record<string, string | null>>(() => {
    const m: Record<string, string | null> = {};
    initialPlayers.forEach((p) => { m[p.id] = p.characterId; });
    return m;
  }, [initialPlayers]);

  const nameMap = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    initialPlayers.forEach((p) => { m[p.id] = p.name; });
    return m;
  }, [initialPlayers]);

  const startZ = useMemo(() => {
    const map: Record<string, number> = {};
    const n = initialPlayers.length;
    // Auto-fit lanes to track width so 11 players don't spawn in walls.
    const usable = TRACK_WIDTH - 2 * PLAYER_RADIUS - 1;
    const spacing = n > 1 ? Math.min(2.5, usable / (n - 1)) : 0;
    initialPlayers.forEach((p, i) => {
      const offset = (i - (n - 1) / 2) * spacing;
      map[p.id] = offset;
    });
    return map;
  }, [initialPlayers]);

  const [players, setPlayers] = useState<Record<string, PlayerState>>(() => {
    const init: Record<string, PlayerState> = {};
    initialPlayers.forEach((p) => {
      init[p.id] = {
        id: p.id,
        name: p.name,
        x: 1,
        z: startZ[p.id] ?? 0,
        rotY: 0,
        vx: 0,
        vz: 0,
        stunUntil: 0,
        finishedMs: null,
      };
    });
    return init;
  });

  const [projectiles, setProjectiles] = useState<ProjectileT[]>([]);
  const projectilesRef = useRef<ProjectileT[]>([]);
  projectilesRef.current = projectiles;
  const playersRef = useRef(players);
  playersRef.current = players;
  const [harpoons, setHarpoons] = useState<HarpoonShot[]>([]);
  const harpoonsRef = useRef<HarpoonShot[]>([]);
  harpoonsRef.current = harpoons;

  const handlePos = (p: RemotePos) => {
    setPlayers((prev) => {
      const cur = prev[p.id];
      if (cur) return { ...prev, [p.id]: { ...cur, ...p } };
      // Late-arriving player — register them with what we know.
      return {
        ...prev,
        [p.id]: {
          id: p.id,
          name: nameMap[p.id] ?? "Player",
          x: p.x,
          z: p.z,
          rotY: p.rotY,
          vx: p.vx,
          vz: p.vz,
          stunUntil: p.stunUntil,
          finishedMs: p.finishedMs,
        },
      };
    });
  };

  const handleEvent = (e: GameEvent) => {
    if (e.type === "throw") {
      setProjectiles((prev) => {
        if (prev.some((p) => p.id === e.projectileId)) return prev;
        return [...prev, { id: e.projectileId, ownerId: e.ownerId, x: e.x, z: e.z, vx: e.vx, vz: e.vz, bornAt: e.bornAt }];
      });
      playSfx("throw");
    } else if (e.type === "stun") {
      setPlayers((prev) => {
        const cur = prev[e.targetId];
        if (!cur) return prev;
        return { ...prev, [e.targetId]: { ...cur, stunUntil: e.until, vx: 0, vz: 0 } };
      });
      // Stun events are only broadcast on stone (throw) hits. Play the
      // "malupiton" taunt only for the unlucky person who got hit.
      if (e.targetId === selfId) playSfx("malupiton", 1.0);
    } else if (e.type === "harpoon") {
      const now = Date.now();
      const target = playersRef.current[e.targetId];
      const toX = target?.x ?? e.ownerX;
      const toZ = target?.z ?? e.ownerZ;
      // Stun the target for the pull window — they can't move during the
      // animation. We don't teleport them; the pull animates their x.
      setPlayers((prev) => {
        const cur = prev[e.targetId];
        if (!cur) return prev;
        return { ...prev, [e.targetId]: { ...cur, vx: 0, vz: 0, stunUntil: now + HARPOON_STUN_MS } };
      });
      // If we're the one being pulled, set up the local pull animation.
      if (e.targetId === selfId && target) {
        pullRef.current = {
          startMs: now,
          endMs: now + HARPOON_STUN_MS,
          fromX: target.x,
          toX: Math.max(0, target.x - HARPOON_PULL_BACK),
        };
      }
      playSfx("harpoon");
      setHarpoons((prev) => [
        ...prev,
        { id: `${e.ownerId}-${now}`, fromX: e.ownerX, fromZ: e.ownerZ, toX, toZ, bornAt: now },
      ]);
    } else if (e.type === "finish") {
      setPlayers((prev) => {
        const cur = prev[e.playerId];
        if (!cur) return prev;
        return { ...prev, [e.playerId]: { ...cur, finishedMs: e.finishMs } };
      });
    }
  };

  const { sendPos, sendEvent } = useGameChannel(code, selfId, handlePos, handleEvent);

  useFrame(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000);
    lastFrameRef.current = now;

    const wallclockNow = Date.now();
    // In lobby, players can always move freely — treat it as "always racing".
    const racing = lobbyMode || (wallclockNow >= startsAt && wallclockNow < endsAt);

    const self = playersRef.current[selfId];
    if (!self) return;

    // ── Self physics ─────────────────────────────────────────────
    const stunned = self.stunUntil > wallclockNow;
    const input = inputRef.current;
    let { rotY, x, z, vx, vz } = self;

    // Active harpoon pull on self — overrides input physics.
    const pull = pullRef.current;
    const isPulling = pull != null && wallclockNow < pull.endMs;

    if (isPulling && pull) {
      const t = Math.min(1, (wallclockNow - pull.startMs) / (pull.endMs - pull.startMs));
      // ease-out: starts fast, decelerates as we reach the destination
      const eased = 1 - Math.pow(1 - t, 2);
      x = pull.fromX + (pull.toX - pull.fromX) * eased;
      vx = 0;
      vz = 0;
    } else if (racing && !stunned && self.finishedMs == null) {
      rotY += -input.turn * TURN_RATE * dt;
      const fwdX = Math.cos(rotY);
      const fwdZ = -Math.sin(rotY);
      if (input.forward !== 0) {
        vx += fwdX * input.forward * ACCEL * dt;
        vz += fwdZ * input.forward * ACCEL * dt;
      } else {
        vx -= vx * Math.min(1, FRICTION * dt);
        vz -= vz * Math.min(1, FRICTION * dt);
      }
    } else {
      if (pull && wallclockNow >= pull.endMs) pullRef.current = null;
      vx -= vx * Math.min(1, FRICTION * 2 * dt);
      vz -= vz * Math.min(1, FRICTION * 2 * dt);
    }

    const speed = Math.hypot(vx, vz);
    if (speed > MAX_SPEED) {
      vx = (vx / speed) * MAX_SPEED;
      vz = (vz / speed) * MAX_SPEED;
    }

    // ── Substep movement + collision ───────────────────────────────
    // Split the frame into sub-steps so even max-speed movement can't
    // tunnel through a thin obstacle in a single frame.
    const halfW = TRACK_WIDTH / 2 - PLAYER_RADIUS;
    const moveDist = Math.hypot(vx * dt, vz * dt);
    const STEP = 0.25;
    const steps = Math.max(1, Math.ceil(moveDist / STEP));
    const sx = (vx * dt) / steps;
    const sz = (vz * dt) / steps;
    for (let s = 0; s < steps; s++) {
      x += sx;
      z += sz;
      if (x < 0) { x = 0; vx = 0; }
      if (x > TRACK_LENGTH + 4) { x = TRACK_LENGTH + 4; }
      if (z < -halfW) { z = -halfW; vz = 0; }
      if (z > halfW) { z = halfW; vz = 0; }
      for (const o of OBSTACLES) {
        const dx = x - o.cx;
        const dz = z - o.cz;
        const limX = o.hw + PLAYER_RADIUS;
        const limZ = o.hd + PLAYER_RADIUS;
        if (Math.abs(dx) < limX && Math.abs(dz) < limZ) {
          const overlapX = limX - Math.abs(dx);
          const overlapZ = limZ - Math.abs(dz);
          if (overlapX < overlapZ) {
            x = o.cx + Math.sign(dx || 1) * limX;
            vx = 0;
          } else {
            z = o.cz + Math.sign(dz || 1) * limZ;
            vz = 0;
          }
        }
      }

      // ── Soft bump against other players ──────────────────────────
      // Each client only pushes itself out of others; the other client
      // does the same on its end. Keeps the model client-authoritative.
      const bumpRadius = PLAYER_RADIUS * 2;
      for (const otherId in playersRef.current) {
        if (otherId === selfId) continue;
        const other = playersRef.current[otherId];
        if (other.finishedMs != null) continue;
        const dx = x - other.x;
        const dz = z - other.z;
        const dist = Math.hypot(dx, dz);
        if (dist < bumpRadius && dist > 0.001) {
          const push = bumpRadius - dist;
          x += (dx / dist) * push;
          z += (dz / dist) * push;
          // Take the speed sting out so head-on collisions don't immediately
          // re-overlap on the next frame.
          vx *= 0.6;
          vz *= 0.6;
        }
      }

    }

    if (!lobbyMode && !finishedRef.current && x >= TRACK_LENGTH && self.finishedMs == null) {
      finishedRef.current = true;
      const finishMs = Date.now() - startsAt;
      console.log(`[race] CROSSED FINISH @ x=${x.toFixed(1)} finishMs=${finishMs}`);
      sendEvent({ type: "finish", playerId: selfId, finishMs });
      handleEvent({ type: "finish", playerId: selfId, finishMs });
      onFinish(finishMs);
    }

    const newSelf: PlayerState = { ...self, x, z, rotY, vx, vz };
    playersRef.current = { ...playersRef.current, [selfId]: newSelf };
    setPlayers((prev) => ({ ...prev, [selfId]: newSelf }));

    const broadcastInterval = 1000 / POSITION_BROADCAST_HZ;
    if (now - lastBroadcastRef.current >= broadcastInterval) {
      lastBroadcastRef.current = now;
      sendPos({
        id: selfId,
        x: newSelf.x,
        z: newSelf.z,
        rotY: newSelf.rotY,
        vx: newSelf.vx,
        vz: newSelf.vz,
        stunUntil: newSelf.stunUntil,
        finishedMs: newSelf.finishedMs,
      });
    }

    // ── Skill: throw (rising-edge from inputRef) ─────────────────
    const triggers = skillTriggerRef.current;
    if (triggers.throw && triggers.throw > lastThrowTriggerRef.current) {
      lastThrowTriggerRef.current = triggers.throw;
      const cdReady = wallclockNow - lastThrowFiredRef.current >= SKILL_COOLDOWN_MS;
      if (cdReady && !stunned && self.finishedMs == null) {
        lastThrowFiredRef.current = wallclockNow;
        const fwdX = Math.cos(self.rotY);
        const fwdZ = -Math.sin(self.rotY);
        const projId = `${selfId}-${wallclockNow}`;
        const proj: ProjectileT = {
          id: projId,
          ownerId: selfId,
          x: self.x + fwdX * 1.2,
          z: self.z + fwdZ * 1.2,
          vx: fwdX * PROJECTILE_SPEED,
          vz: fwdZ * PROJECTILE_SPEED,
          bornAt: wallclockNow,
        };
        setProjectiles((prev) => [...prev, proj]);
        sendEvent({
          type: "throw",
          ownerId: selfId,
          projectileId: projId,
          x: proj.x,
          z: proj.z,
          vx: proj.vx,
          vz: proj.vz,
          bornAt: proj.bornAt,
        });
      }
    }

    // ── Skill: harpoon ───────────────────────────────────────────
    if (triggers.harpoon && triggers.harpoon > lastHarpoonTriggerRef.current) {
      lastHarpoonTriggerRef.current = triggers.harpoon;
      const cdReady = wallclockNow - lastHarpoonFiredRef.current >= SKILL_COOLDOWN_MS;
      if (cdReady && !stunned && self.finishedMs == null) {
        const fwdX = Math.cos(self.rotY);
        const fwdZ = -Math.sin(self.rotY);
        const halfCone = (HARPOON_CONE_DEG * Math.PI) / 360;
        let bestId: string | null = null;
        let bestDist = HARPOON_RANGE;
        Object.values(playersRef.current).forEach((other) => {
          if (other.id === selfId || other.finishedMs != null) return;
          const dx = other.x - self.x;
          const dz = other.z - self.z;
          const dist = Math.hypot(dx, dz);
          if (dist > HARPOON_RANGE || dist < 0.1) return;
          const dot = (dx * fwdX + dz * fwdZ) / dist;
          const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
          if (angle > halfCone) return;
          if (dist < bestDist) { bestDist = dist; bestId = other.id; }
        });
        if (bestId) {
          lastHarpoonFiredRef.current = wallclockNow;
          const ev: GameEvent = {
            type: "harpoon",
            ownerId: selfId,
            targetId: bestId,
            ownerX: self.x,
            ownerZ: self.z,
          };
          handleEvent(ev);
          sendEvent(ev);
        }
      }
    }

    // Cooldown UI
    onCooldown({
      throw: Math.max(0, SKILL_COOLDOWN_MS - (wallclockNow - lastThrowFiredRef.current)),
      harpoon: Math.max(0, SKILL_COOLDOWN_MS - (wallclockNow - lastHarpoonFiredRef.current)),
    });

    // ── Projectiles: prune expired + collide self ────────────────
    if (projectilesRef.current.length > 0) {
      const next: ProjectileT[] = [];
      const stunsToBroadcast: { targetId: string }[] = [];
      for (const proj of projectilesRef.current) {
        const age = wallclockNow - proj.bornAt;
        if (age > PROJECTILE_LIFETIME_MS) continue;
        const t = age / 1000;
        const curX = proj.x + proj.vx * t;
        const curZ = proj.z + proj.vz * t;
        if (curX < -2 || curX > TRACK_LENGTH + 4 || Math.abs(curZ) > TRACK_WIDTH / 2 + 1) continue;
        if (proj.ownerId !== selfId) {
          const meState = playersRef.current[selfId];
          if (meState && meState.stunUntil <= wallclockNow && meState.finishedMs == null) {
            const dx = curX - meState.x;
            const dz = curZ - meState.z;
            if (Math.hypot(dx, dz) < PROJECTILE_HIT_RADIUS) {
              stunsToBroadcast.push({ targetId: selfId });
              continue;
            }
          }
        }
        next.push(proj);
      }
      if (next.length !== projectilesRef.current.length) setProjectiles(next);
      stunsToBroadcast.forEach(({ targetId }) => {
        const until = Date.now() + STUN_DURATION_MS;
        handleEvent({ type: "stun", targetId, until });
        sendEvent({ type: "stun", targetId, until });
      });
    }

    // ── Harpoon line cleanup ─────────────────────────────────────
    if (harpoonsRef.current.length > 0) {
      const fresh = harpoonsRef.current.filter((h) => wallclockNow - h.bornAt < HARPOON_LINE_LIFETIME_MS);
      if (fresh.length !== harpoonsRef.current.length) setHarpoons(fresh);
    }

    // ── Camera follow ────────────────────────────────────────────
    const fwdX = Math.cos(newSelf.rotY);
    const fwdZ = -Math.sin(newSelf.rotY);
    // Lobby: pull the camera further back + higher so players can see more of
    // the track and other characters while warming up.
    const camDist = lobbyMode ? 14 : 8;
    const camHeight = lobbyMode ? 10 : 6;
    const camTarget = new THREE.Vector3(newSelf.x - fwdX * camDist, camHeight, newSelf.z - fwdZ * camDist);
    camera.position.lerp(camTarget, 0.12);
    camera.lookAt(newSelf.x + fwdX * 4, 1.5, newSelf.z + fwdZ * 4);

    // ── Lap reporting ────────────────────────────────────────────
    const ranked = Object.values(playersRef.current).sort((a, b) => {
      if (a.finishedMs != null && b.finishedMs != null) return a.finishedMs - b.finishedMs;
      if (a.finishedMs != null) return -1;
      if (b.finishedMs != null) return 1;
      return b.x - a.x;
    });
    const place = ranked.findIndex((p) => p.id === selfId) + 1;
    onLap({ distance: newSelf.x, place });
  });

  return (
    <>
      {Object.values(players).map((p) => (
        <PlayerMesh
          key={p.id}
          id={p.id}
          name={p.name}
          characterId={characterMap[p.id] ?? null}
          x={p.x}
          z={p.z}
          rotY={p.rotY}
          stunUntil={p.stunUntil}
          avatarUrl={avatarMap[p.id] ?? null}
          isSelf={p.id === selfId}
        />
      ))}
      {projectiles.map((proj) => (
        <Projectile
          key={proj.id}
          x0={proj.x}
          z0={proj.z}
          vx={proj.vx}
          vz={proj.vz}
          bornAt={proj.bornAt}
        />
      ))}
      {harpoons.map((h) => (
        <HarpoonLine
          key={h.id}
          fromX={h.fromX}
          fromZ={h.fromZ}
          toX={h.toX}
          toZ={h.toZ}
        />
      ))}
    </>
  );
}

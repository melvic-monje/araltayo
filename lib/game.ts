// Track dimensions and game tuning constants.
// Coordinates: track runs along +X (start at x=0, finish at x=TRACK_LENGTH).
// Z is left/right, Y is up.

export const TRACK_LENGTH = 300;
export const TRACK_WIDTH = 18;
export const PLAYER_RADIUS = 0.6;

/**
 * Static obstacles placed along the track. Each is an axis-aligned box
 * (cx, cz center, with half-extents hw on x, hd on z). The first 20 units
 * are kept clear so spawn lanes don't collide.
 */
export type Obstacle = {
  cx: number;
  cz: number;
  hw: number;   // half-width along x
  hd: number;   // half-depth along z
  height: number;
};

const OB_HEIGHT = 1.6;

export const OBSTACLES: Obstacle[] = [
  // First test — pillar slightly left
  { cx: 60,  cz: -2.0, hw: 1.4, hd: 1.4, height: OB_HEIGHT },

  // Side wall sticking in from the right
  { cx: 110, cz:  3.0, hw: 1.0, hd: 3.0, height: OB_HEIGHT },

  // Center wall — must pick a side
  { cx: 155, cz:  0,   hw: 1.0, hd: 3.0, height: OB_HEIGHT },

  // Side wall from the left
  { cx: 200, cz: -3.0, hw: 1.0, hd: 3.0, height: OB_HEIGHT },

  // Tight gate (two pillars, narrow gap in the middle)
  { cx: 240, cz: -2.5, hw: 1.2, hd: 1.2, height: OB_HEIGHT },
  { cx: 240, cz:  2.5, hw: 1.2, hd: 1.2, height: OB_HEIGHT },

  // Final pillar before finish line
  { cx: 280, cz:  1.5, hw: 1.4, hd: 1.4, height: OB_HEIGHT },
];
export const MAX_SPEED = 14;          // units per second
export const ACCEL = 30;              // units / s^2
export const TURN_RATE = 3.0;         // radians per second
export const FRICTION = 6;            // velocity decay per second when not accelerating

export const SKILL_COOLDOWN_MS = 3000;
export const STUN_DURATION_MS = 2000;

export const PROJECTILE_SPEED = 28;   // throw speed
export const PROJECTILE_LIFETIME_MS = 1200;
export const PROJECTILE_HIT_RADIUS = 1.6;

export const HARPOON_RANGE = 30;
export const HARPOON_CONE_DEG = 30;
export const HARPOON_PULL_BACK = 12;  // units the target gets dragged back
export const HARPOON_LINE_LIFETIME_MS = 500;
export const HARPOON_STUN_MS = 1200;  // stun + animated pull duration

export const POSITION_BROADCAST_HZ = 12;

// Mines — deterministic per-room, scattered between the spawn area and the finish.
export const MINE_COUNT = 8;
export const MINE_HIT_RADIUS = 1.0;
export const MINE_STUN_MS = 1500;

export type Mine = { id: string; x: number; z: number };

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function generateMines(seed: string): Mine[] {
  const rnd = mulberry32(hashString(seed));
  const mines: Mine[] = [];
  const halfW = TRACK_WIDTH / 2 - PLAYER_RADIUS - 0.5;
  for (let i = 0; i < MINE_COUNT; i++) {
    const x = 25 + rnd() * (TRACK_LENGTH - 55);
    const z = (rnd() * 2 - 1) * halfW;
    mines.push({ id: `mine-${i}`, x, z });
  }
  return mines;
}

export type PlayerInput = {
  forward: number;   // -1, 0, 1
  turn: number;      // -1, 0, 1
};

export type PlayerState = {
  id: string;
  name: string;
  x: number;
  z: number;
  rotY: number;      // facing direction in radians (0 = +X)
  vx: number;
  vz: number;
  stunUntil: number; // epoch ms; 0 means not stunned
  finishedMs: number | null;
};

export type Projectile = {
  id: string;
  ownerId: string;
  x: number;
  z: number;
  vx: number;
  vz: number;
  bornAt: number;
};

export type ThrowEvent = {
  type: "throw";
  ownerId: string;
  x: number;
  z: number;
  vx: number;
  vz: number;
  bornAt: number;
  projectileId: string;
};

export type StunEvent = {
  type: "stun";
  targetId: string;
  until: number;
};

export type HarpoonEvent = {
  type: "harpoon";
  ownerId: string;
  targetId: string;
  ownerX: number;
  ownerZ: number;
};

export type FinishEvent = {
  type: "finish";
  playerId: string;
  finishMs: number;
};

export type MineHitEvent = {
  type: "mine";
  mineId: string;
  hitterId: string;
};

export type GameEvent = ThrowEvent | StunEvent | HarpoonEvent | FinishEvent | MineHitEvent;

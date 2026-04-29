// Track dimensions and game tuning constants.
// Coordinates: track runs along +X (start at x=0, finish at x=TRACK_LENGTH).
// Z is left/right, Y is up.

export const TRACK_LENGTH = 200;
export const TRACK_WIDTH = 16;
export const PLAYER_RADIUS = 0.6;
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
export const HARPOON_PULL_BACK = 12;  // units to push target backward
export const HARPOON_LINE_LIFETIME_MS = 500;

export const POSITION_BROADCAST_HZ = 12;

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

export type GameEvent = ThrowEvent | StunEvent | HarpoonEvent | FinishEvent;

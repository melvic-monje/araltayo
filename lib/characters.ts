export const CHARACTER_IDS = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i",
  "j", "k", "l", "m", "n", "o", "p", "q", "r",
] as const;

export type CharacterId = typeof CHARACTER_IDS[number];

export function characterModelPath(id: string): string {
  return `/characters/character-${id}.glb`;
}

export function isCharacterId(s: string | null | undefined): s is CharacterId {
  return !!s && (CHARACTER_IDS as readonly string[]).includes(s);
}

export const DEFAULT_CHARACTER: CharacterId = "a";

const PALETTE = [
  { color: "#F472B6", emoji: "🚀" },
  { color: "#60A5FA", emoji: "🦄" },
  { color: "#FBBF24", emoji: "🐎" },
  { color: "#34D399", emoji: "🐢" },
  { color: "#A78BFA", emoji: "🐉" },
  { color: "#F87171", emoji: "🦊" },
  { color: "#22D3EE", emoji: "🐬" },
  { color: "#FB923C", emoji: "🦁" },
  { color: "#C084FC", emoji: "🐙" },
  { color: "#4ADE80", emoji: "🐸" },
  { color: "#F59E0B", emoji: "🦅" },
  { color: "#E879F9", emoji: "🦋" },
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function avatarFor(playerId: string) {
  return PALETTE[hash(playerId) % PALETTE.length];
}

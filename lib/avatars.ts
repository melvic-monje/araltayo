// 20 avatar options — each is an emoji + gradient combo
// Stored as an ID string in the database, rendered client-side

export interface AvatarDef {
  id: string;
  emoji: string;
  bg: string; // CSS gradient
}

export const AVATARS: AvatarDef[] = [
  { id: "default", emoji: "📚", bg: "linear-gradient(135deg,#6721FF,#00CBFF)" },
  { id: "star", emoji: "⭐", bg: "linear-gradient(135deg,#FDCF6D,#f97316)" },
  { id: "rocket", emoji: "🚀", bg: "linear-gradient(135deg,#6721FF,#ec4899)" },
  { id: "brain", emoji: "🧠", bg: "linear-gradient(135deg,#ec4899,#a855f7)" },
  { id: "fire", emoji: "🔥", bg: "linear-gradient(135deg,#ef4444,#f97316)" },
  { id: "lightning", emoji: "⚡", bg: "linear-gradient(135deg,#FDCF6D,#00CBFF)" },
  { id: "heart", emoji: "💜", bg: "linear-gradient(135deg,#a855f7,#6721FF)" },
  { id: "diamond", emoji: "💎", bg: "linear-gradient(135deg,#00CBFF,#6721FF)" },
  { id: "music", emoji: "🎵", bg: "linear-gradient(135deg,#00C39A,#00CBFF)" },
  { id: "crown", emoji: "👑", bg: "linear-gradient(135deg,#FDCF6D,#ef4444)" },
  { id: "globe", emoji: "🌍", bg: "linear-gradient(135deg,#00C39A,#3b82f6)" },
  { id: "art", emoji: "🎨", bg: "linear-gradient(135deg,#ec4899,#FDCF6D)" },
  { id: "code", emoji: "💻", bg: "linear-gradient(135deg,#3b82f6,#6721FF)" },
  { id: "atom", emoji: "⚛️", bg: "linear-gradient(135deg,#00CBFF,#00C39A)" },
  { id: "moon", emoji: "🌙", bg: "linear-gradient(135deg,#1e1b4b,#6721FF)" },
  { id: "sun", emoji: "☀️", bg: "linear-gradient(135deg,#FDCF6D,#f97316)" },
  { id: "plant", emoji: "🌱", bg: "linear-gradient(135deg,#00C39A,#22c55e)" },
  { id: "cat", emoji: "🐱", bg: "linear-gradient(135deg,#f97316,#FDCF6D)" },
  { id: "panda", emoji: "🐼", bg: "linear-gradient(135deg,#374151,#6b7280)" },
  { id: "butterfly", emoji: "🦋", bg: "linear-gradient(135deg,#a855f7,#00CBFF)" },
];

export function getAvatar(id: string): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

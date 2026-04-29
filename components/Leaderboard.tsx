"use client";

import { avatarFor } from "@/lib/avatars";
import type { Player } from "@/lib/supabase";

export default function Leaderboard({ players }: { players: Player[] }) {
  const ranked = [...players].sort((a, b) => {
    const af = (a as Player & { finish_ms?: number | null }).finish_ms;
    const bf = (b as Player & { finish_ms?: number | null }).finish_ms;
    if (af != null && bf != null) return af - bf;
    if (af != null) return -1;
    if (bf != null) return 1;
    return 0;
  });

  return (
    <div className="space-y-2">
      {ranked.map((p, i) => {
        const avatar = avatarFor(p.id);
        const finishMs = (p as Player & { finish_ms?: number | null }).finish_ms;
        const time = finishMs != null ? `${(finishMs / 1000).toFixed(2)}s` : "DNF";
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
        const avatarUrl = (p as Player & { avatar_url?: string | null }).avatar_url;
        return (
          <div
            key={p.id}
            className="flex items-center gap-4 rounded-2xl px-4 py-3 border"
            style={{
              background: i === 0 && finishMs != null ? `${avatar.color}22` : "rgba(255,255,255,0.04)",
              borderColor: i === 0 && finishMs != null ? avatar.color : "rgba(255,255,255,0.1)",
              boxShadow: i === 0 && finishMs != null ? `0 0 32px ${avatar.color}44` : "none",
            }}
          >
            <span className="text-2xl font-extrabold w-12 text-center">{medal}</span>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <span className="text-3xl">{avatar.emoji}</span>
            )}
            <span className="font-bold flex-1 truncate">{p.name}</span>
            <div className="text-right">
              <div className="text-2xl font-extrabold font-mono" style={{ color: finishMs != null ? avatar.color : "#94A3B8" }}>
                {time}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getSupabase, type Room, type Player } from "./supabase";

export function useRoom(code: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    const supabase = getSupabase();
    let mounted = true;

    async function load() {
      const [{ data: r, error: re }, { data: ps, error: pe }] = await Promise.all([
        supabase.from("rooms").select("*").eq("code", code).maybeSingle(),
        supabase.from("players").select("*").eq("room_code", code).order("joined_at"),
      ]);
      if (!mounted) return;
      if (re || pe) {
        setError((re ?? pe)?.message ?? "Failed to load room");
        return;
      }
      setRoom((r as Room | null) ?? null);
      setPlayers((ps as Player[]) ?? []);
    }
    load();

    const channel = supabase
      .channel(`room:${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        (payload) => {
          if (payload.eventType === "DELETE") setRoom(null);
          else setRoom(payload.new as Room);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_code=eq.${code}` },
        (payload) => {
          setPlayers((prev) => {
            if (payload.eventType === "INSERT") {
              const p = payload.new as Player;
              if (prev.some((x) => x.id === p.id)) return prev;
              return [...prev, p].sort((a, b) => a.joined_at.localeCompare(b.joined_at));
            }
            if (payload.eventType === "UPDATE") {
              const p = payload.new as Player;
              return prev.map((x) => (x.id === p.id ? p : x));
            }
            if (payload.eventType === "DELETE") {
              const p = payload.old as Player;
              return prev.filter((x) => x.id !== p.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [code]);

  return { room, players, error, setRoom, setPlayers };
}

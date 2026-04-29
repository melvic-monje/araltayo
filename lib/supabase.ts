"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  _client = createClient(url, key, {
    realtime: { params: { eventsPerSecond: 20 } },
  });
  return _client;
}

export type Room = {
  code: string;
  host_id: string;
  status: "lobby" | "racing" | "finished";
  race_starts_at: string | null;
  race_ends_at: string | null;
  created_at: string;
};

export type Player = {
  id: string;
  room_code: string;
  name: string;
  press_count: number;
  joined_at: string;
  avatar_url?: string | null;
  finish_ms?: number | null;
  finished_at?: string | null;
  rank?: number | null;
};

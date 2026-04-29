"use client";

import { useEffect, useRef } from "react";
import { getSupabase } from "./supabase";
import type { GameEvent, PlayerState } from "./game";

export type RemotePos = Pick<PlayerState, "id" | "x" | "z" | "rotY" | "vx" | "vz" | "stunUntil" | "finishedMs">;

export function useGameChannel(
  code: string | null,
  selfId: string | null,
  onPos: (p: RemotePos) => void,
  onEvent: (e: GameEvent) => void
) {
  const onPosRef = useRef(onPos);
  const onEventRef = useRef(onEvent);
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>["channel"]> | null>(null);
  const joinedRef = useRef(false);
  const sentCountRef = useRef(0);

  useEffect(() => { onPosRef.current = onPos; }, [onPos]);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    if (!code || !selfId) return;
    const supabase = getSupabase();
    console.log(`[race] subscribing race:${code} (self=${selfId.slice(0, 8)})`);
    const channel = supabase.channel(`race:${code}`, {
      config: { broadcast: { self: false, ack: false } },
    });

    let posRxCount = 0;
    channel
      .on("broadcast", { event: "pos" }, ({ payload }) => {
        const p = payload as RemotePos;
        posRxCount++;
        if (posRxCount === 1 || posRxCount % 30 === 0) {
          console.log(`[race] pos rx #${posRxCount} from ${p.id.slice(0, 8)} → ${p.id !== selfId ? "applied" : "DROPPED-same-id"}`);
        }
        if (p.id !== selfId) onPosRef.current(p);
      })
      .on("broadcast", { event: "ev" }, ({ payload }) => {
        console.log("[race] event rx", payload);
        onEventRef.current(payload as GameEvent);
      })
      .subscribe((status, err) => {
        console.log(`[race] channel status: ${status}`, err ?? "");
        joinedRef.current = status === "SUBSCRIBED";
      });

    channelRef.current = channel;
    return () => {
      joinedRef.current = false;
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [code, selfId]);

  function sendPos(p: RemotePos) {
    if (!joinedRef.current) return;
    sentCountRef.current++;
    if (sentCountRef.current === 1 || sentCountRef.current % 30 === 0) {
      console.log(`[race] pos tx #${sentCountRef.current}`);
    }
    channelRef.current?.send({ type: "broadcast", event: "pos", payload: p });
  }
  function sendEvent(e: GameEvent) {
    if (!joinedRef.current) return;
    console.log("[race] event tx", e.type);
    channelRef.current?.send({ type: "broadcast", event: "ev", payload: e });
  }

  return { sendPos, sendEvent };
}

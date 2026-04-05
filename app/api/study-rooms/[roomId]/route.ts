import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET /api/study-rooms/[roomId]
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: room, error } = await supabase
    .from("study_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (error || !room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json({ room });
}

// PATCH /api/study-rooms/[roomId]
// { action: "join", partnerName, roomCode? }
// { action: "end" }
// { action: "notes", content }
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "join") {
    const { data: existing } = await supabase
      .from("study_rooms")
      .select("is_private, room_code, status, partner_id, host_id")
      .eq("id", roomId)
      .single();

    if (!existing) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (existing.status !== "waiting") return NextResponse.json({ error: "Room is no longer available." }, { status: 409 });
    if (existing.host_id === user.id) return NextResponse.json({ error: "Cannot join your own room." }, { status: 400 });
    if (existing.is_private && existing.room_code !== body.roomCode) {
      return NextResponse.json({ error: "Invalid room code." }, { status: 403 });
    }

    const { data: room, error } = await supabase
      .from("study_rooms")
      .update({
        partner_id: user.id,
        partner_name: body.partnerName,
        status: "active",
      })
      .eq("id", roomId)
      .eq("status", "waiting")
      .is("partner_id", null)
      .select()
      .single();

    if (error || !room) return NextResponse.json({ error: "Cannot join room" }, { status: 409 });
    return NextResponse.json({ room });
  }

  if (body.action === "end") {
    const { data: room, error } = await supabase
      .from("study_rooms")
      .update({ status: "ended" })
      .eq("id", roomId)
      .or(`host_id.eq.${user.id},partner_id.eq.${user.id}`)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ room });
  }

  if (body.action === "notes") {
    const { error } = await supabase
      .from("study_rooms")
      .update({ shared_notes: body.content ?? "" })
      .eq("id", roomId)
      .or(`host_id.eq.${user.id},partner_id.eq.${user.id}`);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "kick") {
    const kickUserId = body.userId;
    if (!kickUserId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    // Only host can kick
    const { data: room } = await supabase
      .from("study_rooms")
      .select("host_id, members")
      .eq("id", roomId)
      .single();

    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.host_id !== user.id) return NextResponse.json({ error: "Only the room creator can kick members." }, { status: 403 });

    const members = (room.members as Array<{ id: string; name: string; gender: string | null }>)
      .filter((m) => m.id !== kickUserId);

    const updates: Record<string, unknown> = { members };
    // If kicking the partner (2-person legacy), clear partner fields
    const { data: roomFull } = await supabase
      .from("study_rooms")
      .select("partner_id")
      .eq("id", roomId)
      .single();
    if (roomFull?.partner_id === kickUserId) {
      updates.partner_id = null;
      updates.partner_name = null;
      updates.status = "waiting";
    }

    const { error } = await supabase
      .from("study_rooms")
      .update(updates)
      .eq("id", roomId)
      .eq("host_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, kicked: kickUserId });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// POST — used by sendBeacon on page unload
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("study_rooms")
    .update({ status: "ended" })
    .eq("id", roomId)
    .or(`host_id.eq.${user.id},partner_id.eq.${user.id}`);

  return NextResponse.json({ ok: true });
}

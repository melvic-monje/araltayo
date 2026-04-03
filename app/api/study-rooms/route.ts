import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// GET /api/study-rooms
// ?subject=Math  — filter by subject
// ?code=XXXXXX   — find private room by code
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const subject = searchParams.get("subject");

  // Private room lookup by code
  if (code) {
    const { data: room, error } = await supabase
      .from("study_rooms")
      .select("id, topic, host_id, host_name, partner_id, status, is_private, room_code, subject")
      .eq("room_code", code.toUpperCase())
      .eq("is_private", true)
      .single();

    if (error || !room) return NextResponse.json({ error: "Room not found or code is invalid." }, { status: 404 });
    if (room.status !== "waiting") return NextResponse.json({ error: "This room is no longer available." }, { status: 409 });
    if (room.host_id === user.id) return NextResponse.json({ error: "That's your own room." }, { status: 400 });
    return NextResponse.json({ room });
  }

  // Public lobby listing — exclude private rooms
  let query = supabase
    .from("study_rooms")
    .select("id, topic, host_name, status, subject, is_private, created_at")
    .eq("status", "waiting")
    .eq("is_private", false)
    .neq("host_id", user.id)
    .order("created_at", { ascending: false });

  if (subject) query = query.eq("subject", subject);

  const { data: rooms, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rooms });
}

// POST /api/study-rooms — create a room
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, subject, is_private } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  // End any existing waiting rooms by this user
  await supabase
    .from("study_rooms")
    .update({ status: "ended" })
    .eq("host_id", user.id)
    .eq("status", "waiting");

  const roomCode = is_private ? generateRoomCode() : null;

  const { data: room, error } = await supabase
    .from("study_rooms")
    .insert({
      topic: topic.trim(),
      host_id: user.id,
      host_name: profile?.display_name ?? "Unknown",
      subject: subject || null,
      is_private: !!is_private,
      room_code: roomCode,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ room }, { status: 201 });
}

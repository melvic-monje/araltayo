import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET /api/study-rooms — list waiting rooms (excluding current user's)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rooms, error } = await supabase
    .from("study_rooms")
    .select("id, topic, host_name, status, created_at")
    .eq("status", "waiting")
    .neq("host_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rooms });
}

// POST /api/study-rooms — create a room
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  // End any existing waiting rooms by this user first
  await supabase
    .from("study_rooms")
    .update({ status: "ended" })
    .eq("host_id", user.id)
    .eq("status", "waiting");

  const { data: room, error } = await supabase
    .from("study_rooms")
    .insert({
      topic: topic.trim(),
      host_id: user.id,
      host_name: profile?.display_name ?? "Unknown",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ room }, { status: 201 });
}

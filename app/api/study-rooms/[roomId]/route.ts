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
// body: { action: "join", partnerName: string } | { action: "end" }
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
      .neq("host_id", user.id)
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

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// POST /api/study-rooms/[roomId] — used by sendBeacon on page unload (always ends room)
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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-server";
import { regexScreen, semanticScreen, type ScreenResult } from "@/lib/message-screener";
import { createHash } from "crypto";
import { Resend } from "resend";

// POST /api/study-rooms/[roomId]/screen
// Body: { message: string }
// Returns: { ok: true } or { ok: false, reason: string, strike: number, banned?: boolean }

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const admin = createServiceClient();

  // ── Check if user is currently banned ──
  const { data: strikeData } = await admin
    .from("session_strikes")
    .select("strikes, banned_until")
    .eq("user_id", user.id)
    .eq("room_id", roomId)
    .single();

  if (strikeData?.banned_until) {
    const bannedUntil = new Date(strikeData.banned_until);
    if (bannedUntil > new Date()) {
      return NextResponse.json({
        ok: false,
        reason: "Na-ban ka pansamantala dahil sa paulit-ulit na paglabag. Subukan ulit mamaya.",
        strike: strikeData.strikes,
        banned: true,
      });
    }
  }

  // ── Layer 1: Regex ──
  const regexResult = regexScreen(message);
  if (!regexResult.ok) {
    return await handleViolation(admin, user.id, roomId, message, regexResult);
  }

  // ── Layer 2: Semantic (paused — enable when ready) ──
  // if (message.length > 20) {
  //   const semanticResult = await semanticScreen(message);
  //   if (!semanticResult.ok) {
  //     return await handleViolation(admin, user.id, roomId, message, semanticResult);
  //   }
  // }

  return NextResponse.json({ ok: true });
}

// ── Strike handler ──

async function handleViolation(
  admin: ReturnType<typeof createServiceClient>,
  userId: string,
  roomId: string,
  message: string,
  result: ScreenResult & { ok: false }
) {
  const messageHash = createHash("sha256").update(message).digest("hex");

  // Upsert strike count
  const { data: existing } = await admin
    .from("session_strikes")
    .select("strikes")
    .eq("user_id", userId)
    .eq("room_id", roomId)
    .single();

  const newStrikes = (existing?.strikes ?? 0) + 1;
  let action: string;
  let banned = false;
  let bannedUntil: string | null = null;

  if (newStrikes === 1) {
    action = "warn";
  } else if (newStrikes === 2) {
    action = "strong_warn";
  } else {
    action = "ban_24h";
    banned = true;
    bannedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  // Upsert session_strikes
  await admin
    .from("session_strikes")
    .upsert({
      user_id: userId,
      room_id: roomId,
      strikes: newStrikes,
      banned_until: bannedUntil,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,room_id" });

  // Log violation (hash only, never raw text)
  await admin.from("violation_logs").insert({
    user_id: userId,
    room_id: roomId,
    message_hash: messageHash,
    layer: result.layer,
    rule_matched: result.rule,
    strike_number: newStrikes,
    action_taken: action,
  });

  // On 3rd strike: if minor, email parent
  if (newStrikes >= 3) {
    await notifyParentIfMinor(admin, userId);
  }

  // Build response reason
  let reason: string;
  if (newStrikes === 1) {
    reason = `⚠️ ${result.reason} Ito ang unang warning mo. Para sa safety ng lahat, hindi puwedeng mag-share ng personal info sa study room.`;
  } else if (newStrikes === 2) {
    reason = `⚠️⚠️ ${result.reason} Pangalawang warning na ito. Kung magpapatuloy ka, iba-ban ka ng 24 hours sa room na ito.`;
  } else {
    reason = `🚫 Na-ban ka ng 24 hours sa room na ito dahil sa paulit-ulit na paglabag sa safety rules. Kung minor ka, mai-notify ang iyong parent/guardian.`;
  }

  return NextResponse.json({
    ok: false,
    reason,
    strike: newStrikes,
    banned,
  });
}

// ── Parent notification for minors ──

async function notifyParentIfMinor(
  admin: ReturnType<typeof createServiceClient>,
  userId: string
) {
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, is_minor, parent_email")
      .eq("id", userId)
      .single();

    if (!profile?.is_minor || !profile?.parent_email) return;

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "AralTayo Safety <noreply@araltayo.ph>",
      to: profile.parent_email,
      subject: `Safety Alert — ${profile.display_name} on AralTayo`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
          <h1 style="color:#6d28d9;font-size:24px;margin-bottom:8px">AralTayo Safety Alert</h1>
          <p style="color:#374151;font-size:16px">
            Your child (<strong>${profile.display_name}</strong>) has been temporarily suspended
            from a study room on AralTayo for repeatedly attempting to share personal contact
            information with another student.
          </p>
          <p style="color:#374151;font-size:16px">
            This is an automated safety measure. No personal information was actually shared —
            our system blocked the messages before they could be sent.
          </p>
          <p style="color:#374151;font-size:16px">
            The suspension lasts 24 hours. We recommend talking to your child about online
            safety and not sharing personal information with people they meet online.
          </p>
          <p style="margin-top:24px;color:#6b7280;font-size:13px">
            This is an automated safety notification from AralTayo. No action is required,
            but we wanted to keep you informed.
          </p>
        </div>
      `,
    });
  } catch {
    // Don't fail the request if email fails
  }
}

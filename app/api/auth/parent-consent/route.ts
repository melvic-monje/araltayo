import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://araltayo.ph";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/consent-error?reason=missing_token`);
  }

  const supabase = createServiceClient();

  // Find the profile with this consent token
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, is_active, display_name")
    .eq("consent_token", token)
    .single();

  if (error || !profile) {
    return NextResponse.redirect(`${APP_URL}/consent-error?reason=invalid_token`);
  }

  if (profile.is_active) {
    return NextResponse.redirect(`${APP_URL}/welcome?already=true`);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      is_active: true,
      parent_consented_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.redirect(`${APP_URL}/consent-error?reason=update_failed`);
  }

  return NextResponse.redirect(`${APP_URL}/welcome`);
}

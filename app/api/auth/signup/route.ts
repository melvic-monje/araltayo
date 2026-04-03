import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { generateAnonName } from "@/lib/anon-name";
import { sendParentConsentEmail } from "@/lib/resend";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, displayName, birthYear, parentEmail } = body;

  if (!email || !password || !birthYear) {
    return NextResponse.json(
      { error: "Email, password, and birth year are required" },
      { status: 400 }
    );
  }

  const year = parseInt(birthYear, 10);
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  const isMinor = age < 18;

  if (isMinor && !parentEmail) {
    return NextResponse.json(
      { error: "Parent email is required for users under 18" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification — we handle minor consent separately
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Failed to create account" },
      { status: 400 }
    );
  }

  const userId = authData.user.id;
  const finalDisplayName = displayName?.trim() || generateAnonName();
  const consentToken = isMinor ? uuidv4() : null;

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    display_name: finalDisplayName,
    birth_year: year,
    is_minor: isMinor,
    is_active: !isMinor, // adults are immediately active
    parent_email: isMinor ? parentEmail : null,
    consent_token: consentToken,
  });

  if (profileError) {
    // Rollback auth user
    await supabase.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }

  // Send parent consent email for minors
  if (isMinor && parentEmail && consentToken) {
    try {
      await sendParentConsentEmail(parentEmail, finalDisplayName, consentToken);
    } catch {
      // Non-fatal — user can request resend later
    }
  }

  return NextResponse.json({
    success: true,
    isMinor,
    displayName: finalDisplayName,
  });
}

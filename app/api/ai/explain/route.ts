import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { callClaude } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are a K-12 and college study assistant. Explain topics clearly for students.
Return ONLY valid JSON — no markdown fences, no extra text.
Return an object with key "explanation" (string) containing a clear, well-structured explanation.
Adjust complexity for the specified level.`;

const LEVELS: Record<string, string> = {
  elementary: "elementary school (Grades 1-6)",
  "junior-high": "junior high school (Grades 7-10)",
  "senior-high": "senior high school (Grades 11-12)",
  college: "college/university level",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, remaining } = await checkRateLimit(user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Daily AI limit reached. Try again tomorrow.", remaining: 0 },
      { status: 429 }
    );
  }

  const body = await req.json();
  const topic: string = body.topic ?? "";
  const level: string = LEVELS[body.level ?? "junior-high"] ?? LEVELS["junior-high"];

  if (!topic.trim()) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  const prompt = `Explain this topic for a Filipino ${level} student:\n\n${topic}`;

  const raw = await callClaude(prompt, SYSTEM_PROMPT);

  let explanationText: string;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.explanation === "string") {
      explanationText = parsed.explanation;
    } else {
      throw new Error("Invalid shape");
    }
  } catch {
    explanationText = raw;
  }

  await supabase.from("ai_usage").insert({
    user_id: user.id,
    tool: "explain",
    tokens_used: raw.length,
  });

  return NextResponse.json({ explanation: explanationText, remaining });
}

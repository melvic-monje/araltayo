import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { callClaude } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rate-limit";

export interface Flashcard {
  front: string;
  back: string;
}

const SYSTEM_PROMPT = `You are a Philippine K-12 and college study assistant. Generate flashcards from student notes.
Return ONLY valid JSON — no markdown fences, no extra text. Return an array of flashcard objects.
Each object has exactly two keys: "front" (term or question, concise) and "back" (definition or answer, 1-3 sentences).`;

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
  const notes: string = body.notes ?? "";
  const count: number = Math.min(Number(body.count) || 15, 30);

  if (!notes.trim()) {
    return NextResponse.json({ error: "Notes are required" }, { status: 400 });
  }

  const prompt = `Generate exactly ${count} flashcards from these student notes:\n\n${notes}`;

  const raw = await callClaude(prompt, SYSTEM_PROMPT);

  let cards: Flashcard[];
  try {
    cards = JSON.parse(raw);
    if (!Array.isArray(cards)) throw new Error("Not an array");
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response. Please try again." },
      { status: 500 }
    );
  }

  await supabase.from("ai_usage").insert({
    user_id: user.id,
    tool: "flashcards",
    tokens_used: raw.length,
  });

  return NextResponse.json({ cards, remaining });
}

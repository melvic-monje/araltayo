import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { callClaude } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rate-limit";

export interface Question {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
}

const SYSTEM_PROMPT = `You are a Philippine K-12 and college study assistant. Generate quiz questions from student notes.
Return ONLY valid JSON — no markdown fences, no extra text. The JSON must be an array of question objects.
Each object has exactly these keys: "question" (string), "choices" (array of 4 strings), "answer" (string matching one choice exactly), "explanation" (string, 1-2 sentences).`;

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
  const count: number = Math.min(Number(body.count) || 10, 20);
  const type: string = body.type ?? "multiple_choice";

  if (!notes.trim()) {
    return NextResponse.json({ error: "Notes are required" }, { status: 400 });
  }

  const prompt = `Generate exactly ${count} ${type} quiz questions based on these student notes:\n\n${notes}`;

  const raw = await callClaude(prompt, SYSTEM_PROMPT);

  let questions: Question[] | null = null;
  const tryParse = (s: string): Question[] | null => {
    try {
      const v = JSON.parse(s);
      return Array.isArray(v) ? (v as Question[]) : null;
    } catch {
      return null;
    }
  };
  questions = tryParse(raw);
  if (!questions) {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) questions = tryParse(match[0]);
  }
  if (!questions) {
    console.error("[ai/quiz] parse failed. Raw head:", raw.slice(0, 400));
    return NextResponse.json(
      { error: "Failed to parse AI response. Please try again." },
      { status: 500 }
    );
  }

  // Log AI usage
  await supabase.from("ai_usage").insert({
    user_id: user.id,
    tool: "quiz",
    tokens_used: raw.length,
  });

  return NextResponse.json({ quiz: questions, remaining });
}

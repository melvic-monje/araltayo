import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { callClaude } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are a Philippine K-12 and college study assistant. Create a focused, well-organized study reviewer from student notes.

YOU MUST RETURN ONLY RAW HTML. No markdown. No code fences. No backticks. No \`\`\`html. Start your response directly with an HTML tag.

Guidelines:
- Cover only what is present in the notes — do not pad, repeat, or invent content
- Be concise: use bullets over paragraphs, avoid redundancy
- Use <h2> for major section titles
- Use <h3> for sub-section titles
- Use <ul><li> for bullet points
- Use <strong> for key terms
- Use <table><thead><tbody><tr><th><td> for comparisons
- Do NOT include <html>, <head>, <body>, or any wrapper tags

If the topic in the notes is too broad to cover fully (i.e. it has many major subtopics), append this block at the very end:
<div class="next-topics"><ul><li>SUBTOPIC 1</li><li>SUBTOPIC 2</li><li>SUBTOPIC 3</li></ul></div>

Otherwise omit the next-topics block entirely.`;

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

  if (!notes.trim()) {
    return NextResponse.json({ error: "Notes are required" }, { status: 400 });
  }

  const prompt = `Create a comprehensive study reviewer from these student notes:\n\n${notes}`;

  const raw = await callClaude(prompt, SYSTEM_PROMPT, 4096);

  await supabase.from("ai_usage").insert({
    user_id: user.id,
    tool: "reviewer",
    tokens_used: raw.length,
  });

  return NextResponse.json({ reviewer: raw, remaining });
}

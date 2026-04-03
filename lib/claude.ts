import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1024;

export async function callClaude(
  prompt: string,
  system?: string,
  maxTokens: number = MAX_TOKENS
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: system,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Strip markdown code fences (any language tag) if Claude ignores the instruction
  const text = block.text.trim();
  const fenceMatch = text.match(/^```[a-z]*\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : text;
}

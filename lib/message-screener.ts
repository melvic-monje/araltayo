/**
 * Two-layer message screener for study room chat.
 *
 * Layer 1 — Regex: blocks social-media URLs, PH phone numbers, emails,
 *           and Filipino phrases used to move conversations off-platform.
 * Layer 2 — Claude Haiku semantic check: catches disguised contact sharing
 *           and meetup arrangements. Only runs if Layer 1 passes AND
 *           message is > 20 characters.
 */

// ── Layer 1: Regex rules ─────────────────────────────────────────────

interface RegexRule {
  name: string;
  pattern: RegExp;
  reason: string;
}

const REGEX_RULES: RegexRule[] = [
  // Social media URLs
  {
    name: "social_media_url",
    pattern: /(?:https?:\/\/)?(?:www\.)?(?:facebook|fb|instagram|tiktok|twitter|x|snapchat|telegram|t\.me|viber|discord|whatsapp|messenger|m\.me|youtube|youtu\.be|linkedin)\b[^\s]*/i,
    reason: "Bawal mag-share ng social media links sa study room.",
  },
  // Generic URLs (any http/https link)
  {
    name: "generic_url",
    pattern: /https?:\/\/[^\s]+/i,
    reason: "Bawal mag-share ng links sa study room para sa safety ng lahat.",
  },
  // PH phone numbers (09xx, +639xx, 639xx — with or without separators)
  {
    name: "ph_phone",
    pattern: /(?:\+?63|0)[\s.-]?9[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d[\s.-]?\d/,
    reason: "Bawal mag-share ng phone number sa study room.",
  },
  // Email addresses
  {
    name: "email",
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
    reason: "Bawal mag-share ng email address sa study room.",
  },
  // Filipino phrases for off-platform contact sharing
  {
    name: "contact_sharing_phrase",
    pattern: /\b(?:add\s*(?:mo|kita|natin)\s*(?:sa|ng)?\s*(?:fb|facebook|ig|insta|tg|telegram|viber|discord|messenger)|pm\s*(?:mo|kita|lang|natin)\s*(?:sa|ng)?|send\s*(?:mo|kita)\s*(?:sa|ng)?\s*(?:fb|facebook|ig|messenger)|chat\s*(?:mo|kita|natin)\s*(?:sa|ng)?\s*(?:fb|facebook|ig|messenger|viber|telegram)|tara\s*(?:sa|ng)\s*(?:fb|facebook|ig|messenger|viber|telegram|discord)|g[ií]ve\s*(?:ko|kita)\s*(?:number|num|cp|cellphone)|text\s*(?:mo|kita)\s*(?:sa|ng)?\s*(?:number|num|cp)|cp\s*(?:ko|number\s*ko)|number\s*ko\s*(?:ay|is)?|ito\s*(?:cp|number|num)\s*ko|akin\s*(?:cp|number|num))\b/i,
    reason: "Bawal mag-share ng personal contact info sa study room.",
  },
  // Social media handles (@username pattern with platform context)
  {
    name: "social_handle",
    pattern: /(?:(?:fb|ig|insta|tiktok|twitter|telegram|tg|discord)[\s:]*@?[\w.]{3,}|@[\w.]{3,}\s*(?:sa|on|ng)\s*(?:fb|ig|insta|tiktok|twitter|telegram|discord))/i,
    reason: "Bawal mag-share ng social media accounts sa study room.",
  },
];

export type ScreenResult =
  | { ok: true }
  | { ok: false; layer: "regex" | "semantic"; rule: string; reason: string };

export function regexScreen(message: string): ScreenResult {
  for (const rule of REGEX_RULES) {
    if (rule.pattern.test(message)) {
      return { ok: false, layer: "regex", rule: rule.name, reason: rule.reason };
    }
  }
  return { ok: true };
}

// ── Layer 2: Claude Haiku semantic check ─────────────────────────────

const SEMANTIC_PROMPT = `You are a child safety moderator for a Filipino student study platform.

Your ONLY job: decide if this chat message is trying to share personal contact info or arrange an off-platform meetup.

Red flags:
- Disguised phone numbers ("zero nine one seven..." or "0-9-1-7..." or "siyam isa pito...")
- Coded social media handles ("search mo pangalan ko sa fb", "add mo ako dun")
- Meetup arrangements ("kita tayo sa", "punta ka sa", "saan ka ba nag-aaral", "anong school mo")
- Sharing location/school info to enable real-world contact
- Spelling tricks to bypass filters ("f.b", "t3l3gram", "numb3r")

NOT red flags (allow these):
- Normal study discussion, asking academic questions
- Saying "text me" or "message me" in study context (e.g. "i-text mo sa notes")
- Mentioning schools/places in academic context (e.g. "sa UP Diliman ang research")
- Friendly conversation that stays on the platform

Respond with ONLY one of:
SAFE
BLOCKED|<short reason in Filipino>

Examples:
Message: "search mo lang name ko sa fb hehe"
BLOCKED|Parang gusto mong mag-share ng social media account.

Message: "ano ba ang formula ng acceleration?"
SAFE

Message: "siyam-walo-pito-anim ang num ko tawag ka"
BLOCKED|Parang may phone number na ini-share.`;

export async function semanticScreen(message: string): Promise<ScreenResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: true }; // fail open if no key

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 60,
        messages: [
          { role: "user", content: `Message to check:\n"${message}"` },
        ],
        system: SEMANTIC_PROMPT,
      }),
    });

    if (!res.ok) return { ok: true }; // fail open on API error

    const data = await res.json();
    const reply: string = data.content?.[0]?.text?.trim() ?? "SAFE";

    if (reply.startsWith("BLOCKED")) {
      const reason = reply.split("|")[1]?.trim() || "Na-detect na may contact info o meetup arrangement sa message mo.";
      return { ok: false, layer: "semantic", rule: "ai_semantic", reason };
    }

    return { ok: true };
  } catch {
    return { ok: true }; // fail open
  }
}

const ADJECTIVES = [
  "Blue", "Red", "Green", "Purple", "Golden", "Silver", "Brave", "Swift",
  "Bright", "Bold", "Cool", "Dark", "Fierce", "Free", "Grand", "Happy",
  "Keen", "Loud", "Neon", "Noble", "Proud", "Quick", "Sharp", "Smooth",
  "Warm", "Wild", "Wise", "Young", "Calm", "Daring",
];

const NOUNS = [
  "Mangga", "Dagat", "Bundok", "Ulap", "Bituin", "Araw", "Buwan", "Hangin",
  "Ulan", "Lupa", "Apoy", "Tubig", "Puno", "Bulaklak", "Ibon", "Isda",
  "Agila", "Tamaraw", "Pawikan", "Karayom", "Sinag", "Kidlat", "Alon",
  "Bagyo", "Diwata", "Bathala", "Anito", "Bayani", "Mandirigma", "Hukay",
];

export function generateAnonName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = String(Math.floor(Math.random() * 9000) + 1000);
  return `${adj}${noun}#${num}`;
}

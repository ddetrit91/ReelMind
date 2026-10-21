/**
 * Decode HTML entities (named + decimal/hex numeric) for titles from Instagram OG/oEmbed.
 */
export function decodeHtmlEntities(value: string): string {
  if (!value) return value;

  let text = value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  text = text.replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
    try {
      return String.fromCodePoint(Number.parseInt(hex, 16));
    } catch {
      return "";
    }
  });

  text = text.replace(/&#(\d+);/g, (_, dec: string) => {
    try {
      return String.fromCodePoint(Number.parseInt(dec, 10));
    } catch {
      return "";
    }
  });

  // Leftover undecoded entities (broken payloads)
  text = text.replace(/&#x?[0-9a-f]+;/gi, "");

  return text;
}

/** Map Mathematical Alphanumeric Symbols (e.g. Instagram stylized fonts) → ASCII. */
function normalizeFancyLetters(text: string): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    // Bold / italic / sans / mono Latin A–Z a–z blocks in Mathematical Alphanumeric Symbols
    if (cp >= 0x1d400 && cp <= 0x1d7ff) {
      const mapped = mapMathAlnum(cp);
      out += mapped ?? ch;
      continue;
    }
    // Fullwidth Latin
    if (cp >= 0xff21 && cp <= 0xff3a) {
      out += String.fromCharCode(cp - 0xff21 + 65);
      continue;
    }
    if (cp >= 0xff41 && cp <= 0xff5a) {
      out += String.fromCharCode(cp - 0xff41 + 97);
      continue;
    }
    out += ch;
  }
  return out;
}

function mapMathAlnum(cp: number): string | null {
  const ranges: Array<{ start: number; end: number; base: number }> = [
    { start: 0x1d400, end: 0x1d419, base: 65 }, // bold A–Z
    { start: 0x1d41a, end: 0x1d433, base: 97 }, // bold a–z
    { start: 0x1d434, end: 0x1d44d, base: 65 },
    { start: 0x1d44e, end: 0x1d467, base: 97 },
    { start: 0x1d468, end: 0x1d481, base: 65 },
    { start: 0x1d482, end: 0x1d49b, base: 97 },
    { start: 0x1d4d0, end: 0x1d4e9, base: 65 },
    { start: 0x1d4ea, end: 0x1d503, base: 97 },
    { start: 0x1d504, end: 0x1d51d, base: 65 },
    { start: 0x1d51e, end: 0x1d537, base: 97 },
    { start: 0x1d538, end: 0x1d551, base: 65 },
    { start: 0x1d552, end: 0x1d56b, base: 97 },
    { start: 0x1d56c, end: 0x1d585, base: 65 },
    { start: 0x1d586, end: 0x1d59f, base: 97 },
    { start: 0x1d5a0, end: 0x1d5b9, base: 65 },
    { start: 0x1d5ba, end: 0x1d5d3, base: 97 },
    { start: 0x1d5d4, end: 0x1d5ed, base: 65 },
    { start: 0x1d5ee, end: 0x1d607, base: 97 },
    { start: 0x1d608, end: 0x1d621, base: 65 },
    { start: 0x1d622, end: 0x1d63b, base: 97 },
    { start: 0x1d63c, end: 0x1d655, base: 65 },
    { start: 0x1d656, end: 0x1d66f, base: 97 },
    { start: 0x1d670, end: 0x1d689, base: 65 },
    { start: 0x1d68a, end: 0x1d6a3, base: 97 },
  ];

  for (const { start, end, base } of ranges) {
    if (cp >= start && cp <= end) {
      return String.fromCharCode(base + (cp - start));
    }
  }

  // Digits 0–9 in math blocks
  if (cp >= 0x1d7ce && cp <= 0x1d7d7) return String.fromCharCode(48 + (cp - 0x1d7ce));
  if (cp >= 0x1d7d8 && cp <= 0x1d7e1) return String.fromCharCode(48 + (cp - 0x1d7d8));
  if (cp >= 0x1d7e2 && cp <= 0x1d7eb) return String.fromCharCode(48 + (cp - 0x1d7e2));
  if (cp >= 0x1d7ec && cp <= 0x1d7f5) return String.fromCharCode(48 + (cp - 0x1d7ec));
  if (cp >= 0x1d7f6 && cp <= 0x1d7ff) return String.fromCharCode(48 + (cp - 0x1d7f6));

  return null;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripInstagramNoise(text: string): string {
  // "Username on Instagram: \"caption…\"" → caption
  const onIg = text.match(/\bon\s+Instagram:\s*[«"“]?(.+?)[»"”]?\s*$/i);
  if (onIg?.[1]) return onIg[1].trim();

  // Drop trailing hashtag spam if the rest is usable
  const withoutTags = text.replace(/(?:\s#[\p{L}\p{N}_]+)+$/gu, "").trim();
  return withoutTags || text;
}

function readableRatio(text: string): number {
  if (!text) return 0;
  const chars = [...text];
  let good = 0;
  for (const ch of chars) {
    const cp = ch.codePointAt(0)!;
    if (
      (cp >= 0x20 && cp <= 0x7e) ||
      (cp >= 0x400 && cp <= 0x4ff) || // Cyrillic
      ch === "—" ||
      ch === "–" ||
      ch === "…" ||
      ch === "«" ||
      ch === "»" ||
      /\p{Emoji}/u.test(ch)
    ) {
      good += 1;
    }
  }
  return good / chars.length;
}

/**
 * Human-readable title for cards/detail. Fixes Instagram OG junk.
 */
export function cleanDisplayTitle(
  raw: string | null | undefined,
  options?: { sourceKind?: string; shareText?: string | null; fallback?: string },
): string {
  const fallback = options?.fallback ?? "Сохранённая ссылка";
  const share = options?.shareText?.trim();

  const candidates = [share, raw]
    .filter((v): v is string => Boolean(v && v.trim()))
    .map((v) => collapseWhitespace(normalizeFancyLetters(decodeHtmlEntities(v))))
    .map((v) => (options?.sourceKind === "instagram" ? stripInstagramNoise(v) : v))
    .map((v) => collapseWhitespace(v))
    .filter((v) => v.length >= 2);

  for (const candidate of candidates) {
    // Still looks like raw entities or mostly garbage
    if (/&#x?[0-9a-f]+;/i.test(candidate)) continue;
    if (readableRatio(candidate) < 0.55) continue;

    const clipped = candidate.length > 120 ? `${candidate.slice(0, 117).trim()}…` : candidate;
    return clipped;
  }

  if (options?.sourceKind === "instagram") return "Instagram Reels";
  return fallback;
}

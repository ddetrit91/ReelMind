/**
 * Decode HTML entities and normalize display text from OG/oEmbed/SSR payloads
 * (Instagram, Дзен, YouTube, articles — same pipeline for every source).
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

  text = text.replace(/&#x?[0-9a-f]+;/gi, "");

  return text;
}

/** Map Mathematical Alphanumeric Symbols → ASCII. */
function normalizeFancyLetters(text: string): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0x1d400 && cp <= 0x1d7ff) {
      const mapped = mapMathAlnum(cp);
      out += mapped ?? ch;
      continue;
    }
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
    { start: 0x1d400, end: 0x1d419, base: 65 },
    { start: 0x1d41a, end: 0x1d433, base: 97 },
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

const PATH_NOISE = new Set([
  "watch",
  "media",
  "video",
  "videos",
  "share",
  "post",
  "posts",
  "reel",
  "reels",
  "shorts",
  "embed",
  "live",
  "channel",
  "a",
  "b",
  "id",
  "p",
  "tv",
  "status",
]);

/**
 * Instagram / TikTok / Дзен UI chrome (often English) — never use as card title.
 * Real captions in English are still allowed when they look like a normal sentence.
 */
export function isPlatformChromeTitle(text: string, sourceKind?: string): boolean {
  const t = text.trim();
  if (!t) return true;

  if (
    /^(watch|see|view|open)\s+(this\s+)?(reel|reels|post|video|photo|clip)\s+on\s+instagram\b/i.test(
      t,
    ) ||
    /^(photo|video|reel|reels)\s+by\s+.+\s+on\s+instagram\b/i.test(t) ||
    /^instagram\s+(reel|reels|post|video|photo)\b/i.test(t) ||
    /^login\s*[•·|]\s*instagram$/i.test(t) ||
    /^create\s+new\s+account\b/i.test(t) ||
    /^sign\s+up\s+to\s+see\b/i.test(t) ||
    /^shared\s+(a\s+)?(post|reel|video)\b/i.test(t)
  ) {
    return true;
  }

  if (
    sourceKind === "tiktok" &&
    (/^tiktok\s*[-–—|]/i.test(t) || /^make\s+your\s+day$/i.test(t))
  ) {
    return true;
  }

  if (
    (sourceKind === "dzen" || /дзен|yandex\s*zen|dzen\.ru/i.test(t)) &&
    (/^(yandex\s*)?zen$/i.test(t) ||
      /^дзен$/i.test(t) ||
      /^article\s+from\s+dzen\b/i.test(t) ||
      /^video\s+from\s+dzen\b/i.test(t))
  ) {
    return true;
  }

  // "username on Instagram" / "username on Instagram:" with empty/no real caption
  if (/^[a-z0-9._]{2,30}\s+on\s+instagram\s*:?\s*$/i.test(t)) return true;

  return false;
}

/** Keyboard-mash / id blob: "kdfgkldjf44dfg", not a real word. */
function isGibberishToken(token: string): boolean {
  const t = token.toLowerCase().replace(/[^a-zа-яё0-9]/gi, "");
  if (t.length < 6) return false;

  if (/[а-яё]/i.test(t)) {
    const letters = t.replace(/[^а-яё]/gi, "");
    if (letters.length < 7) return false;
    const vowels = (letters.match(/[аеёиоуыэюя]/gi) ?? []).length;
    return vowels / letters.length < 0.12;
  }

  const letters = t.replace(/[^a-z]/g, "");
  if (letters.length < 6) return false;
  const vowels = (letters.match(/[aeiouy]/g) ?? []).length;
  const digits = (t.match(/\d/g) ?? []).length;
  if (vowels === 0) return true;
  if (letters.length >= 8 && digits >= 1 && vowels / letters.length < 0.22) return true;
  if (letters.length >= 12 && vowels / letters.length < 0.16) return true;
  return false;
}

/**
 * Random strings that platforms sometimes put in OG title/caption.
 * Real titles ("Never Gonna Give You Up", "Как начать") stay.
 */
export function isGibberishText(text: string): boolean {
  const tokens = text
    .trim()
    .split(/[\s,.;:|/\\]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (tokens.length === 0) return false;

  let junkChars = 0;
  let allChars = 0;
  for (const token of tokens) {
    const size = token.replace(/\s/g, "").length;
    allChars += size;
    if (isGibberishToken(token)) junkChars += size;
  }
  if (allChars < 8) return false;
  return junkChars / allChars >= 0.55;
}

/** Opaque URL ids / route crumbs that should never be shown as a title. */
export function isJunkTitle(text: string, sourceKind?: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t.length < 2) return true;
  if (/^https?:\/\//i.test(t)) return true;
  if (/^[a-f0-9]{10,}$/i.test(t)) return true;
  if (/^[a-z0-9_-]{20,}$/i.test(t) && !/[а-яё]/i.test(t) && !/\s/.test(t)) return true;
  if (PATH_NOISE.has(t.toLowerCase())) return true;
  if (/^(yandex\s*)?zen$/i.test(t)) return true;
  if (/^дзен$/i.test(t)) return true;
  if (/^instagram(\s+reels)?$/i.test(t)) return true;
  if (/^tiktok$/i.test(t)) return true;
  if (/^youtube$/i.test(t)) return true;
  if (isPlatformChromeTitle(t, sourceKind)) return true;
  if (isGibberishText(t)) return true;
  return false;
}

function stripPlatformNoise(text: string, sourceKind?: string): string {
  let t = text;

  // "Username on Instagram: \"caption…\"" → caption (greedy: keep full text)
  const onIg = t.match(/\bon\s+Instagram:\s*[«"“]?([\s\S]+)$/i);
  if (onIg?.[1]) {
    t = onIg[1].replace(/^[«"“]+/, "").replace(/[»"”]+$/u, "").trim();
  }

  // "Title | Дзен" / "Title — Yandex Zen" / "Title • Dzen"
  t = t.replace(
    /\s*[\|\u2013\u2014\-•·]\s*(?:яндекс[.\s-]*)?дзен\s*$/i,
    "",
  );
  t = t.replace(/\s*[\|\u2013\u2014\-•·]\s*(?:yandex\s*)?zen\s*$/i, "");
  t = t.replace(/\s*[\|\u2013\u2014\-•·]\s*dzen\.ru\s*$/i, "");
  t = t.replace(/\s*[\|\u2013\u2014\-•·]\s*zen\.yandex\.ru\s*$/i, "");
  t = t.replace(/\s*[\|\u2013\u2014\-•·]\s*instagram\s*$/i, "");
  t = t.replace(/\s*[\|\u2013\u2014\-•·]\s*youtube\s*$/i, "");
  t = t.replace(/\s*[\|\u2013\u2014\-•·]\s*tiktok\s*$/i, "");

  // Leading site chrome
  t = t.replace(/^(?:яндекс[.\s-]*)?дзен\s*[:\-–—|•·]\s*/i, "");
  t = t.replace(/^(?:yandex\s*)?zen\s*[:\-–—|•·]\s*/i, "");

  if (sourceKind === "instagram" || !sourceKind) {
    const withoutTags = t.replace(/(?:\s#[\p{L}\p{N}_]+)+$/gu, "").trim();
    if (withoutTags.length >= 2) t = withoutTags;
  }

  return t.trim();
}

function readableRatio(text: string): number {
  if (!text) return 0;
  const chars = [...text];
  let good = 0;
  for (const ch of chars) {
    const cp = ch.codePointAt(0)!;
    if (
      (cp >= 0x20 && cp <= 0x7e) ||
      (cp >= 0x400 && cp <= 0x4ff) ||
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
 * Short card headline from a long caption/description.
 * Instagram has no separate title — we take the first sentence / line.
 */
export function headlineFromText(raw: string | null | undefined, maxLen = 90): string | null {
  if (!raw?.trim()) return null;
  let text = collapseWhitespace(
    normalizeFancyLetters(decodeHtmlEntities(stripPlatformNoise(raw))),
  );
  if (isJunkTitle(text) || readableRatio(text) < 0.55) return null;
  // After stripping chrome, still reject leftover Instagram UI lines
  if (isPlatformChromeTitle(text)) return null;

  // Prefer first line, then first sentence
  const firstLine = text.split(/\n/)[0]?.trim() ?? text;
  text = firstLine;
  const sentence = text.match(/^(.+?[.!?…]+)(?:\s|$)/u);
  if (sentence?.[1] && sentence[1].length >= 12 && sentence[1].length <= maxLen + 20) {
    text = sentence[1].trim();
  }

  if (text.length > maxLen) {
    const cut = text.slice(0, maxLen - 1);
    const atSpace = cut.lastIndexOf(" ");
    text = `${(atSpace > 40 ? cut.slice(0, atSpace) : cut).trim()}…`;
  }

  return text.length >= 2 ? text : null;
}

function sourceFallback(sourceKind?: string): string {
  if (sourceKind === "instagram") return "Instagram";
  if (sourceKind === "youtube") return "YouTube";
  if (sourceKind === "dzen") return "Дзен";
  if (sourceKind === "tiktok") return "TikTok";
  if (sourceKind === "telegram") return "Telegram";
  if (sourceKind === "twitter") return "X";
  if (sourceKind === "article") return "Статья";
  return "Сохранённая ссылка";
}

/**
 * Human-readable title for cards/detail — same rules for every source.
 */
export function cleanDisplayTitle(
  raw: string | null | undefined,
  options?: { sourceKind?: string; shareText?: string | null; fallback?: string },
): string {
  const fallback = options?.fallback ?? sourceFallback(options?.sourceKind);
  const share = options?.shareText?.trim();

  // When shareText is passed (Instagram note), it wins. Callers must NOT pass
  // user notes as shareText for YouTube — that would hide the real video title.
  const preferred = share ? [share, raw] : [raw];

  const candidates = preferred
    .filter((v): v is string => Boolean(v && v.trim()))
    .map((v) => collapseWhitespace(normalizeFancyLetters(decodeHtmlEntities(v))))
    .map((v) => stripPlatformNoise(v, options?.sourceKind))
    .map((v) => collapseWhitespace(v))
    .filter(
      (v) =>
        v.length >= 2 &&
        !isJunkTitle(v, options?.sourceKind) &&
        !isPlatformChromeTitle(v, options?.sourceKind),
    );

  for (const candidate of candidates) {
    if (/&#x?[0-9a-f]+;/i.test(candidate)) continue;
    if (readableRatio(candidate) < 0.55) continue;

    // For long captions (typical Instagram), show a headline, not the whole wall of text
    if (candidate.length > 120 || (options?.sourceKind === "instagram" && candidate.length > 90)) {
      const headline = headlineFromText(candidate, 90);
      if (headline) return headline;
    }

    const clipped = candidate.length > 120 ? `${candidate.slice(0, 117).trim()}…` : candidate;
    return clipped;
  }

  // Last resort: try to pull a headline from share/raw even if earlier filters were strict
  const fromShare = headlineFromText(share, 90);
  if (fromShare && !isPlatformChromeTitle(fromShare, options?.sourceKind)) return fromShare;
  const fromRaw = headlineFromText(raw, 90);
  if (fromRaw && !isPlatformChromeTitle(fromRaw, options?.sourceKind)) return fromRaw;

  return fallback;
}

/** Friendly placeholder while metadata loads — never a raw URL slug. */
export function quickDisplayTitle(
  url: string,
  shareText?: string | null,
  sourceKind?: string,
): string {
  const fromShare = headlineFromText(shareText, 90);
  if (fromShare) return fromShare;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("dzen.ru") || host.includes("zen.yandex")) return "Дзен";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("youtube.com") || host === "youtu.be") return "YouTube";
    if (host.includes("tiktok.com")) return "TikTok";

    const parts = parsed.pathname.split("/").filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const part = decodeURIComponent(parts[i] ?? "").replace(/[-_]+/g, " ").trim();
      if (!part || isJunkTitle(part)) continue;
      if (PATH_NOISE.has(part.toLowerCase())) continue;
      // Slug with real words (has hyphenated phrase with letters)
      if (/[а-яёa-z]{3,}/i.test(part) && /[\s-]/.test(part)) {
        return part.slice(0, 120);
      }
    }

    return sourceFallback(sourceKind) !== "Сохранённая ссылка"
      ? sourceFallback(sourceKind)
      : host;
  } catch {
    return sourceFallback(sourceKind);
  }
}

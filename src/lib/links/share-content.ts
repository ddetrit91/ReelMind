import { isJunkTitle } from "@/lib/links/display-text";
import { extractUrl, type SourceKind } from "@/lib/links/parse-url";

function sourceKindFromUrl(url: string | null | undefined): SourceKind | undefined {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("instagram.com") || host === "instagr.am") return "instagram";
    if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("dzen.ru") || host.includes("zen.yandex")) return "dzen";
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Drop Instagram/TikTok share chrome and gibberish that must not fill the note field.
 * Same criteria as ingest (isJunkTitle), so the form matches what would be saved.
 */
export function sanitizeShareNote(
  note: string | null | undefined,
  url?: string | null,
): string {
  const trimmed = (note ?? "").trim();
  if (!trimmed) return "";
  if (url && trimmed === url) return "";
  if (isJunkTitle(trimmed, sourceKindFromUrl(url))) return "";
  return trimmed;
}

/**
 * Split a share/clipboard blob into URL + human note.
 * Instagram / TikTok often send: "caption text…\nhttps://instagram.com/reel/…"
 */
export function splitUrlAndNote(raw: string | null | undefined): {
  url: string | null;
  note: string;
} {
  const text = (raw ?? "").trim();
  if (!text) return { url: null, note: "" };

  const url = extractUrl(text);
  if (!url) {
    return { url: null, note: sanitizeShareNote(text) };
  }

  let note = text;
  // Remove the URL (and common wrappers) from the note body
  note = note.replace(url, " ");
  try {
    const u = new URL(url);
    const bare = `${u.host}${u.pathname}`.replace(/\/$/, "");
    note = note.replace(new RegExp(bare.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
  } catch {
    // ignore
  }
  note = note
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { url, note: sanitizeShareNote(note, url) };
}

/** Build url + note from Web Share Target / query params. */
export function noteFromSharePayload(params: {
  url?: string;
  text?: string;
  title?: string;
}): { url: string | null; note: string } {
  const fromUrlField = params.url?.trim() ? extractUrl(params.url) : null;
  const combined = [params.title, params.text, params.url].filter(Boolean).join("\n");
  const split = splitUrlAndNote(combined);

  const url = fromUrlField ?? split.url;
  // Prefer note from text/title; drop pure duplicates of the url and platform junk
  let note = split.note;
  if (!note && params.title?.trim() && !extractUrl(params.title)) {
    note = sanitizeShareNote(params.title, url);
  } else {
    note = sanitizeShareNote(note, url);
  }

  return { url, note };
}

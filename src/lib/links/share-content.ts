import { extractUrl } from "@/lib/links/parse-url";

/**
 * Platforms where OG/oEmbed often returns empty junk — require a user note for the title.
 */
export function sourceNeedsManualNote(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const host = new URL(url.includes("://") ? url : `https://${url}`).hostname.toLowerCase();
    return (
      host.includes("instagram.com") ||
      host.includes("dzen.ru") ||
      host.includes("zen.yandex") ||
      host.includes("tiktok.com")
    );
  } catch {
    return false;
  }
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
  if (!url) return { url: null, note: text };

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

  return { url, note };
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
  // Prefer note from text/title; drop pure duplicates of the url
  let note = split.note;
  if (!note && params.title?.trim() && !extractUrl(params.title)) {
    note = params.title.trim();
  }
  if (url && note === url) note = "";

  return { url, note };
}

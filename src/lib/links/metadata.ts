import { fetchInstagramMetadata } from "@/lib/instagram/metadata";
import {
  extractYoutubeVideoId,
  youtubeThumbnailUrl,
  type SourceKind,
} from "@/lib/links/parse-url";

export type LinkMetadata = {
  title?: string;
  caption?: string;
  thumbnailUrl?: string;
};

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 400_000;

function metaContent(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return undefined;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function documentTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1].trim()) : undefined;
}

function resolveMediaUrl(pageUrl: string, imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined;
  try {
    return new URL(imageUrl, pageUrl).toString();
  } catch {
    return undefined;
  }
}

async function fetchYoutubeOembed(url: string): Promise<LinkMetadata> {
  const videoId = extractYoutubeVideoId(url);
  const fallbackThumb = videoId ? youtubeThumbnailUrl(videoId) : undefined;
  try {
    const oembed = new URL("https://www.youtube.com/oembed");
    oembed.searchParams.set("url", url);
    oembed.searchParams.set("format", "json");
    const res = await fetch(oembed.toString(), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { thumbnailUrl: fallbackThumb };
    const data = (await res.json()) as { title?: string; thumbnail_url?: string };
    return {
      title: data.title,
      thumbnailUrl: data.thumbnail_url ?? fallbackThumb,
      caption: data.title,
    };
  } catch {
    return { thumbnailUrl: fallbackThumb };
  }
}

async function fetchOpenGraph(url: string): Promise<LinkMetadata> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (compatible; ReelMind/0.1; +https://localhost) AppleWebKit/537.36",
    },
    redirect: "follow",
  });
  if (!res.ok) return {};

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("xml")) {
    return {};
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const html = (await res.text()).slice(0, MAX_HTML_BYTES);
    return parseHtmlMetadata(html);
  }

  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    size += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);
  const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
  return parseHtmlMetadata(html);
}

function parseHtmlMetadata(html: string): LinkMetadata {
  const title =
    metaContent(html, "og:title") ??
    metaContent(html, "twitter:title") ??
    documentTitle(html);
  const thumbnailUrl =
    metaContent(html, "og:image") ??
    metaContent(html, "og:image:url") ??
    metaContent(html, "twitter:image");
  const caption =
    metaContent(html, "og:description") ?? metaContent(html, "description");

  return { title, thumbnailUrl, caption };
}

function fallbackTitle(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+/g, "/").replace(/\/$/, "");
    if (path && path !== "/") {
      const last = decodeURIComponent(path.split("/").filter(Boolean).pop() ?? "");
      if (last) return last.replace(/[-_]+/g, " ");
    }
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "Сохранённая ссылка";
  }
}

export async function fetchLinkMetadata(
  url: string,
  sourceKind: SourceKind,
  shareText?: string,
): Promise<LinkMetadata> {
  const captionFromShare = shareText?.trim() || undefined;
  let collected: LinkMetadata = {};

  try {
    if (sourceKind === "instagram") {
      collected = await fetchInstagramMetadata(url, shareText);
    } else if (sourceKind === "youtube") {
      collected = await fetchYoutubeOembed(url);
    }
  } catch {
    // next fallback
  }

  if (!collected.title || !collected.thumbnailUrl) {
    try {
      const og = await fetchOpenGraph(url);
      collected = {
        title: collected.title ?? og.title,
        thumbnailUrl: collected.thumbnailUrl ?? og.thumbnailUrl,
        caption: collected.caption ?? og.caption,
      };
    } catch {
      // keep what we have
    }
  }

  const title = collected.title?.trim() || fallbackTitle(url);
  const caption = captionFromShare ?? collected.caption ?? title;
  const thumbnailUrl = resolveMediaUrl(url, collected.thumbnailUrl);

  return {
    title,
    caption,
    thumbnailUrl,
  };
}

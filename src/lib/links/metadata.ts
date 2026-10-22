import { fetchInstagramMetadata } from "@/lib/instagram/metadata";
import {
  cleanDisplayTitle,
  decodeHtmlEntities,
  isJunkTitle,
  isPlatformChromeTitle,
  quickDisplayTitle,
} from "@/lib/links/display-text";
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

const OEMBED_TIMEOUT_MS = 5000;
const PAGE_TIMEOUT_MS = 12000;
const MAX_HTML_BYTES = 500_000;

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
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return undefined;
}

function documentTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : undefined;
}

function resolveMediaUrl(pageUrl: string, imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined;
  try {
    return new URL(imageUrl, pageUrl).toString();
  } catch {
    return undefined;
  }
}

function usableText(
  value: string | null | undefined,
  sourceKind?: SourceKind,
): string | undefined {
  const t = value?.trim();
  if (!t) return undefined;
  if (isJunkTitle(t, sourceKind) || isPlatformChromeTitle(t, sourceKind)) return undefined;
  return t;
}

async function fetchYoutubeOembed(url: string): Promise<LinkMetadata> {
  const videoId = extractYoutubeVideoId(url);
  const fallbackThumb = videoId ? youtubeThumbnailUrl(videoId) : undefined;
  try {
    const oembed = new URL("https://www.youtube.com/oembed");
    oembed.searchParams.set("url", url);
    oembed.searchParams.set("format", "json");
    const res = await fetch(oembed.toString(), {
      signal: AbortSignal.timeout(OEMBED_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { thumbnailUrl: fallbackThumb };
    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
    };
    return {
      title: data.title?.trim() || undefined,
      thumbnailUrl: data.thumbnail_url ?? fallbackThumb,
    };
  } catch {
    return { thumbnailUrl: fallbackThumb };
  }
}

function parseDzenSsr(html: string): LinkMetadata {
  const result: LinkMetadata = {};

  const paramsMatch = html.match(
    /(?:var|let|const)\s+_params\s*=\s*\(\s*(\{[\s\S]*?\})\s*\)\s*;?/,
  );
  if (paramsMatch?.[1]) {
    try {
      const parsed = JSON.parse(paramsMatch[1]) as {
        ssrData?: {
          videoMetaResponse?: {
            title?: string;
            description?: string;
            image?: string;
            thumbnail?: string;
          };
        };
      };
      const meta = parsed.ssrData?.videoMetaResponse;
      if (meta?.title && !isJunkTitle(meta.title, "dzen")) result.title = meta.title;
      if (meta?.description) result.caption = meta.description;
      if (meta?.image || meta?.thumbnail) {
        result.thumbnailUrl = meta.image ?? meta.thumbnail;
      }
    } catch {
      // fall through
    }
  }

  if (!result.title) {
    const titleMatch = html.match(
      /"videoMetaResponse"\s*:\s*\{[^}]*?"title"\s*:\s*"((?:\\.|[^"\\])*)"/,
    );
    if (titleMatch?.[1]) {
      const title = decodeHtmlEntities(titleMatch[1].replace(/\\"/g, '"').replace(/\\n/g, " "));
      if (!isJunkTitle(title, "dzen")) result.title = title;
    }
  }

  if (!result.caption) {
    const descMatch = html.match(
      /"videoMetaResponse"\s*:\s*\{[^}]*?"description"\s*:\s*"((?:\\.|[^"\\])*)"/,
    );
    if (descMatch?.[1]) {
      result.caption = decodeHtmlEntities(
        descMatch[1].replace(/\\"/g, '"').replace(/\\n/g, " "),
      );
    }
  }

  return result;
}

function parseHtmlMetadata(html: string, sourceKind?: SourceKind): LinkMetadata {
  const fromSsr = sourceKind === "dzen" ? parseDzenSsr(html) : {};
  const title =
    fromSsr.title ??
    metaContent(html, "og:title") ??
    metaContent(html, "twitter:title") ??
    documentTitle(html);
  const thumbnailUrl =
    fromSsr.thumbnailUrl ??
    metaContent(html, "og:image") ??
    metaContent(html, "og:image:url") ??
    metaContent(html, "twitter:image");
  const caption =
    fromSsr.caption ??
    metaContent(html, "og:description") ??
    metaContent(html, "description") ??
    metaContent(html, "twitter:description");

  return { title, thumbnailUrl, caption };
}

async function fetchPageMetadata(
  url: string,
  sourceKind?: SourceKind,
  timeoutMs = PAGE_TIMEOUT_MS,
): Promise<LinkMetadata> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.5",
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
    return parseHtmlMetadata(html, sourceKind);
  }

  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    size += value.byteLength;
    // YouTube puts OG tags near the top — stop early once we have them
    if (sourceKind === "youtube" && size > 80_000) {
      const partial = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
      const parsed = parseHtmlMetadata(partial, sourceKind);
      if (parsed.title && parsed.caption) {
        await reader.cancel().catch(() => undefined);
        return parsed;
      }
    }
  }
  await reader.cancel().catch(() => undefined);
  const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
  return parseHtmlMetadata(html, sourceKind);
}

export function sourcePrefersNoteTitle(sourceKind: SourceKind): boolean {
  return (
    sourceKind === "instagram" ||
    sourceKind === "tiktok" ||
    sourceKind === "dzen"
  );
}

export async function fetchLinkMetadata(
  url: string,
  sourceKind: SourceKind,
  shareText?: string,
): Promise<LinkMetadata> {
  const note = shareText?.trim() || undefined;
  let collected: LinkMetadata = {};

  try {
    if (sourceKind === "instagram") {
      collected = await fetchInstagramMetadata(url, shareText);
    } else if (sourceKind === "youtube") {
      // oEmbed first (fast title+thumb), then page OG for description — don't block title on slow HTML
      const oembed = await fetchYoutubeOembed(url);
      collected = { ...oembed };
      try {
        const page = await fetchPageMetadata(url, "youtube", PAGE_TIMEOUT_MS);
        collected = {
          title: oembed.title ?? page.title,
          thumbnailUrl: oembed.thumbnailUrl ?? page.thumbnailUrl,
          caption: page.caption || undefined,
        };
      } catch {
        // keep oembed-only
      }
    } else if (sourceKind === "dzen") {
      collected = await fetchPageMetadata(url, "dzen");
    } else {
      collected = await fetchPageMetadata(url, sourceKind);
    }
  } catch {
    // fall through
  }

  if (
    sourceKind !== "youtube" &&
    (!collected.title || !collected.thumbnailUrl || !collected.caption)
  ) {
    try {
      const og = await fetchPageMetadata(url, sourceKind);
      collected = {
        title: collected.title ?? og.title,
        thumbnailUrl: collected.thumbnailUrl ?? og.thumbnailUrl,
        caption: collected.caption ?? og.caption,
      };
    } catch {
      // keep what we have
    }
  }

  if (sourceKind === "youtube" && !collected.thumbnailUrl) {
    const id = extractYoutubeVideoId(url);
    if (id) collected.thumbnailUrl = youtubeThumbnailUrl(id);
  }

  const thumbnailUrl = resolveMediaUrl(url, collected.thumbnailUrl);
  const friendlyFallback = quickDisplayTitle(url, note, sourceKind);

  if (note && sourcePrefersNoteTitle(sourceKind)) {
    const title = quickDisplayTitle(url, note, sourceKind);
    const metaCaption = usableText(collected.caption, sourceKind);
    return {
      title,
      caption: metaCaption && metaCaption !== title ? metaCaption : note,
      thumbnailUrl,
    };
  }

  // YouTube / articles: never let a leftover note override the real title
  const rawTitle = usableText(collected.title, sourceKind) ?? collected.title?.trim();
  const rawCaption = usableText(collected.caption, sourceKind);

  const title = cleanDisplayTitle(rawTitle, {
    sourceKind,
    fallback: friendlyFallback,
  });

  // Prefer real description; if missing, keep title as caption (detail page still shows title)
  const caption = rawCaption
    ? cleanDisplayTitle(rawCaption, {
        sourceKind,
        fallback: title,
      })
    : title;

  return {
    title: title && !isJunkTitle(title, sourceKind) ? title : friendlyFallback,
    caption: caption || title,
    thumbnailUrl,
  };
}

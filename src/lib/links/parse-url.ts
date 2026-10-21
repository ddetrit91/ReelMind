export type MediaKind = "reel" | "post" | "video" | "article" | "unknown";
export type ContentType = "video" | "photo" | "carousel" | "article" | "unknown";
export type SourceKind =
  | "instagram"
  | "youtube"
  | "dzen"
  | "tiktok"
  | "telegram"
  | "twitter"
  | "article"
  | "other";

export type ParsedSourceUrl = {
  normalizedUrl: string;
  sourceKind: SourceKind;
  mediaKind: MediaKind;
  contentType: ContentType;
  host: string;
};

const URL_IN_TEXT = /https?:\/\/[^\s<>"'()]+/gi;

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[).,;!?]+$/g, "");
}

function withProtocol(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function extractUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const matches = trimmed.match(URL_IN_TEXT);
  if (matches?.[0]) {
    try {
      return normalizeAnyUrl(stripTrailingPunctuation(matches[0]));
    } catch {
      return null;
    }
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}([/:].*)?$/i.test(trimmed)) {
    try {
      return normalizeAnyUrl(withProtocol(trimmed));
    } catch {
      return null;
    }
  }

  return null;
}

export function extractUrlFromSharePayload(params: {
  url?: string;
  text?: string;
  title?: string;
}): string | null {
  if (params.url) {
    const fromUrl = extractUrl(params.url);
    if (fromUrl) return fromUrl;
  }

  const combined = [params.text, params.title].filter(Boolean).join("\n");
  return extractUrl(combined);
}

export function normalizeAnyUrl(raw: string): string {
  const url = new URL(withProtocol(raw.split("#")[0] ?? raw));
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Unsupported URL protocol");
  }

  const host = url.hostname.toLowerCase();
  if (isBlockedHost(host)) {
    throw new Error("This host is not allowed");
  }

  url.hash = "";
  if (host.includes("instagram.com")) {
    return normalizeInstagramUrl(url);
  }
  if (host.includes("youtube.com") || host === "youtu.be") {
    return url.toString();
  }

  return url.toString();
}

function isBlockedHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  if (host === "0.0.0.0" || host === "::1") return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}

function normalizeInstagramUrl(url: URL): string {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    return `https://www.instagram.com/${parts.join("/")}/`;
  }

  const [kind, code] = parts;
  const allowed = new Set(["reel", "reels", "p", "tv"]);
  if (!kind || !code || !allowed.has(kind)) {
    return `https://www.instagram.com/${parts.join("/")}/`;
  }

  const normalizedKind = kind === "reels" ? "reel" : kind;
  return `https://www.instagram.com/${normalizedKind}/${code}/`;
}

export function parseSourceUrl(raw: string): ParsedSourceUrl {
  const normalizedUrl = normalizeAnyUrl(raw);
  const url = new URL(normalizedUrl);
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();

  if (host.includes("instagram.com")) {
    if (path.includes("/reel/")) {
      return {
        normalizedUrl,
        host,
        sourceKind: "instagram",
        mediaKind: "reel",
        contentType: "video",
      };
    }
    if (path.includes("/tv/")) {
      return {
        normalizedUrl,
        host,
        sourceKind: "instagram",
        mediaKind: "post",
        contentType: "video",
      };
    }
    if (path.includes("/p/")) {
      return {
        normalizedUrl,
        host,
        sourceKind: "instagram",
        mediaKind: "post",
        contentType: "photo",
      };
    }
    return {
      normalizedUrl,
      host,
      sourceKind: "instagram",
      mediaKind: "unknown",
      contentType: "unknown",
    };
  }

  if (host.includes("youtube.com") || host === "youtu.be") {
    return {
      normalizedUrl,
      host,
      sourceKind: "youtube",
      mediaKind: path.includes("/shorts/") ? "reel" : "video",
      contentType: "video",
    };
  }

  if (host.includes("dzen.ru") || host.includes("zen.yandex")) {
    const isVideo = path.includes("/video/") || path.includes("/watch/");
    return {
      normalizedUrl,
      host,
      sourceKind: "dzen",
      mediaKind: isVideo ? "video" : "article",
      contentType: isVideo ? "video" : "article",
    };
  }

  if (host.includes("tiktok.com")) {
    return {
      normalizedUrl,
      host,
      sourceKind: "tiktok",
      mediaKind: "reel",
      contentType: "video",
    };
  }

  if (host.includes("t.me") || host.includes("telegram.")) {
    return {
      normalizedUrl,
      host,
      sourceKind: "telegram",
      mediaKind: "post",
      contentType: "unknown",
    };
  }

  if (host.includes("twitter.com") || host === "x.com") {
    return {
      normalizedUrl,
      host,
      sourceKind: "twitter",
      mediaKind: "post",
      contentType: "unknown",
    };
  }

  return {
    normalizedUrl,
    host,
    sourceKind: "article",
    mediaKind: "article",
    contentType: "article",
  };
}

export function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    }
    const fromQuery = parsed.searchParams.get("v");
    if (fromQuery) return fromQuery;
    const match = parsed.pathname.match(/\/(?:shorts|embed|live)\/([^/]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function sourceLabel(kind: SourceKind, mediaKind?: string): string {
  if (kind === "instagram" && mediaKind === "reel") return "Reels";
  if (kind === "instagram") return "Instagram";
  if (kind === "youtube") return "YouTube";
  if (kind === "dzen") return "Дзен";
  if (kind === "tiktok") return "TikTok";
  if (kind === "telegram") return "Telegram";
  if (kind === "twitter") return "X";
  if (kind === "article") return "Статья";
  return "Ссылка";
}

export function openSourceLabel(kind: SourceKind): string {
  if (kind === "instagram") return "Открыть в Instagram";
  if (kind === "youtube") return "Открыть на YouTube";
  if (kind === "dzen") return "Открыть в Дзене";
  if (kind === "tiktok") return "Открыть в TikTok";
  if (kind === "telegram") return "Открыть в Telegram";
  if (kind === "twitter") return "Открыть в X";
  return "Открыть источник";
}

/** @deprecated use extractUrl */
export const extractInstagramUrl = extractUrl;
/** @deprecated use parseSourceUrl */
export function parseInstagramUrl(raw: string) {
  return parseSourceUrl(raw);
}
export function normalizeInstagramUrlCompat(raw: string) {
  return normalizeAnyUrl(raw);
}

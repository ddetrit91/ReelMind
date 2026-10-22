import {
  cleanDisplayTitle,
  headlineFromText,
  isJunkTitle,
  isPlatformChromeTitle,
} from "@/lib/links/display-text";

type IgMeta = { title?: string; caption?: string; thumbnailUrl?: string };

function instagramShortcode(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.toLowerCase().includes("instagram.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const kind = parts[0] === "reels" ? "reel" : parts[0];
    const code = parts[1];
    if (!code || (kind !== "p" && kind !== "reel" && kind !== "tv")) return null;
    if (!/^[A-Za-z0-9_-]+$/.test(code)) return null;
    return code;
  } catch {
    return null;
  }
}

/**
 * Public poster for a photo, video, or reel.
 * `/p/{code}/media/?size=l` redirects to the image even when the link is a reel.
 * Returns nothing on login walls or private posts — caller keeps the category cover.
 */
async function fetchInstagramPreviewImage(url: string): Promise<string | undefined> {
  const code = instagramShortcode(url);
  if (!code) return undefined;

  try {
    const res = await fetch(`https://www.instagram.com/p/${code}/media/?size=l`, {
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
      headers: {
        Accept: "image/avif,image/webp,image/*,*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    if (res.status < 300 || res.status >= 400) return undefined;

    const location = res.headers.get("location");
    if (!location) return undefined;
    const absolute = new URL(location, "https://www.instagram.com").toString();
    if (/accounts\/login/i.test(absolute)) return undefined;
    if (!/fbcdn\.net|cdninstagram\.com/i.test(absolute)) return undefined;
    return absolute;
  } catch {
    return undefined;
  }
}

/**
 * Instagram has no separate video title (unlike YouTube).
 * Prefer user note for the card title; otherwise extract caption from oEmbed/OG.
 */
export async function fetchInstagramMetadata(
  url: string,
  shareText?: string,
): Promise<IgMeta> {
  const note = shareText?.trim() || undefined;
  let oembedTitle: string | undefined;
  let thumbnailUrl: string | undefined;

  const token = process.env.META_OEMBED_ACCESS_TOKEN;
  if (token) {
    try {
      const oembedUrl = new URL("https://graph.facebook.com/v19.0/instagram_oembed");
      oembedUrl.searchParams.set("url", url);
      oembedUrl.searchParams.set("access_token", token);
      const res = await fetch(oembedUrl.toString(), {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          title?: string;
          thumbnail_url?: string;
        };
        oembedTitle = data.title;
        thumbnailUrl = data.thumbnail_url;
      }
    } catch {
      // best-effort
    }
  }

  // Public oEmbed fallback (often blocked, but cheap to try when no token)
  if (!oembedTitle || !thumbnailUrl) {
    try {
      const publicOembed = new URL("https://api.instagram.com/oembed");
      publicOembed.searchParams.set("url", url);
      publicOembed.searchParams.set("omitscript", "true");
      const res = await fetch(publicOembed.toString(), {
        signal: AbortSignal.timeout(3000),
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          title?: string;
          thumbnail_url?: string;
        };
        oembedTitle = oembedTitle ?? data.title;
        thumbnailUrl = thumbnailUrl ?? data.thumbnail_url;
      }
    } catch {
      // ignore
    }
  }

  const cleanedFromOembed = oembedTitle
    ? cleanDisplayTitle(oembedTitle, {
        sourceKind: "instagram",
        fallback: "",
      })
    : "";

  const usableCaption =
    cleanedFromOembed &&
    !isJunkTitle(cleanedFromOembed, "instagram") &&
    !isPlatformChromeTitle(cleanedFromOembed, "instagram")
      ? cleanedFromOembed
      : headlineFromText(oembedTitle, 90) ?? undefined;

  if (!thumbnailUrl) {
    thumbnailUrl = await fetchInstagramPreviewImage(url);
  }

  // Note → title. Keep oEmbed text as caption when it is a real description.
  if (note) {
    const title =
      headlineFromText(note, 90) ??
      cleanDisplayTitle(note, {
        sourceKind: "instagram",
        shareText: note,
        fallback: "Instagram",
      });
    return {
      title,
      caption: usableCaption && usableCaption !== title ? usableCaption : note,
      thumbnailUrl,
    };
  }

  if (usableCaption) {
    return {
      title: headlineFromText(usableCaption, 90) ?? usableCaption,
      caption: usableCaption,
      thumbnailUrl,
    };
  }

  return {
    title: "Instagram",
    caption: "Instagram",
    thumbnailUrl,
  };
}

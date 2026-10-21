import {
  cleanDisplayTitle,
  headlineFromText,
  isJunkTitle,
  isPlatformChromeTitle,
} from "@/lib/links/display-text";

/**
 * Instagram has no separate video title (unlike YouTube).
 * oEmbed/OG usually return English chrome or "user on Instagram: caption…".
 * User note (shareText) always becomes the card title when present.
 */
export async function fetchInstagramMetadata(
  url: string,
  shareText?: string,
): Promise<{ title?: string; caption?: string; thumbnailUrl?: string }> {
  const captionFromShare = shareText?.trim() || undefined;
  let oembedTitle: string | undefined;
  let thumbnailUrl: string | undefined;

  const token = process.env.META_OEMBED_ACCESS_TOKEN;
  if (token) {
    try {
      const oembedUrl = new URL("https://graph.facebook.com/v19.0/instagram_oembed");
      oembedUrl.searchParams.set("url", url);
      oembedUrl.searchParams.set("access_token", token);
      const res = await fetch(oembedUrl.toString(), {
        signal: AbortSignal.timeout(2500),
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

  // Note → title. Never let English Instagram UI overwrite it.
  if (captionFromShare) {
    const title =
      headlineFromText(captionFromShare, 90) ??
      cleanDisplayTitle(captionFromShare, {
        sourceKind: "instagram",
        shareText: captionFromShare,
        fallback: "Instagram",
      });
    return {
      title,
      caption: cleanDisplayTitle(captionFromShare, {
        sourceKind: "instagram",
        fallback: title,
      }),
      thumbnailUrl,
    };
  }

  const usableOembed =
    oembedTitle &&
    !isJunkTitle(oembedTitle, "instagram") &&
    !isPlatformChromeTitle(oembedTitle, "instagram")
      ? oembedTitle
      : undefined;

  const title =
    headlineFromText(usableOembed, 90) ??
    (usableOembed
      ? cleanDisplayTitle(usableOembed, {
          sourceKind: "instagram",
          fallback: "Instagram",
        })
      : "Instagram");

  // If cleaning collapsed to chrome / empty — keep neutral label, not English UI.
  const safeTitle =
    !title || isJunkTitle(title, "instagram") || isPlatformChromeTitle(title, "instagram")
      ? "Instagram"
      : title;

  return {
    title: safeTitle,
    caption: usableOembed
      ? cleanDisplayTitle(usableOembed, {
          sourceKind: "instagram",
          fallback: safeTitle,
        })
      : safeTitle,
    thumbnailUrl,
  };
}

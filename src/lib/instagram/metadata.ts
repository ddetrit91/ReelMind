import { cleanDisplayTitle, headlineFromText } from "@/lib/links/display-text";

/**
 * Instagram has no separate video title (unlike YouTube).
 * oEmbed/OG usually return "user on Instagram: caption…" — we turn that into a short headline.
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

  const fullCaption = cleanDisplayTitle(oembedTitle ?? captionFromShare, {
    sourceKind: "instagram",
    shareText: captionFromShare,
    fallback: "Instagram",
  });

  // Prefer a short headline for the card title; keep fuller text as caption.
  const title =
    headlineFromText(captionFromShare, 90) ??
    headlineFromText(oembedTitle, 90) ??
    fullCaption;

  const caption = captionFromShare
    ? cleanDisplayTitle(captionFromShare, {
        sourceKind: "instagram",
        fallback: title,
      })
    : fullCaption;

  return {
    title,
    caption,
    thumbnailUrl,
  };
}

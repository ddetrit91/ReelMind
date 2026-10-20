/** Превью поста/Reels — best-effort через Instagram oEmbed; иначе UI fallback без категорийных stock-фото. */
export async function fetchInstagramMetadata(
  url: string,
  shareText?: string,
): Promise<{ title?: string; caption?: string; thumbnailUrl?: string }> {
  const captionFromShare = shareText?.trim() || undefined;
  let title: string | undefined;
  let thumbnailUrl: string | undefined;

  const token = process.env.META_OEMBED_ACCESS_TOKEN;
  if (token) {
    try {
      const oembedUrl = new URL("https://graph.facebook.com/v19.0/instagram_oembed");
      oembedUrl.searchParams.set("url", url);
      oembedUrl.searchParams.set("access_token", token);
      const res = await fetch(oembedUrl.toString(), { next: { revalidate: 0 } });
      if (res.ok) {
        const data = (await res.json()) as {
          title?: string;
          thumbnail_url?: string;
        };
        title = data.title;
        thumbnailUrl = data.thumbnail_url;
      }
    } catch {
      // best-effort
    }
  }

  return {
    title,
    caption: captionFromShare ?? title,
    thumbnailUrl,
  };
}

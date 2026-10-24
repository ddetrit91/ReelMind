import { categoryCoverUrl } from "@/lib/categories";
import { matchCoverFromText } from "@/lib/cover-themes";

export function coverFromText(
  title?: string | null,
  hint?: string | null,
  categorySlug?: string,
): { url: string; specific: boolean } {
  const thematic = matchCoverFromText(title, hint);
  if (thematic) return thematic;
  return { url: categoryCoverUrl(categorySlug ?? "other"), specific: false };
}

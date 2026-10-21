import type { SourceKind } from "@/lib/links/parse-url";

/** Широкие превью (16:9), а не портрет как у Reels. */
export function isWidePreview(sourceKind?: SourceKind | string): boolean {
  return (
    sourceKind === "youtube" ||
    sourceKind === "dzen" ||
    sourceKind === "article" ||
    sourceKind === "twitter"
  );
}

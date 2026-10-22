export const instant = false;

import { redirect } from "next/navigation";

import { ShareIngestClient } from "@/components/ShareIngestClient";
import { requireUser } from "@/lib/auth/session";
import { noteFromSharePayload } from "@/lib/links/share-content";

type PageProps = {
  searchParams: Promise<{
    url?: string;
    text?: string;
    title?: string;
  }>;
};

export default async function SharePage({ searchParams }: PageProps) {
  await requireUser("/share");
  const params = await searchParams;
  const { url: sourceUrl, note } = noteFromSharePayload(params);

  // Empty share / iOS fallback → add form (prefill note if any)
  if (!sourceUrl) {
    const qs = new URLSearchParams();
    if (note) qs.set("text", note);
    else if (params.text) qs.set("text", params.text);
    if (params.title) qs.set("title", params.title);
    const suffix = qs.toString();
    redirect(suffix ? `/add?${suffix}` : "/add");
  }

  return <ShareIngestClient url={sourceUrl} text={note || undefined} />;
}

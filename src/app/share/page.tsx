export const instant = false;

import { redirect } from "next/navigation";

import { IngestStatus } from "@/components/IngestStatus";
import { requireUser } from "@/lib/auth/session";
import { processIngest } from "@/lib/ingest/process-ingest";
import { noteFromSharePayload } from "@/lib/links/share-content";

type PageProps = {
  searchParams: Promise<{
    url?: string;
    text?: string;
    title?: string;
  }>;
};

export default async function SharePage({ searchParams }: PageProps) {
  const user = await requireUser("/share");
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

  const result = await processIngest({
    url: sourceUrl,
    text: note || undefined,
    userId: user.id,
  });

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <IngestStatus state="error" message={result.error} />
        <p className="mt-4 text-center text-sm text-ink-muted">
          <a href="/add" className="font-medium text-accent hover:underline">
            Открыть форму добавления
          </a>
        </p>
      </div>
    );
  }

  redirect(`/items/${result.id}`);
}

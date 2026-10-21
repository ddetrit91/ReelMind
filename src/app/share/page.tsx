export const instant = false;

import { redirect } from "next/navigation";

import { IngestStatus } from "@/components/IngestStatus";
import { requireUser } from "@/lib/auth/session";
import { extractUrlFromSharePayload } from "@/lib/links/parse-url";
import { processIngest } from "@/lib/ingest/process-ingest";

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
  const sourceUrl = extractUrlFromSharePayload(params);

  // Empty share / iOS fallback → add form with clipboard paste
  if (!sourceUrl) {
    const qs = new URLSearchParams();
    if (params.text) qs.set("text", params.text);
    if (params.title) qs.set("title", params.title);
    const suffix = qs.toString();
    redirect(suffix ? `/add?${suffix}` : "/add");
  }

  const result = await processIngest({
    url: sourceUrl,
    text: params.text ?? params.title,
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

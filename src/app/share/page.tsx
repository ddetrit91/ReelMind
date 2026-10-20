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

  if (!sourceUrl) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <IngestStatus
          state="error"
          message="В share не найдена ссылка. Откройте «Добавить» и вставьте URL вручную."
        />
      </div>
    );
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
      </div>
    );
  }

  redirect(`/items/${result.id}`);
}

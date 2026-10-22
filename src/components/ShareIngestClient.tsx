"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { IngestStatus } from "@/components/IngestStatus";
import { useIngestProgress } from "@/hooks/useIngestProgress";
import { ingestLink } from "@/lib/api-client";

type Props = {
  url: string;
  text?: string;
};

/** PWA share_target: show progress while the same ingest API runs as on /add. */
export function ShareIngestClient({ url, text }: Props) {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const progress = useIngestProgress(!error, url);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        const result = await ingestLink({
          url,
          text: text?.trim() || undefined,
        });
        router.replace(`/items/${result.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось сохранить");
      }
    })();
  }, [router, text, url]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <IngestStatus state="error" message={error} />
        <p className="mt-4 text-center text-sm text-ink-muted">
          <Link href={`/add?url=${encodeURIComponent(url)}`} className="font-medium text-accent hover:underline">
            Открыть форму добавления
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <IngestStatus
        state="loading"
        variant="page"
        message={progress.message}
        detail={progress.detail}
      />
      <p className="mt-4 text-center text-xs text-ink-muted">
        <Link href={`/add?url=${encodeURIComponent(url)}`} className="font-medium text-accent hover:underline">
          Открыть форму добавления
        </Link>
      </p>
    </div>
  );
}

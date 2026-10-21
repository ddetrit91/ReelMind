"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  itemId: string;
  status: string;
};

/** Soft-refresh item page while background ingest enrichment finishes. */
export function ItemReadyPoller({ itemId, status }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (status !== "processing") return;

    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/items/${encodeURIComponent(itemId)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { item?: { status?: string } };
        if (cancelled) return;
        if (json.item?.status && json.item.status !== "processing") {
          router.refresh();
          return;
        }
      } catch {
        // ignore transient errors
      }
      if (!cancelled && attempts < 12) {
        window.setTimeout(() => void tick(), 700);
      }
    };

    const t = window.setTimeout(() => void tick(), 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [itemId, router, status]);

  if (status !== "processing") return null;

  return (
    <p className="mb-4 rounded-[var(--radius-md)] border border-line bg-accent-soft/50 px-3 py-2 text-sm text-ink-muted">
      Уточняем заголовок и категорию…
    </p>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type MouseEvent } from "react";

import { TrashIcon } from "@/components/icons";

type Props = {
  itemId: string;
  /** Catalog path after delete from detail page (e.g. `/?category=other`). */
  returnTo?: string;
  variant?: "icon" | "button";
  /** Fires only after the server confirms deletion. */
  onDeleted?: (itemId: string) => void;
  /** Optional optimistic hide before the request finishes. */
  onDeleteStart?: (itemId: string) => void;
  /** Undo optimistic hide if the request fails. */
  onDeleteFailed?: (itemId: string) => void;
};

export function DeleteItemButton({
  itemId,
  returnTo,
  variant = "icon",
  onDeleted,
  onDeleteStart,
  onDeleteFailed,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    if (!itemId) return;
    if (!window.confirm("Удалить эту ссылку из каталога?")) return;

    setError(null);
    onDeleteStart?.(itemId);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/items/${encodeURIComponent(itemId)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          onDeleteFailed?.(itemId);
          setError(data.error ?? "Не удалось удалить");
          return;
        }
        onDeleted?.(itemId);
      } catch {
        onDeleteFailed?.(itemId);
        setError("Не удалось удалить");
        return;
      }

      if (variant === "button") {
        const dest = returnTo?.startsWith("/") ? returnTo : "/";
        router.replace(dest);
      }
    });
  }

  if (variant === "button") {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line px-4 text-sm font-medium text-ink hover:bg-paper-deep disabled:opacity-60"
        >
          <TrashIcon className="h-4 w-4" />
          {pending ? "Удаляем…" : "Удалить ссылку"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      aria-label="Удалить ссылку"
      title={error ?? "Удалить"}
      className="focus-ring absolute right-2.5 top-2.5 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface/95 text-ink shadow-sm hover:bg-paper disabled:opacity-60"
    >
      <TrashIcon className={`h-4 w-4 ${pending ? "animate-pulse" : ""}`} />
    </button>
  );
}

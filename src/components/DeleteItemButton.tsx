"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type MouseEvent } from "react";

import { TrashIcon } from "@/components/icons";
import { deleteItemAction } from "@/lib/actions";

type Props = {
  itemId: string;
  /** Catalog path after delete from detail page (e.g. `/?category=other`). */
  returnTo?: string;
  variant?: "icon" | "button";
  onDeleted?: (itemId: string) => void;
};

export function DeleteItemButton({
  itemId,
  returnTo,
  variant = "icon",
  onDeleted,
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
    startTransition(async () => {
      const result = await deleteItemAction(itemId);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      onDeleted?.(itemId);

      if (variant === "button") {
        const dest = returnTo?.startsWith("/") ? returnTo : "/";
        router.replace(dest);
        router.refresh();
        return;
      }

      // Card on catalog: hide immediately, then refresh counts.
      router.refresh();
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

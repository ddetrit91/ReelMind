"use client";

import { useTransition, type MouseEvent } from "react";

import { TrashIcon } from "@/components/icons";
import { deleteItemAction } from "@/lib/actions";

type Props = {
  itemId: string;
  returnTo?: string;
  variant?: "icon" | "button";
};

export function DeleteItemButton({ itemId, returnTo = "/", variant = "icon" }: Props) {
  const [pending, startTransition] = useTransition();

  function onDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm("Удалить эту ссылку из каталога?")) return;
    startTransition(async () => {
      await deleteItemAction(itemId, returnTo);
    });
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line px-4 text-sm font-medium text-ink hover:bg-paper-deep disabled:opacity-60"
      >
        <TrashIcon className="h-4 w-4" />
        {pending ? "Удаляем…" : "Удалить ссылку"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      aria-label="Удалить ссылку"
      className="focus-ring absolute right-2.5 top-2.5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface/95 text-ink shadow-sm hover:bg-paper disabled:opacity-60"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { updateCategoryAction } from "@/lib/actions";
import type { CategoryWithCount } from "@/lib/data/items";

type Props = {
  itemId: string;
  categories: CategoryWithCount[];
  currentSlug: string;
};

export function CategorySelect({ itemId, categories, currentSlug }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-ink">Категория</span>
      <select
        defaultValue={currentSlug}
        disabled={pending}
        className="focus-ring min-h-11 w-full rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-2 text-base text-ink"
        onChange={(e) => {
          const slug = e.target.value;
          startTransition(async () => {
            await updateCategoryAction(itemId, slug);
            router.refresh();
          });
        }}
      >
        {categories.map((cat) => (
          <option key={cat.id} value={cat.slug}>
            {cat.emoji} {cat.name}
          </option>
        ))}
      </select>
    </label>
  );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { ingestFromForm } from "@/lib/actions";
import type { CategoryWithCount } from "@/lib/data/items";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold disabled:opacity-60"
    >
      {pending ? "Сохраняем…" : "Сохранить и разложить по категории"}
    </button>
  );
}

type Props = {
  categories: CategoryWithCount[];
};

export function AddLinkForm({ categories }: Props) {
  const [state, formAction] = useActionState(ingestFromForm, undefined);

  return (
    <form
      action={formAction}
      className="card-surface flex flex-col gap-5 rounded-[var(--radius-lg)] p-5 lg:max-w-xl lg:p-7"
    >
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink">Ссылка</span>
        <input
          name="url"
          type="url"
          required
          placeholder="https://… Instagram, YouTube, статья"
          className="focus-ring min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-faint"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink">Заметка или подпись</span>
        <textarea
          name="text"
          rows={4}
          placeholder="Необязательно. Помогает точнее выбрать категорию"
          className="focus-ring rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-faint"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink">Категория</span>
        <select
          name="categorySlug"
          defaultValue=""
          className="focus-ring min-h-11 w-full rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-2 text-base text-ink"
        >
          <option value="">Автоматически — ИИ по ссылке и заметке</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.emoji} {cat.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-ink-muted">
          Оставьте «Автоматически», если тема понятна. Выберите раздел сами, если ИИ может ошибиться.
        </span>
      </label>
      {state?.error ? (
        <p className="rounded-[var(--radius-sm)] bg-accent-soft px-3 py-2 text-sm text-ink">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import { createCategory } from "@/lib/api-client";
import { CATEGORY_EMOJI_CHOICES } from "@/lib/categories";
import type { CategoryWithCount } from "@/lib/data/items";

type Props = {
  variant: "sidebar" | "rail" | "form";
  onCreated?: (category: CategoryWithCount) => void;
};

export function AddCategoryControl({ variant, onCreated }: Props) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>(CATEGORY_EMOJI_CHOICES[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, pending]);

  function reset() {
    setName("");
    setEmoji(CATEGORY_EMOJI_CHOICES[0]);
    setError(null);
  }

  function close() {
    if (pending) return;
    setOpen(false);
    reset();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const category = await createCategory({ name, emoji });
      onCreated?.(category);
      setOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать");
    } finally {
      setPending(false);
    }
  }

  const triggerClass =
    variant === "rail"
      ? "focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-line px-4 py-2.5 text-sm font-medium text-ink-muted min-h-11 hover:bg-accent-soft hover:text-ink"
      : variant === "form"
        ? "focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-line bg-paper px-3 text-sm font-medium text-ink-muted hover:bg-accent-soft hover:text-ink"
        : "focus-ring mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-line px-3 text-sm font-medium text-ink-muted hover:bg-accent-soft hover:text-ink";

  const dialog =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-ink/40 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              aria-label="Закрыть"
              onClick={close}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="card-surface relative z-10 my-auto w-full max-w-md max-h-[min(36rem,calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] overflow-y-auto rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow)] lg:max-h-[min(40rem,calc(100dvh-4rem))] lg:p-6"
            >
              <h2
                id={titleId}
                className="font-display text-xl font-semibold tracking-tight text-ink"
              >
                Новая категория
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Только для вас. Gemini сможет относить сюда подходящие ссылки.
              </p>

              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-ink">Название</span>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={48}
                    required
                    minLength={2}
                    placeholder="Например: Кулинария"
                    className="focus-ring min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-faint"
                  />
                </label>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-ink">Значок</legend>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_EMOJI_CHOICES.map((choice) => {
                      const active = choice === emoji;
                      return (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => setEmoji(choice)}
                          className={[
                            "focus-ring inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border text-lg",
                            active
                              ? "border-accent bg-accent-soft"
                              : "border-line bg-paper hover:bg-accent-soft",
                          ].join(" ")}
                          aria-pressed={active}
                          aria-label={`Значок ${choice}`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {error ? (
                  <p className="rounded-[var(--radius-sm)] bg-accent-soft px-3 py-2 text-sm text-ink">
                    {error}
                  </p>
                ) : null}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={close}
                    disabled={pending}
                    className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-md)] border border-line px-4 text-sm font-medium text-ink hover:bg-surface disabled:opacity-60"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={pending || name.trim().length < 2}
                    className="btn-primary focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-semibold disabled:opacity-60"
                  >
                    {pending ? "Создаём…" : "Создать"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button type="button" className={triggerClass} onClick={() => setOpen(true)}>
        <span aria-hidden className="text-base leading-none">
          +
        </span>
        {variant === "rail" ? "Категория" : "Добавить категорию"}
      </button>
      {dialog}
    </>
  );
}

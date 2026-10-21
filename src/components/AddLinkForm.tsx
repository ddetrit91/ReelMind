"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { ingestFromForm } from "@/lib/actions";
import type { CategoryWithCount } from "@/lib/data/items";
import { extractUrl } from "@/lib/links/parse-url";

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

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

type Props = {
  categories: CategoryWithCount[];
  initialUrl?: string;
  initialText?: string;
};

export function AddLinkForm({ categories, initialUrl = "", initialText = "" }: Props) {
  const [state, formAction] = useActionState(ingestFromForm, undefined);
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const [pasteHint, setPasteHint] = useState<string | null>(null);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    setShowIosTip(isIosDevice());
  }, []);

  const applyClipboard = useCallback(async (silent = false) => {
    try {
      if (!navigator.clipboard?.readText) {
        if (!silent) setPasteHint("Буфер недоступен. Вставьте ссылку вручную (долгий тап → Вставить).");
        return false;
      }
      const raw = await navigator.clipboard.readText();
      const found = extractUrl(raw);
      if (found) {
        setUrl(found);
        if (!text.trim() && raw.trim() !== found) {
          setText(raw.trim().slice(0, 500));
        }
        setPasteHint("Ссылка вставлена из буфера");
        return true;
      }
      if (!silent) {
        setPasteHint(
          raw.trim()
            ? "В буфере нет ссылки. В Instagram: Поделиться → Скопировать ссылку."
            : "Буфер пуст. Сначала скопируйте ссылку в Instagram.",
        );
      }
      return false;
    } catch {
      if (!silent) {
        setPasteHint("Разрешите доступ к буферу или вставьте ссылку вручную.");
      }
      return false;
    }
  }, [text]);

  // When returning to the app from Instagram (iOS), try clipboard once if field empty.
  useEffect(() => {
    if (!isIosDevice() || url.trim()) return;

    const tryPaste = () => {
      if (document.visibilityState === "visible" && !url.trim()) {
        void applyClipboard(true);
      }
    };

    document.addEventListener("visibilitychange", tryPaste);
    window.addEventListener("focus", tryPaste);
    // First open of /add on iOS
    const t = window.setTimeout(() => void applyClipboard(true), 400);
    return () => {
      document.removeEventListener("visibilitychange", tryPaste);
      window.removeEventListener("focus", tryPaste);
      window.clearTimeout(t);
    };
  }, [applyClipboard, url]);

  return (
    <div className="space-y-4 lg:max-w-xl">
      {showIosTip ? (
        <div
          className="rounded-[var(--radius-lg)] border border-line bg-accent-soft/60 p-4 text-sm leading-relaxed text-ink"
          role="note"
        >
          <p className="font-display text-sm font-semibold text-ink">Instagram на iPhone</p>
          <p className="mt-1.5 text-ink-muted">
            Apple не показывает PWA в меню «Поделиться» Instagram — это ограничение iOS, не
            ReelMind. Рабочий путь:
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-muted">
            <li>В Instagram: Поделиться → <strong className="text-ink">Скопировать ссылку</strong></li>
            <li>Откройте ReelMind с домашнего экрана</li>
            <li>Нажмите «Вставить из буфера» ниже (или поле само подхватит ссылку)</li>
          </ol>
        </div>
      ) : (
        <div
          className="rounded-[var(--radius-lg)] border border-line bg-surface p-4 text-sm leading-relaxed text-ink-muted"
          role="note"
        >
          На Android после установки PWA ReelMind появится в «Поделиться» Instagram. На iPhone —
          только через «Скопировать ссылку» и вставку сюда.
        </div>
      )}

      <form
        action={formAction}
        className="card-surface flex flex-col gap-5 rounded-[var(--radius-lg)] p-5 lg:p-7"
      >
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-ink">Ссылка</span>
          <input
            name="url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… Instagram, YouTube, статья"
            className="focus-ring min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-faint"
            autoComplete="url"
            inputMode="url"
            enterKeyHint="done"
          />
          <button
            type="button"
            onClick={() => void applyClipboard(false)}
            className="focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-line bg-paper px-4 text-sm font-medium text-ink hover:bg-accent-soft"
          >
            Вставить из буфера
          </button>
          {pasteHint ? <p className="text-xs text-ink-muted">{pasteHint}</p> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-ink">Заметка или подпись</span>
          <textarea
            name="text"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
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
    </div>
  );
}

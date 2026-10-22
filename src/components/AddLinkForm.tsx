"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { ingestLink } from "@/lib/api-client";
import type { CategoryWithCount } from "@/lib/data/items";
import { headlineFromText } from "@/lib/links/display-text";
import { extractUrl } from "@/lib/links/parse-url";
import { splitUrlAndNote } from "@/lib/links/share-content";

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

type Props = {
  categories: CategoryWithCount[];
  initialUrl?: string;
  initialText?: string;
  /** Remount/reset key from the page (e.g. searchParams signature). */
  formKey?: string;
};

export function AddLinkForm({
  categories,
  initialUrl = "",
  initialText = "",
  formKey = "",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const [categorySlug, setCategorySlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pasteHint, setPasteHint] = useState<string | null>(null);
  const [showIosTip, setShowIosTip] = useState(false);
  const autoPasteDone = useRef(false);
  const skipNextAutoPaste = useRef(false);

  const resetForm = useCallback(
    (nextUrl = "", nextText = "") => {
      setUrl(nextUrl);
      setText(nextText);
      setCategorySlug("");
      setError(null);
      setPasteHint(null);
    },
    [],
  );

  useEffect(() => {
    setShowIosTip(isIosDevice());
  }, []);

  // Always sync to server props when opening /add (fixes stale URL after 2nd visit)
  useEffect(() => {
    resetForm(initialUrl, initialText);
    autoPasteDone.current = false;

    if (initialUrl || !initialText) return;
    const split = splitUrlAndNote(initialText);
    if (split.url) {
      setUrl(split.url);
      if (split.note) setText(split.note);
    }
  }, [formKey, initialUrl, initialText, resetForm]);

  const titlePreview = useMemo(() => headlineFromText(text, 90), [text]);
  const isInstagram = /instagram\.com/i.test(url);
  const needsNoteHint = Boolean(url.trim()) && !text.trim() && isInstagram;

  const applyClipboard = useCallback(async (silent = false) => {
    try {
      if (!navigator.clipboard?.readText) {
        if (!silent) {
          setPasteHint("Буфер недоступен. Вставьте ссылку вручную (долгий тап → Вставить).");
        }
        return false;
      }
      const raw = await navigator.clipboard.readText();
      const { url: found, note } = splitUrlAndNote(raw);
      if (found) {
        setUrl(found);
        if (note) {
          setText((prev) => (prev.trim() ? prev : note.slice(0, 800)));
          setPasteHint("Ссылка и текст из буфера подставлены");
        } else {
          setPasteHint(
            /instagram\.com/i.test(found)
              ? "Ссылка вставлена. Instagram редко кладёт подпись в буфер — напишите заметку ниже, из неё сделаем заголовок."
              : "Ссылка вставлена из буфера",
          );
        }
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
  }, []);

  // iOS: one auto-paste per fresh empty form (not after we just saved)
  useEffect(() => {
    if (!isIosDevice() || url.trim() || initialUrl.trim()) return;
    if (autoPasteDone.current || skipNextAutoPaste.current) {
      skipNextAutoPaste.current = false;
      return;
    }

    const tryPaste = () => {
      if (document.visibilityState !== "visible" || url.trim() || autoPasteDone.current) return;
      autoPasteDone.current = true;
      void applyClipboard(true);
    };

    document.addEventListener("visibilitychange", tryPaste);
    window.addEventListener("focus", tryPaste);
    const t = window.setTimeout(tryPaste, 200);
    return () => {
      document.removeEventListener("visibilitychange", tryPaste);
      window.removeEventListener("focus", tryPaste);
      window.clearTimeout(t);
    };
  }, [applyClipboard, url, initialUrl, formKey]);

  function onUrlChange(value: string) {
    const split = splitUrlAndNote(value);
    if (split.url && split.note) {
      setUrl(split.url);
      setText((prev) => (prev.trim() ? prev : split.note));
      return;
    }
    setUrl(value);
  }

  function onPasteUrl(event: React.ClipboardEvent<HTMLInputElement>) {
    const raw = event.clipboardData.getData("text");
    const split = splitUrlAndNote(raw);
    if (!split.url) return;
    event.preventDefault();
    setUrl(split.url);
    if (split.note) {
      setText((prev) => (prev.trim() ? prev : split.note.slice(0, 800)));
      setPasteHint("Из вставки взяли ссылку и текст — текст станет заголовком, если Instagram молчит");
    } else if (/instagram\.com/i.test(split.url)) {
      setPasteHint("Ссылка есть. Добавьте заметку — так карточка получит нормальный заголовок.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);

    const cleaned = splitUrlAndNote([url, text].filter(Boolean).join("\n"));
    const finalUrl = cleaned.url ?? extractUrl(url) ?? url.trim();
    const finalNote = cleaned.note || text.trim();

    if (!finalUrl) {
      setError("Вставьте ссылку");
      return;
    }

    startTransition(async () => {
      try {
        const result = await ingestLink({
          url: finalUrl,
          text: finalNote || undefined,
          categorySlug: categorySlug || undefined,
        });
        // Clear before navigate so the next visit to /add is empty
        skipNextAutoPaste.current = true;
        resetForm();
        try {
          sessionStorage.setItem("reelmind:add-form-cleared", String(Date.now()));
        } catch {
          // ignore
        }
        router.replace(`/items/${result.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось сохранить");
      }
    });
  }

  return (
    <div className="space-y-4 lg:max-w-xl">
      {showIosTip ? (
        <div
          className="rounded-[var(--radius-lg)] border border-line bg-accent-soft/60 p-4 text-sm leading-relaxed text-ink"
          role="note"
        >
          <p className="font-display text-sm font-semibold text-ink">Instagram на iPhone</p>
          <p className="mt-1.5 text-ink-muted">
            В меню «Поделиться» Instagram PWA не появляется (ограничение Apple). Если подпись не
            подтянулась сама — кратко опишите ролик в заметке: из неё сделаем заголовок карточки.
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-muted">
            <li>
              Instagram → Поделиться → <strong className="text-ink">Скопировать ссылку</strong>
            </li>
            <li>«Вставить из буфера» ниже</li>
            <li>Если заголовка нет — напишите заметку (1–2 фразы)</li>
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
        key={formKey || "add-form"}
        onSubmit={onSubmit}
        className="card-surface flex flex-col gap-5 rounded-[var(--radius-lg)] p-5 lg:p-7"
      >
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-ink">Ссылка</span>
          <input
            name="url"
            type="url"
            required
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onPaste={onPasteUrl}
            placeholder="https://… Instagram, YouTube, статья"
            className="focus-ring min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-faint"
            autoComplete="off"
            inputMode="url"
            enterKeyHint="done"
            autoCorrect="off"
            spellCheck={false}
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
          <span className="font-medium text-ink">
            Заметка{" "}
            {isInstagram ? (
              <span className="font-normal text-ink-muted">(если Instagram не отдал описание)</span>
            ) : (
              <span className="font-normal text-ink-muted">(необязательно)</span>
            )}
          </span>
          <textarea
            name="text"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              isInstagram
                ? "Напишите, о чём ролик — это станет заголовком карточки"
                : "Необязательно. Помогает с категорией"
            }
            className="focus-ring rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-faint"
            autoComplete="off"
          />
          {needsNoteHint ? (
            <p className="text-xs text-ink-muted">
              Instagram часто не отдаёт заголовок. Короткая заметка → нормальное имя карточки.
            </p>
          ) : null}
          {titlePreview && isInstagram ? (
            <p className="text-xs text-ink-muted">
              Заголовок карточки:{" "}
              <span className="font-medium text-ink">«{titlePreview}»</span>
            </p>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-ink">Категория</span>
          <select
            name="categorySlug"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="focus-ring min-h-11 w-full rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-2 text-base text-ink"
          >
            <option value="">Автоматически — ИИ по ссылке и заметке</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
          <p className="text-xs leading-relaxed text-ink-muted">
            Оставьте «Автоматически», если тема понятна. Выберите раздел сами, если ИИ может
            ошибиться.
          </p>
        </label>

        {error ? (
          <p className="rounded-[var(--radius-sm)] bg-accent-soft px-3 py-2 text-sm text-ink">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="btn-primary focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {pending ? "Сохраняем…" : "Сохранить"}
        </button>
      </form>
    </div>
  );
}

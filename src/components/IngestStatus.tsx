type Props = {
  state: "loading" | "error" | "success";
  message?: string;
  detail?: string;
  variant?: "page" | "inline";
};

export function IngestStatus({
  state,
  message,
  detail,
  variant = "page",
}: Props) {
  if (state === "loading") {
    const shell =
      variant === "page"
        ? "card-surface flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] px-6 text-center"
        : "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-line bg-accent-soft/40 px-4 py-8 text-center";

    return (
      <div className={shell} role="status" aria-live="polite" aria-busy="true">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent"
          aria-hidden
        />
        <div className="space-y-1">
          <p className="text-sm font-medium text-ink">
            {message ?? "Сохраняем и выбираем категорию…"}
          </p>
          {detail ? (
            <p className="max-w-sm text-xs leading-relaxed text-ink-muted">{detail}</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="card-surface mx-auto max-w-md rounded-[var(--radius-lg)] p-6 text-center">
        <p className="text-sm font-medium text-ink">{message ?? "Не удалось обработать ссылку"}</p>
      </div>
    );
  }

  return (
    <div className="card-surface mx-auto max-w-md rounded-[var(--radius-lg)] p-6 text-center">
      <p className="text-sm text-ink-muted">{message ?? "Готово"}</p>
    </div>
  );
}

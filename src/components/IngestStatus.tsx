type Props = {
  state: "loading" | "error" | "success";
  message?: string;
};

export function IngestStatus({ state, message }: Props) {
  if (state === "loading") {
    return (
      <div className="card-surface flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] px-6 text-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-ink-muted">Сохраняем и выбираем категорию…</p>
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

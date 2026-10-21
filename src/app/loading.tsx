export default function CatalogLoading() {
  return (
    <div className="min-h-dvh lg:flex">
      <aside className="hidden lg:block lg:w-[272px] lg:shrink-0 lg:border-r lg:border-line lg:bg-surface/50" />
      <div className="flex flex-1 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] lg:px-10 lg:pt-9">
        <div className="mx-auto w-full max-w-6xl space-y-5">
          <div className="h-8 w-40 animate-pulse rounded-md bg-line/70" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-line/50" />
          <div className="h-11 w-full animate-pulse rounded-[var(--radius-md)] bg-line/40" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-[var(--radius-md)] bg-line/35"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

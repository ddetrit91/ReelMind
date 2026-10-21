export default function CatalogLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-10">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-md bg-paper-deep" />
      <div className="mb-6 h-11 w-full max-w-xl animate-pulse rounded-[var(--radius-md)] bg-paper-deep" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/5] animate-pulse rounded-[var(--radius-lg)] bg-paper-deep"
          />
        ))}
      </div>
    </div>
  );
}

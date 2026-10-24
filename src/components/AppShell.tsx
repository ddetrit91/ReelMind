"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { UserAccountBlock } from "@/components/UserAccountBlock";
import { CategoryNav } from "@/components/CategoryNav";
import { BookmarkMark, GridIcon, PlusIcon, ShieldIcon } from "@/components/icons";
import { Onboarding, OnboardingTrigger } from "@/components/Onboarding";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { AuthUser } from "@/lib/auth/session";
import type { CategoryWithCount } from "@/lib/data/items";

type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  categories?: CategoryWithCount[];
  activeCategorySlug?: string;
  totalItems?: number;
  searchQuery?: string;
  user?: AuthUser | null;
  onSelectCategory?: (slug: string | undefined) => void;
  onCategoryCreated?: (category: CategoryWithCount) => void;
};

export function AppShell({
  children,
  title,
  subtitle,
  categories = [],
  activeCategorySlug,
  totalItems = 0,
  searchQuery,
  user,
  onSelectCategory,
  onCategoryCreated,
}: Props) {
  const pageTitle = title ?? "Каталог";
  const pathname = usePathname();
  const router = useRouter();

  function handleCategoryCreated(category: CategoryWithCount) {
    if (onCategoryCreated) {
      onCategoryCreated(category);
      return;
    }
    router.refresh();
  }

  function onCatalogClick(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== "/" || !onSelectCategory) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    onSelectCategory(undefined);
  }

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:max-h-dvh lg:w-[272px] lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-r lg:border-line lg:bg-surface/70 lg:backdrop-blur-md">
        {/* Inner scroller keeps aside width fixed (no layout shift) and hosts themed scrollbar. */}
        <div className="sidebar-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 py-7">
          <Link
            href="/"
            prefetch
            onClick={onCatalogClick}
            className="focus-ring mb-8 flex items-start gap-3 rounded-[var(--radius-sm)] p-1"
          >
            <BookmarkMark className="mt-0.5 h-9 w-9 text-accent" />
            <span>
              <span className="font-display block text-[1.05rem] font-semibold leading-tight tracking-tight text-ink">
                ReelMind
              </span>
              <span className="mt-1 block text-sm leading-snug text-ink-muted">
                Архив ссылок по смыслу, не по ленте
              </span>
            </span>
          </Link>
        <CategoryNav
          categories={categories}
          activeSlug={activeCategorySlug}
          totalCount={totalItems}
          variant="sidebar"
          searchQuery={searchQuery}
          onSelectCategory={onSelectCategory}
          onCategoryCreated={handleCategoryCreated}
        />
        <div className="mt-auto space-y-4 pt-8">
            {user?.role === "admin" ? (
              <Link
                href="/admin"
                prefetch
                className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-paper px-4 text-sm font-medium text-ink hover:bg-accent-soft"
              >
                <ShieldIcon className="h-5 w-5 text-accent" />
                Админка
              </Link>
            ) : null}
            <Link
              href="/add"
              prefetch
              className="btn-primary focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold"
            >
              <PlusIcon className="h-4 w-4" />
              Добавить ссылку
            </Link>
            <div className="space-y-3">
              {user ? <UserAccountBlock user={user} variant="sidebar" /> : null}
              <div className="flex items-center gap-1">
                <OnboardingTrigger />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/85 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md lg:static lg:border-none lg:bg-transparent lg:pb-0 lg:pt-9">
          {/* Same max-w + px as <main> so title aligns with search & cards on desktop */}
          <div className="mx-auto w-full min-w-0 max-w-6xl space-y-3 px-4 lg:px-10">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <div className="flex min-w-0 items-center gap-2">
                <BookmarkMark className="h-8 w-8 shrink-0 text-accent" />
                <span className="font-display text-base font-semibold tracking-tight text-ink">
                  ReelMind
                </span>
              </div>
              {user ? <UserAccountBlock user={user} variant="header" /> : null}
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-[1.55rem] font-semibold tracking-tight text-ink lg:text-[2rem] lg:leading-tight">
                  {pageTitle}
                </h1>
                {subtitle ? (
                  <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink-muted">
                    {subtitle}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1 lg:hidden">
                <OnboardingTrigger />
                <ThemeToggle />
                <Link
                  href="/add"
                  className="btn-primary focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-full"
                  aria-label="Добавить ссылку"
                >
                  <PlusIcon className="h-5 w-5" />
                </Link>
              </div>
            </div>
            {categories.length > 0 ? (
              <div className="lg:hidden">
                <CategoryNav
                  categories={categories}
                  activeSlug={activeCategorySlug}
                  totalCount={totalItems}
                  variant="rail"
                  searchQuery={searchQuery}
                  onSelectCategory={onSelectCategory}
                  onCategoryCreated={handleCategoryCreated}
                />
              </div>
            ) : null}
          </div>
        </header>

        {/* pb = высота tab bar (3.5rem) + safe-area, без лишнего «воздуха» под навбаром */}
        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] pt-4 lg:px-10 lg:pb-12 lg:pt-7">
          {children}
        </main>

        <Onboarding isAdmin={user?.role === "admin"} />

        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          aria-label="Основная навигация"
        >
          <div className="mx-auto flex h-14 max-w-lg items-stretch">
            <Link
              href="/"
              prefetch
              onClick={onCatalogClick}
              className="focus-ring flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-ink"
            >
              <GridIcon className="h-5 w-5" />
              Каталог
            </Link>
            <Link
              href="/add"
              prefetch
              className="focus-ring flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-ink-muted"
            >
              <PlusIcon className="h-5 w-5 text-accent" />
              Добавить
            </Link>
            {user?.role === "admin" ? (
              <Link
                href="/admin"
                prefetch
                className="focus-ring m-1.5 flex flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-line bg-paper text-xs font-semibold text-ink"
              >
                <ShieldIcon className="h-5 w-5 text-accent" />
                Админ
              </Link>
            ) : null}
          </div>
        </nav>
      </div>
    </div>
  );
}

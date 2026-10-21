"use client";

import { useCallback, useMemo, useRef, type ReactNode, type TouchEvent } from "react";

type Props = {
  children: ReactNode;
  categorySlugs: string[];
  activeSlug?: string;
  searchQuery?: string;
  onSelectCategory?: (slug: string | undefined) => void;
};

/**
 * Mobile: swipe right → next category, swipe left → previous.
 */
export function CategorySwipe({
  children,
  categorySlugs,
  activeSlug,
  onSelectCategory,
}: Props) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const sequence = useMemo(() => ["", ...categorySlugs], [categorySlugs]);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!onSelectCategory) return;
      const currentKey = activeSlug ?? "";
      const idx = sequence.indexOf(currentKey);
      const safeIdx = idx < 0 ? 0 : idx;
      const nextIdx = Math.min(sequence.length - 1, Math.max(0, safeIdx + dir));
      if (nextIdx === safeIdx) return;
      const nextSlug = sequence[nextIdx] || undefined;
      onSelectCategory(nextSlug);
    },
    [activeSlug, onSelectCategory, sequence],
  );

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    if (!touch) return;
    start.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
  }

  function onTouchEnd(event: TouchEvent) {
    const touch = event.changedTouches[0];
    const origin = start.current;
    start.current = null;
    if (!touch || !origin) return;

    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    const dt = Date.now() - origin.t;

    if (Math.abs(dx) < 72) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.35) return;
    if (dt > 700) return;

    if (dx > 0) go(1);
    else go(-1);
  }

  return (
    <div
      className="min-w-0 touch-pan-y lg:contents"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
}

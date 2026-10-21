"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type Props = {
  children: ReactNode;
  categorySlugs: string[];
  activeSlug?: string;
  searchQuery?: string;
  onSelectCategory?: (slug: string | undefined) => void;
};

const AXIS_LOCK = 8;
const SWIPE_MIN = 40;

export function CategorySwipe({
  children,
  categorySlugs,
  activeSlug,
  onSelectCategory,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<"x" | "y" | null>(null);
  const dxRef = useRef(0);
  const slugRef = useRef(activeSlug);
  const goRef = useRef<(dir: 1 | -1) => void>(() => undefined);
  const sequence = useMemo(() => ["", ...categorySlugs], [categorySlugs]);

  slugRef.current = activeSlug;

  const applyTranslate = (x: number, withEase: boolean) => {
    const el = layerRef.current;
    if (!el) return;
    el.style.transition = withEase ? "transform 140ms ease-out" : "none";
    el.style.transform = x ? `translate3d(${x}px,0,0)` : "translate3d(0,0,0)";
  };

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!onSelectCategory) return;
      const currentKey = slugRef.current ?? "";
      const idx = sequence.indexOf(currentKey);
      const safeIdx = idx < 0 ? 0 : idx;
      const nextIdx = Math.min(sequence.length - 1, Math.max(0, safeIdx + dir));
      if (nextIdx === safeIdx) return;
      startTransition(() => {
        onSelectCategory(sequence[nextIdx] || undefined);
      });
    },
    [onSelectCategory, sequence],
  );

  goRef.current = go;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      start.current = { x: touch.clientX, y: touch.clientY };
      axis.current = null;
      dxRef.current = 0;
      applyTranslate(0, false);
    };

    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      const origin = start.current;
      if (!touch || !origin) return;
      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      if (!axis.current) {
        if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
        axis.current = Math.abs(dx) > Math.abs(dy) * 1.15 ? "x" : "y";
      }
      if (axis.current !== "x") return;
      event.preventDefault();
      dxRef.current = dx;
      applyTranslate(dx * 0.32, false);
    };

    const onEnd = () => {
      const dx = dxRef.current;
      const locked = axis.current;
      start.current = null;
      axis.current = null;
      dxRef.current = 0;
      if (locked !== "x") {
        applyTranslate(0, false);
        return;
      }
      applyTranslate(0, true);
      if (Math.abs(dx) < SWIPE_MIN) return;
      goRef.current(dx > 0 ? 1 : -1);
    };

    wrap.addEventListener("touchstart", onStart, { passive: true });
    wrap.addEventListener("touchmove", onMove, { passive: false });
    wrap.addEventListener("touchend", onEnd, { passive: true });
    wrap.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      wrap.removeEventListener("touchstart", onStart);
      wrap.removeEventListener("touchmove", onMove);
      wrap.removeEventListener("touchend", onEnd);
      wrap.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  return (
    <div ref={wrapRef} className="min-w-0 lg:contents">
      <div
        ref={layerRef}
        className="min-w-0 lg:contents"
        style={{ willChange: "transform" }}
      >
        {children}
      </div>
    </div>
  );
}

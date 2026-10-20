"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "reelmind-ios-install-dismiss";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error legacy iOS Safari
    navigator.standalone === true
  );
}

export function IosInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIos() || isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    const t = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-line bg-surface/95 p-4 shadow-lg backdrop-blur-md lg:bottom-6 lg:left-auto lg:right-6"
      role="region"
      aria-label="Установка на iPhone"
    >
      <p className="font-display text-sm font-semibold text-ink">Открывать как приложение</p>
      <p className="mt-1 text-sm leading-snug text-ink-muted">
        В Safari нажмите{" "}
        <span className="inline-flex items-center rounded-md bg-paper-deep px-1.5 py-0.5 font-medium text-ink">
          Поделиться
        </span>{" "}
        →{" "}
        <span className="inline-flex items-center rounded-md bg-paper-deep px-1.5 py-0.5 font-medium text-ink">
          На экран «Домой»
        </span>
      </p>
      <button
        type="button"
        className="mt-3 text-sm font-medium text-accent hover:text-accent-hover"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setVisible(false);
        }}
      >
        Понятно
      </button>
    </div>
  );
}

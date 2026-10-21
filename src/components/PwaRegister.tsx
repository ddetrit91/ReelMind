"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (isLocal) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // best-effort — iOS still installs via «На экран Домой» without SW
    });
  }, []);

  return null;
}

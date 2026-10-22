"use client";

import { useEffect, useState } from "react";

import { ingestProgressForElapsed } from "@/lib/ingest/progress-messages";

export function useIngestProgress(active: boolean, url: string) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsedMs(0);
      return;
    }
    const started = Date.now();
    setElapsedMs(0);
    const tick = window.setInterval(() => {
      setElapsedMs(Date.now() - started);
    }, 400);
    return () => window.clearInterval(tick);
  }, [active, url]);

  return ingestProgressForElapsed(url, elapsedMs);
}

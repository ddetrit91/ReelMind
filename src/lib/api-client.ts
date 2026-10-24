"use client";

import type { CategoryWithCount } from "@/lib/data/items";

const INGEST_SECRET =
  typeof window !== "undefined" ? process.env.NEXT_PUBLIC_INGEST_SECRET : undefined;

export async function createCategory(payload: { name: string; emoji?: string }) {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { category?: CategoryWithCount; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Не удалось создать категорию");
  }
  if (!data.category) {
    throw new Error("Не удалось создать категорию");
  }
  return data.category;
}

export async function ingestLink(payload: {
  url?: string;
  text?: string;
  categorySlug?: string;
}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (INGEST_SECRET) {
    headers["x-ingest-secret"] = INGEST_SECRET;
  }

  const res = await fetch("/api/items/ingest", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as {
    id?: string;
    categorySlug?: string;
    duplicate?: boolean;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "Не удалось сохранить");
  }

  return data as { id: string; categorySlug: string; duplicate?: boolean };
}

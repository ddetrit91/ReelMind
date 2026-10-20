"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { deleteItem, updateItemCategory } from "@/lib/data/items";
import { processIngest } from "@/lib/ingest/process-ingest";

export async function ingestFromForm(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const user = await requireUser("/add");
  const url = String(formData.get("url") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const categorySlug = String(formData.get("categorySlug") ?? "").trim();

  const result = await processIngest({
    url: url || undefined,
    text: text || undefined,
    userId: user.id,
    categorySlug: categorySlug || undefined,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(`/items/${result.id}`);
}

export async function updateCategoryAction(itemId: string, categorySlug: string) {
  const user = await requireUser();
  const item = await updateItemCategory(itemId, categorySlug, user.id);
  if (!item) {
    return { error: "Не найдено" };
  }
  return { ok: true as const };
}

export async function deleteItemAction(itemId: string, returnTo = "/") {
  const user = await requireUser();
  const deleted = await deleteItem(itemId, user.id);
  if (!deleted) {
    return { error: "Не найдено" };
  }
  revalidatePath("/");
  revalidatePath("/items");
  redirect(returnTo.startsWith("/") ? returnTo : "/");
}

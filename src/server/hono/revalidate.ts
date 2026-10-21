import { revalidatePath } from "next/cache";

export function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/items");
}

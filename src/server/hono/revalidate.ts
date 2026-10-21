import { revalidatePath } from "next/cache";

export function revalidateCatalog() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/add");
  revalidatePath("/items");
}

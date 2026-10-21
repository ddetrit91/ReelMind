import { after } from "next/server";
import { revalidatePath } from "next/cache";

/** Don't block the API/UI on cache busting. */
export function revalidateCatalog() {
  const run = () => {
    revalidatePath("/");
    revalidatePath("/items");
  };
  try {
    after(run);
  } catch {
    run();
  }
}

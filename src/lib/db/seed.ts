import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { ensureBootstrapAdmin } from "@/lib/admin/adminService";
import { CATEGORY_SEED } from "@/lib/categories";
import { ensureDemoItemsForUser } from "@/lib/demo/ensure-demo-items";
import { getDb } from "@/lib/db/client";
import { categories, users } from "@/lib/db/schema";

async function seed() {
  const db = getDb();

  for (const cat of CATEGORY_SEED) {
    await db
      .insert(categories)
      .values({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        emoji: cat.emoji,
        sortOrder: cat.sortOrder,
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: {
          name: cat.name,
          emoji: cat.emoji,
          sortOrder: cat.sortOrder,
        },
      });
  }

  await ensureBootstrapAdmin();

  const allUsers = await db.select({ id: users.id }).from(users);
  for (const user of allUsers) {
    await ensureDemoItemsForUser(user.id);
  }

  console.log("Seed complete: categories, demo links, bootstrap admin");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

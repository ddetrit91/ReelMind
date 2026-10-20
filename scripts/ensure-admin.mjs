import { config } from "dotenv";
import { resolve } from "node:path";

import { ensureEnvAdminFromEnv } from "../src/lib/admin/adminService.ts";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

await ensureEnvAdminFromEnv();
console.log(
  process.env.ADMIN_EMAIL
    ? `Admin ready: ${process.env.ADMIN_EMAIL} (password from ADMIN_PASSWORD in .env.local)`
    : "Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) in .env.local",
);

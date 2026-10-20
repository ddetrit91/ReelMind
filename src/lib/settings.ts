import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { appSettings } from "@/lib/db/schema";

export const SETTING_ALLOW_REGISTRATION = "allow_registration";
export const SETTING_MAINTENANCE = "maintenance_mode";

const DEFAULTS: Record<string, string> = {
  [SETTING_ALLOW_REGISTRATION]: "true",
  [SETTING_MAINTENANCE]: "false",
};

export async function getSetting(key: string): Promise<string> {
  const db = getDb();
  const rows = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return rows[0]?.value ?? DEFAULTS[key] ?? "false";
}

export async function getSettings() {
  return {
    allowRegistration: (await getSetting(SETTING_ALLOW_REGISTRATION)) === "true",
    maintenanceMode: (await getSetting(SETTING_MAINTENANCE)) === "true",
  };
}

export async function setSetting(key: string, value: boolean) {
  const db = getDb();
  const now = new Date().toISOString();
  await db
    .insert(appSettings)
    .values({ key, value: value ? "true" : "false", updatedAt: now })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: value ? "true" : "false", updatedAt: now },
    });
}

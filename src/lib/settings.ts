import { cache } from "react";
import { inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { appSettings } from "@/lib/db/schema";

export const SETTING_ALLOW_REGISTRATION = "allow_registration";
export const SETTING_MAINTENANCE = "maintenance_mode";

const DEFAULTS: Record<string, string> = {
  [SETTING_ALLOW_REGISTRATION]: "true",
  [SETTING_MAINTENANCE]: "false",
};

export async function getSetting(key: string): Promise<string> {
  const settings = await getSettings();
  if (key === SETTING_ALLOW_REGISTRATION) {
    return settings.allowRegistration ? "true" : "false";
  }
  if (key === SETTING_MAINTENANCE) {
    return settings.maintenanceMode ? "true" : "false";
  }
  return DEFAULTS[key] ?? "false";
}

/** One DB round-trip per request (React cache). */
export const getSettings = cache(async () => {
  const db = getDb();
  const rows = await db
    .select()
    .from(appSettings)
    .where(
      inArray(appSettings.key, [SETTING_ALLOW_REGISTRATION, SETTING_MAINTENANCE]),
    );

  const map = new Map(rows.map((row) => [row.key, row.value]));
  return {
    allowRegistration:
      (map.get(SETTING_ALLOW_REGISTRATION) ?? DEFAULTS[SETTING_ALLOW_REGISTRATION]) === "true",
    maintenanceMode:
      (map.get(SETTING_MAINTENANCE) ?? DEFAULTS[SETTING_MAINTENANCE]) === "true",
  };
});

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

import { relations, sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  lastActiveAt: text("last_active_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const activityLogs = sqliteTable(
  "activity_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ip: text("ip"),
    city: text("city"),
    userAgent: text("user_agent"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index("activity_user_idx").on(table.userId), index("activity_created_idx").on(table.createdAt)],
);

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("📁"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const items = sqliteTable(
  "items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    instagramUrl: text("instagram_url").notNull(),
    sourceKind: text("source_kind").notNull().default("other"),
    mediaKind: text("media_kind").notNull().default("unknown"),
    contentType: text("content_type").notNull().default("unknown"),
    shareText: text("share_text"),
    caption: text("caption"),
    title: text("title"),
    thumbnailUrl: text("thumbnail_url"),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    aiTags: text("ai_tags", { mode: "json" }).$type<string[]>().notNull(),
    aiSummary: text("ai_summary"),
    classificationConfidence: real("classification_confidence"),
    status: text("status", { enum: ["processing", "ready", "failed"] })
      .notNull()
      .default("processing"),
    errorMessage: text("error_message"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("items_category_idx").on(table.categoryId),
    index("items_user_idx").on(table.userId),
    index("items_user_category_idx").on(table.userId, table.categoryId),
    index("items_user_created_idx").on(table.userId, table.createdAt),
    uniqueIndex("items_user_url_idx").on(table.userId, table.instagramUrl),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  sessions: many(sessions),
  activityLogs: many(activityLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  user: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Item = typeof items.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

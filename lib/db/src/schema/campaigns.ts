import { pgTable, serial, timestamp, varchar, integer } from "drizzle-orm/pg-core";

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // e.g. "LinkedIn", "Instagram"
  status: varchar("status", { length: 50 }).notNull().default("active"), // "active", "paused", "completed"
  targetId: varchar("target_id", { length: 100 }), // Form ID or Ad ID
  budget: integer("budget").default(0),
  spent: integer("spent").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InsertCampaign = typeof campaignsTable.$inferInsert;
export type Campaign = typeof campaignsTable.$inferSelect;

import { pgTable, serial, timestamp, varchar, integer, jsonb, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 100 }).notNull(), // e.g. "website", "meta", "linkedin"
  rawData: jsonb("raw_data"), // the original webhook payload
  aiScore: integer("ai_score").default(0),
  aiCategory: varchar("ai_category", { length: 50 }), // HOT, WARM, COLD
  status: varchar("status", { length: 50 }).notNull().default("new"), // new, contacted, qualified
  assignedToUserId: uuid("assigned_to_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InsertLead = typeof leadsTable.$inferInsert;
export type Lead = typeof leadsTable.$inferSelect;

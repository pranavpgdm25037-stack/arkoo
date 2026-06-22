import { pgTable, timestamp, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  email: varchar("email", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;

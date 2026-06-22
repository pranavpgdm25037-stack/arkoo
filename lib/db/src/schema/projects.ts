import { pgTable, text, serial, timestamp, varchar, integer, numeric } from "drizzle-orm/pg-core";
import { customersTable } from "./customers";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customersTable.id),
  type: varchar("type", { length: 100 }).notNull(), // e.g. interior, prebuild
  areaSqft: integer("area_sqft"),
  budget: numeric("budget"),
  timeline: varchar("timeline", { length: 100 }), // immediate, exploring
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InsertProject = typeof projectsTable.$inferInsert;
export type Project = typeof projectsTable.$inferSelect;

import { pgTable, text, serial, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { leadsTable } from "./leads";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leadsTable.id),
  name: varchar("name", { length: 255 }).notNull(),
  contactInfo: text("contact_info"), // phone, email json
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InsertCustomer = typeof customersTable.$inferInsert;
export type Customer = typeof customersTable.$inferSelect;

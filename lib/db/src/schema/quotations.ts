import { pgTable, text, serial, timestamp, varchar, integer, numeric } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quotationsTable = pgTable("quotations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projectsTable.id),
  version: integer("version").notNull().default(1),
  totalAmount: numeric("total_amount").notNull(),
  pdfUrl: text("pdf_url"),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, sent, accepted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InsertQuotation = typeof quotationsTable.$inferInsert;
export type Quotation = typeof quotationsTable.$inferSelect;

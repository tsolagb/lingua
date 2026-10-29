import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const mistakeReportTable = pgTable("mistake_reports", {
  id: serial("id").primaryKey(),
  language: text("language").notNull(),
  issueType: text("issue_type").notNull(),
  game: text("game").notNull(),
  reportedContent: text("reported_content").notNull(),
  suggestedCorrection: text("suggested_correction").notNull().default(""),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMistakeReportSchema = createInsertSchema(mistakeReportTable).omit({
  id: true,
  status: true,
  createdAt: true,
});

export type InsertMistakeReport = z.infer<typeof insertMistakeReportSchema>;
export type MistakeReport = typeof mistakeReportTable.$inferSelect;

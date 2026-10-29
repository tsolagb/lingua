import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const learnerProgressTable = pgTable("learner_progress", {
  userId: text("user_id").primaryKey(),
  snapshot: jsonb("snapshot")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

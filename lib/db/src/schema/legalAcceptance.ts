import { boolean, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const legalAcceptanceTable = pgTable(
  "legal_acceptances",
  {
    userId: text("user_id").notNull(),
    termsVersion: text("terms_version").notNull(),
    privacyVersion: text("privacy_version").notNull(),
    adultAttested: boolean("adult_attested").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.termsVersion, table.privacyVersion],
    }),
  ],
);

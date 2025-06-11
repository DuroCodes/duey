import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  summary: text("summary").notNull(),
  course: text("course").notNull(),
  description: text("description").notNull(),
  start: timestamp("start").notNull(),
  end: timestamp("end").notNull(),
  lastModified: timestamp("lastmodified").notNull(),
  userId: text("user_id").notNull(),
  complete: boolean("complete").notNull().default(false),
});

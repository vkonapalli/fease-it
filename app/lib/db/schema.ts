import { pgTable, uuid, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import type { FeasibilityInputs, FeasibilityResults } from "~/types";

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  name: text("name").notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});

export const scenarios = pgTable("scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  sort_order: integer("sort_order").notNull(),
  inputs: jsonb("inputs").$type<FeasibilityInputs>().notNull(),
  results: jsonb("results").$type<FeasibilityResults | null>(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});

import type { HasLogger } from "@fease-it/logger";
import type { HasDb } from "@fease-it/pg-client";
import * as schema from "./schema";

export type AppDatabase = HasDb<typeof schema>["db"];

export interface BaseContext extends HasLogger {
  db: AppDatabase;
  userId: string;
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export type DrizzleDatabase<TSchema extends Record<string, unknown> = Record<string, never>> = ReturnType<typeof drizzle<TSchema>>;

export interface HasDb<TSchema extends Record<string, unknown> = Record<string, never>> {
  db: DrizzleDatabase<TSchema>;
}

export function createDbPool<TSchema extends Record<string, unknown>>(
  connectionString: string, 
  schema: TSchema
): DrizzleDatabase<TSchema> {
  return drizzle(postgres(connectionString, { prepare: false }), { schema });
}

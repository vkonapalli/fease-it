import { requireAuth } from "./auth.server";
import { logger } from "@fease-it/logger";
import { createDbPool } from "@fease-it/pg-client";
import * as schema from "@fease-it/db";
import type { BaseContext } from "@fease-it/db";


const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  logger.warn("SUPABASE_DB_URL is not set. Database operations will fail.");
}

// Global singleton DB pool
export const globalDb = connectionString ? createDbPool(connectionString, schema) : null;

type AnyRouteArgs = { request: Request; params: any; context?: any };

export function withContext<TArgs extends AnyRouteArgs, TReturn>(
  handler: (args: TArgs, ctx: BaseContext) => Promise<TReturn>
) {
  return async (args: TArgs) => {
    if (!globalDb) {
      throw new Error("Database connection not initialized.");
    }

    // Require auth and get user
    const { user, headers } = await requireAuth(args.request);
    if (!user) throw new Response("Unauthorized", { status: 401, headers });

    // Create a request-scoped logger
    const requestLogger = logger.child({ userId: user.id });

    const ctx: BaseContext = {
      db: globalDb,
      logger: requestLogger,
      userId: user.id,
    };

    return handler(args, ctx);
  };
}

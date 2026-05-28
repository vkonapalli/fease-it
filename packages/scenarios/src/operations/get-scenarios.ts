import { eq, asc } from "drizzle-orm";
import VError from "verror";
import { scenarios, type BaseContext } from "@fease-it/db";

export type GetScenariosInput = BaseContext & {
  projectId: string;
};

export async function getScenarios(input: GetScenariosInput) {
  const { db, logger, userId, projectId } = input;
  const info = { operation: "getScenarios", parameters: { userId, projectId } };
  const childLogger = logger.child(info);

  try {
    childLogger.info("Retrieving scenarios for project");
    const data = await db
      .select()
      .from(scenarios)
      .where(eq(scenarios.project_id, projectId))
      .orderBy(asc(scenarios.sort_order));
    return data;
  } catch (cause: any) {
    throw new VError({ info, cause, name: `${info.operation}:failed` }, "Failed to retrieve scenarios");
  }
}

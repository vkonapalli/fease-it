import { eq } from "drizzle-orm";
import VError from "verror";
import { scenarios, type BaseContext } from "@fease-it/db";

export type DeleteScenarioInput = BaseContext & {
  scenarioId: string;
  projectId: string;
};

export async function deleteScenario(input: DeleteScenarioInput) {
  const { db, logger, userId, scenarioId, projectId } = input;
  const info = { operation: "deleteScenario", parameters: { userId, projectId, scenarioId } };
  const childLogger = logger.child(info);

  try {
    childLogger.info("Deleting scenario");
    await db.delete(scenarios).where(eq(scenarios.id, scenarioId));
  } catch (cause: any) {
    throw new VError({ info, cause, name: `${info.operation}:failed` }, "Failed to delete scenario");
  }
}

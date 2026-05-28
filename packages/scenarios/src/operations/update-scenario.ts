import { eq } from "drizzle-orm";
import VError from "verror";
import { scenarios, type BaseContext } from "@fease-it/db";
import type { FeasibilityInputs } from "@fease-it/schemas";

export type UpdateScenarioInput = BaseContext & {
  scenarioId: string;
  projectId: string;
  name?: string;
  inputs?: FeasibilityInputs;
  sortOrder?: number;
};

export async function updateScenario(input: UpdateScenarioInput) {
  const { db, logger, userId, scenarioId, projectId, name, inputs, sortOrder } = input;
  const info = { operation: "updateScenario", parameters: { userId, projectId, scenarioId } };
  const childLogger = logger.child(info);

  try {
    childLogger.info("Updating scenario");
    const [data] = await db
      .update(scenarios)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(inputs !== undefined ? { inputs } : {}),
        ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
        updated_at: new Date().toISOString(),
      })
      .where(eq(scenarios.id, scenarioId))
      .returning();
    return data;
  } catch (cause: any) {
    throw new VError({ info, cause, name: `${info.operation}:failed` }, "Failed to update scenario");
  }
}

import VError from "verror";
import { scenarios, type BaseContext } from "@fease-it/db";
import type { FeasibilityInputs } from "@fease-it/schemas";

export type CreateScenarioInput = BaseContext & {
  projectId: string;
  name: string;
  inputs: FeasibilityInputs;
  sortOrder: number;
};

export async function createScenario(input: CreateScenarioInput) {
  const { db, logger, userId, projectId, name, inputs, sortOrder } = input;
  const info = { operation: "createScenario", parameters: { userId, projectId, name } };
  const childLogger = logger.child(info);

  try {
    childLogger.info("Creating new scenario");
    const [data] = await db
      .insert(scenarios)
      .values({
        project_id: projectId,
        name,
        inputs,
        sort_order: sortOrder,
      })
      .returning();
    return data;
  } catch (cause: any) {
    throw new VError({ info, cause, name: `${info.operation}:failed` }, "Failed to create scenario");
  }
}

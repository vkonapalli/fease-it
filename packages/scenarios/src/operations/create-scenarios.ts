import VError from "verror";
import { scenarios, type BaseContext } from "@fease-it/db";
import type { FeasibilityInputs } from "@fease-it/schemas";

export type CreateScenariosInput = BaseContext & {
  scenarios: Array<{
    projectId: string;
    name: string;
    inputs: FeasibilityInputs;
    sortOrder: number;
  }>;
};

export async function createScenarios(input: CreateScenariosInput) {
  const { db, logger, userId, scenarios: items } = input;
  const info = { operation: "createScenarios", parameters: { userId, count: items.length } };
  const childLogger = logger.child(info);

  if (items.length === 0) return [];

  try {
    childLogger.info("Creating multiple scenarios");
    const data = await db
      .insert(scenarios)
      .values(
        items.map(item => ({
          project_id: item.projectId,
          name: item.name,
          inputs: item.inputs,
          sort_order: item.sortOrder,
        }))
      )
      .returning();
    return data;
  } catch (cause: any) {
    throw new VError({ info, cause, name: `${info.operation}:failed` }, "Failed to create scenarios");
  }
}

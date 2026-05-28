import VError from "verror";
import { projects, type BaseContext } from "@fease-it/db";

export type CreateProjectInput = BaseContext & {
  name: string;
};

export async function createProject(input: CreateProjectInput) {
  const { db, logger, userId, name } = input;
  const info = { operation: "createProject", parameters: { userId, name } };
  const childLogger = logger.child(info);

  try {
    childLogger.info("Creating new project");
    const [data] = await db
      .insert(projects)
      .values({
        user_id: userId,
        name,
      })
      .returning();
    return data;
  } catch (cause: any) {
    throw new VError({ info, cause, name: `${info.operation}:failed` }, "Failed to create project");
  }
}

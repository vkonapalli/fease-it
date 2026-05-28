import { eq, and } from "drizzle-orm";
import VError from "verror";
import { projects, type BaseContext } from "@fease-it/db";

export type DeleteProjectInput = BaseContext & {
  projectId: string;
};

export async function deleteProject(input: DeleteProjectInput) {
  const { db, logger, userId, projectId } = input;
  const info = { operation: "deleteProject", parameters: { userId, projectId } };
  const childLogger = logger.child(info);

  try {
    childLogger.info("Deleting project");
    await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.user_id, userId)));
  } catch (cause: any) {
    throw new VError({ info, cause, name: `${info.operation}:failed` }, "Failed to delete project");
  }
}

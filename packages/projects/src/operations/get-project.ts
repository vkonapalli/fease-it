import { eq, and } from "drizzle-orm";
import VError from "verror";
import { projects, type BaseContext } from "@fease-it/db";

export type GetProjectInput = BaseContext & {
  projectId: string;
};

export async function getProject(input: GetProjectInput) {
  const { db, logger, userId, projectId } = input;
  const info = { operation: "getProject", parameters: { userId, projectId } };
  const childLogger = logger.child(info);

  try {
    childLogger.info("Retrieving project for user");
    const [data] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.user_id, userId)))
      .limit(1);

    if (!data) return null;
    return data;
  } catch (cause: any) {
    throw new VError({ info, cause, name: `${info.operation}:failed` }, "Failed to retrieve project");
  }
}

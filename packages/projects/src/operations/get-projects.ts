import { eq, desc } from "drizzle-orm";
import VError from "verror";
import { projects, type BaseContext } from "@fease-it/db";

export type GetProjectsInput = BaseContext;

export async function getProjects(input: GetProjectsInput) {
  const { db, logger, userId } = input;
  const info = { operation: "getProjects", parameters: { userId } };
  const childLogger = logger.child(info);

  try {
    childLogger.info("Retrieving projects for user");
    const data = await db
      .select()
      .from(projects)
      .where(eq(projects.user_id, userId))
      .orderBy(desc(projects.created_at));

    return data;
  } catch (cause: any) {
    throw new VError({ info, cause, name: `${info.operation}:failed` }, "Failed to retrieve projects");
  }
}

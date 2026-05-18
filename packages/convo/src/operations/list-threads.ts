// ============================================================
// Operation: List Threads
// ============================================================

import type { PersistenceClient } from "../client";
import type { Thread } from "../types";

export const listThreads = async (
  client: PersistenceClient,
  userId: string,
  projectId?: string | null
): Promise<Thread[]> => {
  return client.listThreads(userId, projectId);
};

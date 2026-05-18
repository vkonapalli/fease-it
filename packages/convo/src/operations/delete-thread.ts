// ============================================================
// Operation: Delete Thread (soft delete — archives)
// ============================================================

import type { PersistenceClient } from "../client";

export const deleteThread = async (
  client: PersistenceClient,
  userId: string,
  threadId: string
): Promise<void> => {
  return client.deleteThread(userId, threadId);
};

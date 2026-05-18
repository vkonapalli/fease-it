// ============================================================
// Operation: Rename Thread
// ============================================================

import type { PersistenceClient } from "../client";

export const renameThread = async (
  client: PersistenceClient,
  userId: string,
  threadId: string,
  title: string
): Promise<void> => {
  return client.renameThread(userId, threadId, title);
};

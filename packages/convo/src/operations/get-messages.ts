// ============================================================
// Operation: Get Thread Messages
// ============================================================

import type { PersistenceClient } from "../client";
import type { ThreadMessage } from "../types";

export const getThreadMessages = async (
  client: PersistenceClient,
  threadId: string,
  userId: string
): Promise<ThreadMessage[]> => {
  return client.getMessages(threadId, userId);
};

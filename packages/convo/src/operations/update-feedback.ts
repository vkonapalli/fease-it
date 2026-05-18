// ============================================================
// Operation: Update Turn Feedback
// ============================================================

import type { PersistenceClient } from "../client";
import type { TurnFeedback } from "../types";

export const updateFeedback = async (
  client: PersistenceClient,
  threadId: string,
  userId: string,
  feedback: TurnFeedback
): Promise<void> => {
  return client.updateFeedback(threadId, userId, feedback);
};

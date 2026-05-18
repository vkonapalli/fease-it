// ============================================================
// Operation: Store Turn
// ============================================================

import type { PersistenceClient } from "../client";
import type { ConversationTurn } from "../types";

export const storeTurn = async (
  client: PersistenceClient,
  turn: ConversationTurn
): Promise<void> => {
  return client.storeTurn(turn);
};

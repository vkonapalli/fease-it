// ============================================================
// Operation: Store Thread
// ============================================================

import type { PersistenceClient } from "../client";
import type { StoreThreadInput, Thread } from "../types";

export const storeThread = async (
  client: PersistenceClient,
  input: StoreThreadInput
): Promise<Thread> => {
  return client.storeThread(input);
};

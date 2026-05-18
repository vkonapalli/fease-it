// ============================================================
// Fease-It Conversation Persistence
// Turn-based conversation persistence library.
// Usage:
//   import { makeService, makeSupabasePersistenceClient } from "~/lib/convo";
//   const client = makeSupabasePersistenceClient(supabase);
//   const service = makeService({ client });
// ============================================================

export type { PersistenceClient } from "./client";
export { makeSupabasePersistenceClient } from "./supabase-client";
export { makeService } from "./service";
export type { ConvoService } from "./service";

export type {
  ConversationTurn,
  Thread,
  ThreadMessage,
  ToolCallRecord,
  StoreThreadInput,
  TurnFeedback,
} from "./types";

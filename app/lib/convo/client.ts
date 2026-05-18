// ============================================================
// Fease-It Conversation Persistence — Client Interface
// Abstract persistence layer (Supabase impl, mock impl, etc.)
// ============================================================

import type {
  ConversationTurn,
  Thread,
  ThreadMessage,
  StoreThreadInput,
  TurnFeedback,
} from "./types";

export interface PersistenceClient {
  storeThread(input: StoreThreadInput): Promise<Thread>;
  storeTurn(turn: ConversationTurn): Promise<void>;
  getMessages(threadId: string, userId: string): Promise<ThreadMessage[]>;
  listThreads(userId: string, projectId?: string | null): Promise<Thread[]>;
  deleteThread(userId: string, threadId: string): Promise<void>;
  renameThread(userId: string, threadId: string, title: string): Promise<void>;
  updateFeedback(
    threadId: string,
    userId: string,
    feedback: TurnFeedback
  ): Promise<void>;
}

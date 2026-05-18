// ============================================================
// Fease-It Conversation Persistence — Service Factory
// Mirrors the @tracksuit/convo-ai/services makeService pattern.
// Deps: { client: PersistenceClient }
// Each operation receives the client as its first argument.
// ============================================================

import type { PersistenceClient } from "./client";
import type {
  ConversationTurn,
  StoreThreadInput,
  Thread,
  ThreadMessage,
  TurnFeedback,
} from "./types";
import {
  storeThread,
  storeTurn,
  getThreadMessages,
  listThreads,
  deleteThread,
  renameThread,
  updateFeedback,
} from "./operations";

type Deps = {
  client: PersistenceClient;
};

export type ConvoService = ReturnType<typeof makeService>;

export const makeService = (deps: Deps) => {
  const { client } = deps;

  return {
    storeThread: (input: StoreThreadInput) => storeThread(client, input),

    storeTurn: (turn: ConversationTurn) => storeTurn(client, turn),

    getThreadMessages: (threadId: string, userId: string) =>
      getThreadMessages(client, threadId, userId),

    listThreads: (userId: string, projectId?: string | null) =>
      listThreads(client, userId, projectId),

    deleteThread: (userId: string, threadId: string) =>
      deleteThread(client, userId, threadId),

    renameThread: (userId: string, threadId: string, title: string) =>
      renameThread(client, userId, threadId, title),

    updateFeedback: (
      threadId: string,
      userId: string,
      feedback: TurnFeedback
    ) => updateFeedback(client, threadId, userId, feedback),
  };
};

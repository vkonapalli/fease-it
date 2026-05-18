// ============================================================
// Fease-It Conversation Persistence — Types
// Turn-based model adapted from @tracksuit/convo-ai/services
// ============================================================

import type { UIMessage } from "ai";

export type ToolCallRecord = {
  name: string;
  input: string;
  outputPreview: string;
};

export type ConversationTurn = {
  threadId: string;
  userId: string;
  userMessage: string;
  assistantMessage: string;
  userUIMessage: UIMessage;
  assistantUIMessage: UIMessage;
  toolCalls: ToolCallRecord[];
  model: string;
  durationMs: number;
  metadata: Record<string, unknown>;
};

export type Thread = {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type ThreadMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  assistantFeedback: "positive" | "negative" | null;
  editedAssistantMessage: string | null;
  toolCalls: ToolCallRecord[];
  uiMessage: UIMessage;
};

export type TurnFeedback = {
  turnId: string;
  assistantFeedback: "positive" | "negative" | null;
  feedbackMessage?: string;
  editedAssistantMessage?: string;
};

export type StoreThreadInput = {
  threadId?: string;
  userId: string;
  projectId?: string | null;
  title: string;
};

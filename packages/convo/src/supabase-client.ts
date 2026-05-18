// ============================================================
// Fease-It Conversation Persistence — Supabase Implementation
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConversationTurn,
  Thread,
  ThreadMessage,
  StoreThreadInput,
  TurnFeedback,
} from "./types";
import type { PersistenceClient } from "./client";

export function makeSupabasePersistenceClient(
  supabase: SupabaseClient
): PersistenceClient {
  return {
    async storeThread(input: StoreThreadInput): Promise<Thread> {
      const threadId = input.threadId ?? crypto.randomUUID();
      const { data, error } = await supabase
        .from("chat_threads")
        .insert({
          id: threadId,
          user_id: input.userId,
          project_id: input.projectId ?? null,
          title: input.title,
          status: "active",
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(
          `Failed to store thread: ${error?.message ?? "unknown error"}`
        );
      }

      return mapThreadRow(data);
    },

    async storeTurn(turn: ConversationTurn): Promise<void> {
      const { error } = await supabase.from("chat_turns").insert({
        thread_id: turn.threadId,
        user_id: turn.userId,
        user_message: turn.userMessage,
        assistant_message: turn.assistantMessage,
        user_message_json: turn.userUIMessage as unknown as Record<string, unknown>,
        assistant_message_json: turn.assistantUIMessage as unknown as Record<string, unknown>,
        tool_calls: turn.toolCalls,
        model: turn.model,
        duration_ms: turn.durationMs,
        metadata: turn.metadata,
      });

      if (error) {
        throw new Error(`Failed to store turn: ${error.message}`);
      }

      // Update thread updated_at and auto-title on first turn
      const { data: turnCount } = await supabase
        .from("chat_turns")
        .select("*", { count: "exact", head: true })
        .eq("thread_id", turn.threadId);

      const isFirstMessage = (typeof turnCount === "number" ? turnCount : 0) <= 1;
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (isFirstMessage) {
        update.title = turn.userMessage.substring(0, 60);
      }

      await supabase
        .from("chat_threads")
        .update(update)
        .eq("id", turn.threadId)
        .eq("user_id", turn.userId);
    },

    async getMessages(
      threadId: string,
      userId: string
    ): Promise<ThreadMessage[]> {
      // Verify thread belongs to user
      const { data: thread } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("id", threadId)
        .eq("user_id", userId)
        .single();

      if (!thread) {
        throw new Error("Thread not found");
      }

      const { data, error } = await supabase
        .from("chat_turns")
        .select()
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`Failed to get messages: ${error.message}`);
      }

      const messages: ThreadMessage[] = [];
      for (const row of data ?? []) {
        messages.push({
          role: "user",
          content: row.user_message,
          createdAt: row.created_at,
          assistantFeedback: row.assistant_feedback ?? null,
          editedAssistantMessage: row.edited_assistant_message ?? null,
          toolCalls: row.tool_calls ?? [],
          uiMessage: row.user_message_json as unknown as import("ai").UIMessage,
        });
        messages.push({
          role: "assistant",
          content: row.edited_assistant_message ?? row.assistant_message,
          createdAt: row.created_at,
          assistantFeedback: row.assistant_feedback ?? null,
          editedAssistantMessage: row.edited_assistant_message ?? null,
          toolCalls: row.tool_calls ?? [],
          uiMessage: row.assistant_message_json as unknown as import("ai").UIMessage,
        });
      }

      return messages;
    },

    async listThreads(
      userId: string,
      projectId?: string | null
    ): Promise<Thread[]> {
      let query = supabase
        .from("chat_threads")
        .select()
        .eq("user_id", userId)
        .eq("status", "active")
        .order("updated_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to list threads: ${error.message}`);
      }

      return (data ?? []).map(mapThreadRow);
    },

    async deleteThread(userId: string, threadId: string): Promise<void> {
      const { error } = await supabase
        .from("chat_threads")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", threadId)
        .eq("user_id", userId);

      if (error) {
        throw new Error(`Failed to delete thread: ${error.message}`);
      }
    },

    async renameThread(
      userId: string,
      threadId: string,
      title: string
    ): Promise<void> {
      const { error } = await supabase
        .from("chat_threads")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", threadId)
        .eq("user_id", userId);

      if (error) {
        throw new Error(`Failed to rename thread: ${error.message}`);
      }
    },

    async updateFeedback(
      threadId: string,
      userId: string,
      feedback: TurnFeedback
    ): Promise<void> {
      // Verify thread ownership
      const { data: thread } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("id", threadId)
        .eq("user_id", userId)
        .single();

      if (!thread) {
        throw new Error("Thread not found");
      }

      const { error } = await supabase
        .from("chat_turns")
        .update({
          assistant_feedback: feedback.assistantFeedback,
          feedback_message: feedback.feedbackMessage ?? null,
          edited_assistant_message: feedback.editedAssistantMessage ?? null,
        })
        .eq("id", feedback.turnId)
        .eq("thread_id", threadId);

      if (error) {
        throw new Error(`Failed to update feedback: ${error.message}`);
      }
    },
  };
}

function mapThreadRow(row: Record<string, unknown>): Thread {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    projectId: (row.project_id as string | null) ?? null,
    title: (row.title as string) ?? "",
    status: (row.status as "active" | "archived") ?? "active",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

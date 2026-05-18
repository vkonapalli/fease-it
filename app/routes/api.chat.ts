import { redirect } from "react-router";
import type { Route } from "./+types/api.chat";
import { streamText, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { createMoonshotAI } from "@ai-sdk/moonshotai";
import { getSupabaseServerClient } from "~/lib/supabase/server";
import { makeService, makeSupabasePersistenceClient } from "~/lib/convo";
import type { ToolCallRecord, ConversationTurn } from "~/lib/convo";
import {
  getInputsForStrategy,
  calculateScenarioSummary,
  listTemplatePacks,
  estimateStampDuty,
  applyProjectActions,
  runCalculation,
  SYSTEM_PROMPT,
} from "~/lib/ai/tools";

const tools = {
  getInputsForStrategy,
  calculateScenarioSummary,
  listTemplatePacks,
  estimateStampDuty,
  applyProjectActions,
  runCalculation,
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const threadId = url.searchParams.get("threadId");

  if (!threadId) {
    return redirect("/");
  }

  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }

  const client = makeSupabasePersistenceClient(supabase);
  const service = makeService({ client });

  try {
    const messages = await service.getThreadMessages(threadId, user.id);
    return new Response(JSON.stringify({ messages }), {
      headers: { "Content-Type": "application/json", ...headers },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load thread";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }
}

/* ────────────────────────────────────────────────
   CHAT intent — generate a streamed AI response
   Turn-based persistence.
   ──────────────────────────────────────────────── */
async function handleChat(
  body: {
    messages?: UIMessage[];
    threadId?: string | null;
    metadata?: Record<string, unknown>;
  },
  request: Request
) {
  const { supabase, headers } = getSupabaseServerClient(request);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }

  const client = makeSupabasePersistenceClient(supabase);
  const service = makeService({ client });

  const clientMessages = body.messages ?? [];
  const metadata = body.metadata ?? {};
  let threadId = body.threadId ?? null;

  // Ensure we have a thread
  if (!threadId) {
    const firstUserText = clientMessages
      .find((m) => m.role === "user")
      ?.parts.find((p) => p.type === "text")?.text;

    const thread = await service.storeThread({
      userId: user.id,
      projectId: (metadata.projectId as string | undefined) ?? null,
      title: firstUserText?.slice(0, 60) ?? "New Chat",
    });
    threadId = thread.id;
  }

  const moonshotai = createMoonshotAI({
    baseURL: process.env.MOONSHOT_BASE_URL || undefined,
    apiKey: process.env.MOONSHOT_API_KEY,
  });

  const model = moonshotai("kimi-k2.6");

  const startedAt = Date.now();

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(clientMessages, { tools }),
    tools,
    stopWhen: stepCountIs(10),
    onStepFinish: ({ toolCalls, toolResults }) => {
      for (const tc of toolCalls) {
        const input = tc.input ? JSON.stringify(tc.input) : "(none)";
        console.log(`[AI Tool: ${tc.toolName}] ${input}`);
      }
      for (const tr of toolResults) {
        const t = tr as unknown as Record<string, unknown>;
        console.log(`[AI Tool Result: ${t.toolCallId}] ${JSON.stringify(t.output ?? t)}`);
      }
    },
    onFinish: async ({ steps }) => {
      const durationMs = Date.now() - startedAt;
      const lastStep = steps[steps.length - 1];
      if (!lastStep) return;

      // Find the last user message that triggered this turn
      const lastUserIndex = clientMessages.map((m) => m.role).lastIndexOf("user");
      const userMessage =
        lastUserIndex >= 0 ? clientMessages[lastUserIndex] : undefined;

      if (!userMessage) return;

      // Extract tool call records from the step for quick search/display
      const toolCalls: ToolCallRecord[] = lastStep.toolResults.map((tr) => ({
        name: tr.toolName,
        input: JSON.stringify(tr.input ?? {}),
        outputPreview: JSON.stringify(tr.output ?? {}).slice(0, 200),
      }));

      // Build assistant UIMessage from step text + tool parts
      const assistantText = lastStep.text;
      const assistantUIMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [
          ...(assistantText ? [{ type: "text" as const, text: assistantText }] : []),
          ...lastStep.dynamicToolResults.map((tr) => ({
            type: "dynamic-tool" as const,
            toolName: tr.toolName,
            toolCallId: tr.toolCallId,
            state: "output-available" as const,
            input: tr.input,
            output: tr.output,
          })),
        ],
      };

      const turn: ConversationTurn = {
        threadId: threadId!,
        userId: user.id,
        userMessage:
          userMessage.parts.find((p) => p.type === "text")?.text ?? "",
        assistantMessage: assistantText,
        userUIMessage: userMessage,
        assistantUIMessage,
        toolCalls,
        model: `${lastStep.model.provider}:${lastStep.model.modelId}`,
        durationMs,
        metadata,
      };

      try {
        await service.storeTurn(turn);
        console.log(`[Chat] Turn stored for thread ${threadId}`);
      } catch (err) {
        console.error("[Chat] Failed to store turn:", err);
      }
    },
  });

  const response = result.toUIMessageStreamResponse();
  response.headers.set("X-Thread-Id", threadId!);
  return response;
}

/* ────────────────────────────────────────────────
   SAVE intent — client-side fallback persistence
   (Turns are already persisted in onFinish; this is
   a no-op safety valve.)
   ──────────────────────────────────────────────── */
async function handleSave(
  body: {
    threadId: string;
    messages: UIMessage[];
    metadata?: Record<string, unknown>;
  },
  request: Request
) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }

  // Turns are already stored in onFinish. Nothing to do here,
  // but we keep the endpoint for client backward-compatibility.
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export async function action({ request }: Route.ActionArgs) {
  const body = (await request.json()) as Record<string, unknown>;
  const intent = (body.intent as string | undefined) ?? "chat";

  if (intent === "save") {
    return handleSave(
      body as { threadId: string; messages: UIMessage[]; metadata?: Record<string, unknown> },
      request
    );
  }

  return handleChat(
    body as { messages?: UIMessage[]; threadId?: string | null; metadata?: Record<string, unknown> },
    request
  );
}

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAppStore } from "~/stores/appStore";
import { resolveActions, setDeep } from "~/lib/ai/tools";
import { getAllPacks, createScenariosFromPack } from "~/lib/templates";
import { Button } from "~/components/ui/Button";
import type { FeasibilityInputs, ProjectScenario } from "~/types";
import type { Scenario } from "~/stores/appStore";
import {
  X,
  Send,
  Loader2,
  Sparkles,
  Wrench,
  Check,
} from "lucide-react";

interface ParsedAction {
  type: string;
  name: string;
  inputs?: FeasibilityInputs;
  strategy?: ProjectScenario;
  changes?: Record<string, unknown>;
  packId?: string;
  selectedIds?: string[];
}

function applyStoreActions(actions: ParsedAction[]) {
  const state = useAppStore.getState();

  for (const action of actions) {
    if (action.type === "create_scenario" && action.inputs) {
      const newScenario: Scenario = {
        id: crypto.randomUUID(),
        name: action.name,
        inputs: action.inputs,
        sortOrder: Math.max(...state.scenarios.map((s) => s.sortOrder), 0) + 1,
        synced: false,
        remoteId: null,
      };
      state.addScenario(newScenario);
    } else if (action.type === "update_inputs" && action.changes) {
      const currentInputs = state.getActiveInputs();
      if (currentInputs) {
        const merged = structuredClone(currentInputs) as unknown as Record<string, unknown>;
        for (const [path, value] of Object.entries(action.changes)) {
          setDeep(merged, path, value);
        }
        state.updateActiveInputs(merged as unknown as Partial<FeasibilityInputs>);
      }
    } else if (
      action.type === "create_from_pack" &&
      action.packId &&
      action.selectedIds
    ) {
      const packs = getAllPacks(state.customPacks);
      const pack = packs.find((p) => p.id === action.packId);
      if (pack) {
        const scenarios = createScenariosFromPack(pack, action.selectedIds);
        for (const s of scenarios) {
          const newScenario: Scenario = {
            id: crypto.randomUUID(),
            name: s.name,
            inputs: s.inputs,
            sortOrder: Math.max(...state.scenarios.map((sc) => sc.sortOrder), 0) + 1,
            synced: false,
            remoteId: null,
          };
          state.addScenario(newScenario);
        }
      }
    }
  }
}

const HINTS = [
  "Sell all with $800k purchase",
  "Compare sell-all vs rental-hold",
  "Show stamp duty for $1.2M in NSW",
  "Create all scenarios for $500k",
];

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedRef = useRef<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: ({ messages }) => {
      const last = messages[messages.length - 1];
      if (!last || last.role !== "assistant") return false;
      return last.parts.some(
        (p) =>
          p.type === "dynamic-tool" &&
          (p.state === "output-available" || p.state === "input-available")
      );
    },
    onFinish({ message }) {
      const key = message.id;
      if (processedRef.current.has(key)) return;
      processedRef.current.add(key);

      const pendingActions: ParsedAction[] = [];

      for (const part of message.parts) {
        if (
          part.type === "dynamic-tool" &&
          part.toolName === "applyProjectActions" &&
          part.state === "output-available"
        ) {
          const output = part.output as { actions?: unknown[] };
          if (output?.actions && Array.isArray(output.actions)) {
            const resolved = resolveActions(
              output.actions as Parameters<typeof resolveActions>[0]
            );
            pendingActions.push(...resolved);
          }
        }
      }

      if (pendingActions.length === 0) return;

      applyStoreActions(pendingActions);
      const summary = pendingActions.map((a) => a.name).join(", ");
      setToast(`Applied: ${summary}`);
      setTimeout(() => setToast(null), 4000);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage({ text: inputText.trim() });
    setInputText("");
  }

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          title="AI Assistant (⌘K)"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {toast && (
        <div className="fixed bottom-6 right-24 z-[60] flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm text-white shadow-lg">
          <Check className="h-4 w-4" />
          {toast}
        </div>
      )}

      <div
        className={`fixed right-0 top-0 z-50 h-full w-[420px] transform border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">⌘K</span>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(100%-130px)] flex-col overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
              <Sparkles className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-600">
                How can I help with your feasibility?
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Try: "Create a sell-all feasibility for 123 Main St, VIC, $800k purchase price"
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                {HINTS.map((hint) => (
                  <button
                    key={hint}
                    onClick={() => sendMessage({ text: hint })}
                    className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <div key={i} className="whitespace-pre-wrap break-words">
                        {part.text}
                      </div>
                    );
                  }
                  if (part.type === "reasoning") {
                    return (
                      <details key={i} className="my-1.5">
                        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                          Thinking...
                        </summary>
                        <div className="mt-1 whitespace-pre-wrap text-xs text-gray-500 border-l-2 border-gray-300 pl-2">
                          {(part as { text: string }).text}
                        </div>
                      </details>
                    );
                  }
                  if (part.type === "dynamic-tool") {
                    const isApplied = part.toolName === "applyProjectActions";
                    const isOutputAvailable = part.state === "output-available";
                    const isError = part.state === "output-error";

                    if (isError) {
                      return (
                        <div
                          key={i}
                          className="my-1.5 rounded-lg bg-red-100 px-2.5 py-1.5 text-xs text-red-600"
                        >
                          Error: {(part as Record<string, unknown>).errorText as string || "Tool failed"}
                        </div>
                      );
                    }

                    if (isOutputAvailable) {
                      return (
                        <div
                          key={i}
                          className={`my-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                            isApplied
                              ? "bg-green-100 text-green-700"
                              : "bg-white/60 text-gray-500"
                          }`}
                        >
                          {isApplied ? "Changes applied" : `✓ ${part.toolName}`}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={i}
                        className="my-1.5 flex items-center gap-1.5 rounded-lg bg-white/60 px-2.5 py-1.5 text-xs text-gray-500"
                      >
                        <Wrench className="h-3 w-3 shrink-0" />
                        <span className="font-medium">{part.toolName}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-gray-100 px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {error.message || "An error occurred. Please try again."}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-3"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask about feasibility..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !inputText.trim()}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[11px] text-gray-400">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

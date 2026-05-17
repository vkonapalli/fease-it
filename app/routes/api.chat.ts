import { redirect } from "react-router";
import type { Route } from "./+types/api.chat";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { createMoonshotAI } from "@ai-sdk/moonshotai";
import {
  getInputsForStrategy,
  calculateScenarioSummary,
  listTemplatePacks,
  estimateStampDuty,
  applyProjectActions,
  SYSTEM_PROMPT,
} from "~/lib/ai/tools";

const tools = {
  getInputsForStrategy,
  calculateScenarioSummary,
  listTemplatePacks,
  estimateStampDuty,
  applyProjectActions,
};

export async function loader() {
  return redirect("/");
}

export async function action({ request }: Route.ActionArgs) {
  const { messages } = await request.json();

  const moonshotai = createMoonshotAI({
    baseURL: process.env.MOONSHOT_BASE_URL || undefined,
    apiKey: process.env.MOONSHOT_API_KEY,
  });

  const model = moonshotai("kimi-k2.6");

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}

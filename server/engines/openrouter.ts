/**
 * OpenRouter provider - one key for GPT / Claude / Gemini / Llama text
 * models. Synchronous chat completions; verify via GET /key.
 */
import type { AiModel } from "@shared/schema";
import type { EngineProvider, GenerateInput, GenerateResult } from "./types";

const OR_BASE = "https://openrouter.ai/api/v1";

export const openrouterProvider: EngineProvider = {
  name: "openrouter",

  async generate(apiKey: string, model: AiModel, input: GenerateInput): Promise<GenerateResult> {
    const response = await fetch(`${OR_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.providerModelId,
        messages: [{ role: "user", content: input.prompt }],
        ...(input.options || {}),
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.error?.message || `OpenRouter error ${response.status}`);
    }
    const text = body?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("OpenRouter returned no completion text");
    }
    return { status: "completed", text, raw: body };
  },

  async verifyKey(apiKey: string) {
    const response = await fetch(`${OR_BASE}/key`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      return { ok: false, detail: `OpenRouter rejected the key (${response.status})` };
    }
    const body = await response.json().catch(() => ({}));
    return { ok: true, detail: body?.data?.label ? `key: ${body.data.label}` : undefined };
  },
};

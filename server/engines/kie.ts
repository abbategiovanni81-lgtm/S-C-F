/**
 * KIE.ai provider - unified gateway to 180+ models (Veo, Kling, Grok,
 * Wan, Suno, GPT Image, ...) via the universal jobs API.
 *
 * createTask -> taskId -> poll recordInfo until success/fail.
 * Verify: the credit-balance endpoint (also powers the cost-advisory UI).
 *
 * NOTE: endpoint shapes verified against docs.kie.ai for the jobs API;
 * per-model input fields land in `input` verbatim, so new models are a
 * catalog row + smoke test, not a code change.
 */
import type { AiModel } from "@shared/schema";
import type { EngineProvider, GenerateInput, GenerateResult } from "./types";

const KIE_BASE = "https://api.kie.ai/api/v1";

async function kieFetch(apiKey: string, path: string, init?: RequestInit): Promise<any> {
  const response = await fetch(`${KIE_BASE}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || (body.code && body.code !== 200)) {
    throw new Error(body.msg || body.message || `KIE API error ${response.status}`);
  }
  return body;
}

function parseResult(data: any): GenerateResult {
  const state = data?.state || data?.status;
  if (state === "success") {
    let urls: string[] = [];
    try {
      const rj = data.resultJson ? JSON.parse(data.resultJson) : data.result;
      urls = rj?.resultUrls || rj?.result_urls || rj?.urls || [];
    } catch { /* fall through */ }
    return { status: "completed", outputUrl: urls[0], raw: data };
  }
  if (state === "fail" || state === "failed") {
    throw new Error(data?.failMsg || data?.fail_msg || "KIE generation failed");
  }
  return { status: "processing", jobId: data?.taskId, raw: data };
}

export const kieProvider: EngineProvider = {
  name: "kie",

  async generate(apiKey: string, model: AiModel, input: GenerateInput): Promise<GenerateResult> {
    const taskInput: Record<string, unknown> = {
      prompt: input.prompt,
      ...(input.imageUrl ? { image_url: input.imageUrl, image_urls: [input.imageUrl] } : {}),
      ...(input.options || {}),
    };
    const body = await kieFetch(apiKey, "/jobs/createTask", {
      method: "POST",
      body: JSON.stringify({ model: model.providerModelId, input: taskInput }),
    });
    const taskId = body?.data?.taskId || body?.taskId;
    if (!taskId) {
      throw new Error("KIE returned no taskId");
    }
    return { status: "processing", jobId: taskId, raw: body };
  },

  async getJobStatus(apiKey: string, jobId: string): Promise<GenerateResult> {
    const body = await kieFetch(apiKey, `/jobs/recordInfo?taskId=${encodeURIComponent(jobId)}`);
    return parseResult(body?.data ?? body);
  },

  async verifyKey(apiKey: string) {
    const body = await kieFetch(apiKey, "/chat/credit");
    const credits = body?.data;
    return { ok: true, detail: credits !== undefined ? `credits: ${JSON.stringify(credits)}` : undefined };
  },
};

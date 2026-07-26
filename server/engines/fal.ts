/**
 * fal.ai provider - FLUX family, Wan/Vidu/Hailuo/Pixverse video, face
 * swap, motion transfer via the queue API.
 *
 * Submit: POST https://queue.fal.run/{modelId} (Key auth) -> request_id
 * Poll:   GET  https://queue.fal.run/{modelId}/requests/{id}/status
 * Result: GET  https://queue.fal.run/{modelId}/requests/{id}
 */
import type { AiModel } from "@shared/schema";
import type { EngineProvider, GenerateInput, GenerateResult } from "./types";

const FAL_QUEUE = "https://queue.fal.run";

async function falFetch(apiKey: string, url: string, init?: RequestInit): Promise<any> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Authorization": `Key ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || body.message || `fal API error ${response.status}`);
  }
  return body;
}

function extractOutputUrl(result: any): string | undefined {
  return (
    result?.video?.url ||
    result?.image?.url ||
    result?.images?.[0]?.url ||
    result?.audio?.url ||
    result?.output?.url ||
    undefined
  );
}

export const falProvider: EngineProvider = {
  name: "fal",

  async generate(apiKey: string, model: AiModel, input: GenerateInput): Promise<GenerateResult> {
    const body = await falFetch(apiKey, `${FAL_QUEUE}/${model.providerModelId}`, {
      method: "POST",
      body: JSON.stringify({
        prompt: input.prompt,
        ...(input.imageUrl ? { image_url: input.imageUrl } : {}),
        ...(input.options || {}),
      }),
    });
    const requestId = body?.request_id;
    if (!requestId) {
      throw new Error("fal returned no request_id");
    }
    // Job id carries the model path so polling can rebuild the URL
    return { status: "processing", jobId: `${model.providerModelId}::${requestId}`, raw: body };
  },

  async getJobStatus(apiKey: string, jobId: string): Promise<GenerateResult> {
    const [modelPath, requestId] = jobId.split("::");
    if (!modelPath || !requestId) throw new Error("Bad fal job id");
    const status = await falFetch(apiKey, `${FAL_QUEUE}/${modelPath}/requests/${requestId}/status`);
    if (status?.status === "COMPLETED") {
      const result = await falFetch(apiKey, `${FAL_QUEUE}/${modelPath}/requests/${requestId}`);
      const outputUrl = extractOutputUrl(result);
      if (!outputUrl) throw new Error("fal job completed but returned no output URL");
      return { status: "completed", outputUrl, raw: result };
    }
    if (status?.status === "FAILED" || status?.status === "ERROR") {
      throw new Error("fal generation failed");
    }
    return { status: "processing", jobId, raw: status };
  },

  async verifyKey(apiKey: string) {
    // No dedicated cheap verify endpoint; a bad key 401s on any queue call.
    const response = await fetch(`${FAL_QUEUE}/fal-ai/flux/dev/requests/00000000-0000-0000-0000-000000000000/status`, {
      headers: { "Authorization": `Key ${apiKey}` },
    });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, detail: "fal rejected the key" };
    }
    return { ok: true }; // 404 for the dummy id = key accepted
  },
};

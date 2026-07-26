/**
 * Engine gateway contracts (PLAN.md 4.1).
 * One interface over KIE.ai / fal.ai / OpenRouter (+ existing direct
 * services). All calls run server-side with the USER'S OWN key (BYOK).
 */
import type { AiModel } from "@shared/schema";

export type Modality = "text" | "image" | "video" | "audio";

export interface GenerateInput {
  prompt: string;
  /** Optional source media for i2v / edit flows */
  imageUrl?: string;
  /** Provider-specific extras passed through verbatim */
  options?: Record<string, unknown>;
}

export interface GenerateResult {
  /** For media modalities */
  outputUrl?: string;
  /** For text modality */
  text?: string;
  /** Provider job id when async */
  jobId?: string;
  /** "completed" | "processing" | "failed" */
  status: string;
  raw?: unknown;
}

export interface EngineProvider {
  name: string;
  /** Submit a generation. May return processing + jobId for async engines. */
  generate(apiKey: string, model: AiModel, input: GenerateInput): Promise<GenerateResult>;
  /** Poll an async job. Throws if the provider has no async jobs. */
  getJobStatus?(apiKey: string, jobId: string): Promise<GenerateResult>;
  /** One cheap authed call to prove the key works. */
  verifyKey(apiKey: string): Promise<{ ok: boolean; detail?: string }>;
}

/**
 * Engine registry - resolves catalog rows (ai_models) to providers and
 * dispatches generations with the calling user's own key (BYOK).
 *
 * ANTI-PHANTOM RULE: models seed with enabled=false and are switched on
 * only after a real smoke test. The engine-selector UI must only offer
 * enabled rows - a dropdown entry with no working route is banned.
 */
import { eq } from "drizzle-orm";
import { db } from "../db";
import { aiModels, type AiModel } from "@shared/schema";
import { requireUserKey, type ProviderName } from "../keyVault";
import type { EngineProvider, GenerateInput, GenerateResult } from "./types";
import { kieProvider } from "./kie";
import { falProvider } from "./fal";
import { openrouterProvider } from "./openrouter";

const PROVIDERS: Record<string, EngineProvider> = {
  kie: kieProvider,
  fal: falProvider,
  openrouter: openrouterProvider,
};

export function getProvider(name: string): EngineProvider {
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(`Unknown engine provider: ${name}`);
  }
  return provider;
}

export async function generateWithModel(
  userId: string,
  modelId: string,
  input: GenerateInput
): Promise<GenerateResult & { modelId: string }> {
  const [model] = await db.select().from(aiModels).where(eq(aiModels.id, modelId));
  if (!model) {
    throw Object.assign(new Error(`Unknown model: ${modelId}`), { status: 404 });
  }
  if (!model.enabled) {
    throw Object.assign(new Error(`Model ${model.displayName} is not enabled`), { status: 400 });
  }
  const provider = getProvider(model.provider);
  const apiKey = await requireUserKey(userId, model.provider as ProviderName);
  const result = await provider.generate(apiKey, model, input);
  return { ...result, modelId };
}

export async function getEngineJobStatus(
  userId: string,
  modelId: string,
  jobId: string
): Promise<GenerateResult> {
  const [model] = await db.select().from(aiModels).where(eq(aiModels.id, modelId));
  if (!model) {
    throw Object.assign(new Error(`Unknown model: ${modelId}`), { status: 404 });
  }
  const provider = getProvider(model.provider);
  if (!provider.getJobStatus) {
    throw new Error(`Provider ${model.provider} has no async jobs`);
  }
  const apiKey = await requireUserKey(userId, model.provider as ProviderName);
  return provider.getJobStatus(apiKey, jobId);
}

/**
 * Starter catalog. Costs are advisory (user's own account). Everything
 * seeds DISABLED; enable each model after its smoke test passes
 * (PATCH /api/models/:id). Idempotent upsert on id.
 */
const SEED_MODELS: Omit<AiModel, "createdAt">[] = [
  // Text (OpenRouter)
  { id: "openrouter:gpt-4o", provider: "openrouter", providerModelId: "openai/gpt-4o", modality: "text", displayName: "GPT-4o", costPerCall: "~$0.01/1k tok", enabled: false, isDefault: false, notes: null },
  { id: "openrouter:claude-sonnet", provider: "openrouter", providerModelId: "anthropic/claude-sonnet-4.5", modality: "text", displayName: "Claude Sonnet", costPerCall: "~$0.01/1k tok", enabled: false, isDefault: false, notes: null },
  { id: "openrouter:gemini-flash", provider: "openrouter", providerModelId: "google/gemini-2.5-flash", modality: "text", displayName: "Gemini Flash", costPerCall: "~$0.002/1k tok", enabled: false, isDefault: false, notes: null },
  // Images
  { id: "kie:gpt-image-2", provider: "kie", providerModelId: "gpt-image-2", modality: "image", displayName: "GPT Image 2 (KIE)", costPerCall: "~$0.02/image", enabled: false, isDefault: false, notes: "House default for images" },
  { id: "fal:flux-dev", provider: "fal", providerModelId: "fal-ai/flux/dev", modality: "image", displayName: "FLUX dev (fal)", costPerCall: "~$0.025/image", enabled: false, isDefault: false, notes: null },
  // Video
  { id: "kie:grok-i2v", provider: "kie", providerModelId: "grok-imagine/image-to-video", modality: "video", displayName: "Grok Imagine i2v (KIE)", costPerCall: "~$0.05/video", enabled: false, isDefault: false, notes: "House default for cheap i2v" },
  { id: "kie:veo3-fast", provider: "kie", providerModelId: "veo3-fast", modality: "video", displayName: "Veo 3 Fast (KIE)", costPerCall: "~$0.40/video", enabled: false, isDefault: false, notes: null },
  { id: "fal:wan-i2v", provider: "fal", providerModelId: "fal-ai/wan-i2v", modality: "video", displayName: "Wan i2v (fal)", costPerCall: "~$0.15/video", enabled: false, isDefault: false, notes: null },
  // Audio
  { id: "kie:suno-music", provider: "kie", providerModelId: "suno/generate", modality: "audio", displayName: "Suno music (KIE)", costPerCall: "~$0.05/track", enabled: false, isDefault: false, notes: null },
];

export async function seedModelCatalog(): Promise<void> {
  try {
    for (const model of SEED_MODELS) {
      await db
        .insert(aiModels)
        .values(model)
        .onConflictDoNothing({ target: aiModels.id });
    }
  } catch (error) {
    // Table may not exist until db:push runs - never block boot on the seed
    console.warn("[engines] Model catalog seed skipped:", (error as Error).message);
  }
}

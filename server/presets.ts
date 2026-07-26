/**
 * Prompt presets service (PLAN.md 4.3).
 *
 * Ava's 13 "wrapper tools" were each one Gemini call wearing a different
 * prompt costume. Here they become rows in prompt_presets, executed
 * through the engine gateway with the user's own key. Rules:
 * - Templates use {{placeholder}} tokens; missing inputs are an error,
 *   never silently blank.
 * - Presets whose prompts fabricate metrics (invented search volumes,
 *   engagement rates, "98% performing" labels) are stripped or labeled
 *   "AI estimate" at seed time - never presented as data.
 */
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { promptPresets, aiModels, type PromptPreset } from "@shared/schema";
import { generateWithModel } from "./engines/registry";
import type { GenerateResult } from "./engines/types";

const SEED_FILE = path.resolve(import.meta.dirname, "data", "prompt-presets.json");

export function fillTemplate(template: string, inputs: Record<string, string>): string {
  const missing: string[] = [];
  const filled = template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_m, key: string) => {
    const value = inputs[key];
    if (value === undefined || value === null || value === "") {
      missing.push(key);
      return "";
    }
    return String(value);
  });
  if (missing.length > 0) {
    const err: any = new Error(`Missing preset inputs: ${missing.join(", ")}`);
    err.status = 400;
    err.missing = missing;
    throw err;
  }
  return filled;
}

/** Placeholders a preset expects (for the UI to render input fields). */
export function templatePlaceholders(template: string): string[] {
  const found: string[] = [];
  const regex = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    if (found.indexOf(match[1]) === -1) found.push(match[1]);
  }
  return found;
}

export async function runPreset(
  userId: string,
  presetId: string,
  inputs: Record<string, string>,
  modelId?: string
): Promise<GenerateResult & { presetId: string; modelId: string }> {
  const [preset] = await db.select().from(promptPresets).where(eq(promptPresets.id, presetId));
  if (!preset) {
    throw Object.assign(new Error(`Unknown preset: ${presetId}`), { status: 404 });
  }
  if (!preset.enabled) {
    throw Object.assign(new Error(`Preset ${preset.name} is disabled`), { status: 400 });
  }

  // Resolve the model: explicit, else the default enabled model for the modality
  let resolvedModelId = modelId;
  if (!resolvedModelId) {
    const candidates = await db.select().from(aiModels)
      .where(eq(aiModels.modality, preset.modality));
    const usable = candidates.filter((m) => m.enabled);
    const chosen = usable.find((m) => m.isDefault) || usable[0];
    if (!chosen) {
      throw Object.assign(
        new Error(`No enabled ${preset.modality} model available. Enable one in the model catalog.`),
        { status: 400 }
      );
    }
    resolvedModelId = chosen.id;
  }

  const prompt = fillTemplate(preset.template, inputs);
  const result = await generateWithModel(userId, resolvedModelId, { prompt });
  return { ...result, presetId, modelId: resolvedModelId };
}

/** Idempotent seed from server/data/prompt-presets.json (if present). */
export async function seedPromptPresets(): Promise<void> {
  try {
    if (!fs.existsSync(SEED_FILE)) {
      console.log("[presets] No seed file yet (server/data/prompt-presets.json) - skipping");
      return;
    }
    const entries = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
    let inserted = 0;
    for (const entry of entries) {
      if (!entry.id || !entry.template) continue;
      await db.insert(promptPresets)
        .values({
          id: entry.id,
          name: entry.name || entry.id,
          category: entry.category || null,
          modality: entry.modality || "text",
          template: entry.template,
          responseFormat: entry.responseFormat || null,
          notes: entry.notes || null,
          enabled: entry.enabled !== false,
        })
        .onConflictDoNothing({ target: promptPresets.id });
      inserted++;
    }
    console.log(`[presets] Seeded ${inserted} prompt presets`);
  } catch (error) {
    console.warn("[presets] Seed skipped:", (error as Error).message);
  }
}

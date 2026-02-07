/**
 * Wan Video (Alibaba) Integration via fal.ai
 * Open-source, strong competitor to Sora
 * Models: wan2.1-t2v, wan2.2-t2v (via fal.ai)
 */

import { fal } from "@fal-ai/client";

// Configure fal.ai client
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY,
  });
}

export interface WanVideoRequest {
  prompt: string;
  duration?: 5 | 10 | 15; // seconds
  resolution?: "480p" | "720p" | "1080p";
  model?: "wan2.1-t2v" | "wan2.2-t2v";
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

export interface WanVideoResult {
  requestId: string;
  status: "queued" | "generating" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export interface WanImageToVideoRequest extends WanVideoRequest {
  imageUrl: string;
}

class WanService {
  isConfigured(): boolean {
    return !!process.env.FAL_KEY;
  }

  /**
   * Generate video from text prompt
   */
  async textToVideo(request: WanVideoRequest): Promise<WanVideoResult> {
    if (!this.isConfigured()) {
      throw new Error("Fal.ai API key not configured for Wan video generation");
    }

    try {
      const model = request.model || "wan2.1-t2v";
      const result = await fal.subscribe(`fal-ai/${model}`, {
        input: {
          prompt: request.prompt,
          duration: request.duration || 5,
          aspect_ratio: request.aspectRatio || "16:9",
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log(`Wan video generation progress: ${update.logs?.join("\n")}`);
          }
        },
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        requestId: result.requestId || "unknown",
        status: "completed",
        videoUrl: result.data?.video?.url,
      };
    } catch (error) {
      console.error("Failed to generate Wan video:", error);
      throw error;
    }
  }

  /**
   * Generate video from image + prompt
   */
  async imageToVideo(request: WanImageToVideoRequest): Promise<WanVideoResult> {
    if (!this.isConfigured()) {
      throw new Error("Fal.ai API key not configured for Wan video generation");
    }

    try {
      const model = request.model || "wan2.1-t2v";
      const result = await fal.subscribe(`fal-ai/${model}`, {
        input: {
          prompt: request.prompt,
          image_url: request.imageUrl,
          duration: request.duration || 5,
          aspect_ratio: request.aspectRatio || "16:9",
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log(`Wan I2V generation progress: ${update.logs?.join("\n")}`);
          }
        },
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        requestId: result.requestId || "unknown",
        status: "completed",
        videoUrl: result.data?.video?.url,
      };
    } catch (error) {
      console.error("Failed to generate Wan I2V:", error);
      throw error;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: "wan2.1-t2v",
        name: "Wan 2.1",
        description: "T2V + I2V, 480p/720p, 5s clips",
      },
      {
        id: "wan2.2-t2v",
        name: "Wan 2.2",
        description: "MoE architecture, better quality",
      },
    ];
  }
}

export const wanService = new WanService();

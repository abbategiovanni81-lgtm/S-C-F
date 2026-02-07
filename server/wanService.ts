// Wan Video Service (Alibaba)
// Supports Wan 2.1, 2.5, 2.6 via fal.ai for simplicity

export interface WanVideoRequest {
  prompt: string;
  negativePrompt?: string;
  duration?: 5 | 10;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  model?: "wan2.1" | "wan2.5" | "wan2.6";
  numFrames?: number;
}

export interface WanVideoResult {
  videoId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export class WanService {
  private apiKey: string | undefined;
  private baseUrl = "https://queue.fal.run";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FAL_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private getModelEndpoint(model: string): string {
    switch (model) {
      case "wan2.1":
        return "fal-ai/wan-t2v";
      case "wan2.5":
        return "fal-ai/wan-2.5-t2v";
      case "wan2.6":
        return "fal-ai/wan-2.6-t2v";
      default:
        return "fal-ai/wan-t2v";
    }
  }

  private getHeaders() {
    return {
      "Authorization": `Key ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async createVideo(request: WanVideoRequest): Promise<WanVideoResult> {
    if (!this.isConfigured()) {
      throw new Error("Fal.ai API key not configured for Wan video generation.");
    }

    try {
      const modelEndpoint = this.getModelEndpoint(request.model || "wan2.1");
      
      const requestBody: any = {
        prompt: request.prompt,
      };

      if (request.negativePrompt) {
        requestBody.negative_prompt = request.negativePrompt;
      }

      if (request.numFrames) {
        requestBody.num_frames = request.numFrames;
      }

      // Map aspect ratio to dimensions
      if (request.aspectRatio) {
        const dimensionMap: Record<string, { width: number; height: number }> = {
          "16:9": { width: 1280, height: 720 },
          "9:16": { width: 720, height: 1280 },
          "1:1": { width: 1024, height: 1024 },
        };
        const dimensions = dimensionMap[request.aspectRatio];
        if (dimensions) {
          requestBody.width = dimensions.width;
          requestBody.height = dimensions.height;
        }
      }

      const response = await fetch(`${this.baseUrl}/${modelEndpoint}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Wan API error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.request_id || data.id,
        status: "processing",
        videoUrl: data.video?.url,
      };
    } catch (error: any) {
      console.error("Wan video generation error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  async getVideoStatus(videoId: string): Promise<WanVideoResult> {
    if (!this.isConfigured()) {
      throw new Error("Fal.ai API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/requests/${videoId}/status`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Wan status check error: ${error}`);
      }

      const data = await response.json();

      let status: "queued" | "processing" | "completed" | "failed" = "processing";
      if (data.status === "COMPLETED") {
        status = "completed";
      } else if (data.status === "FAILED" || data.status === "ERROR") {
        status = "failed";
      } else if (data.status === "IN_QUEUE") {
        status = "queued";
      }

      return {
        videoId,
        status,
        videoUrl: data.output?.video?.url || data.video?.url,
        error: data.error,
      };
    } catch (error: any) {
      console.error("Wan status check error:", error);
      return {
        videoId,
        status: "failed",
        error: error.message,
      };
    }
  }

  async createImageToVideo(imageUrl: string, prompt: string, duration: number = 5): Promise<WanVideoResult> {
    if (!this.isConfigured()) {
      throw new Error("Fal.ai API key not configured for Wan I2V generation.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/fal-ai/wan-i2v`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          image_url: imageUrl,
          prompt,
          num_frames: duration === 5 ? 81 : 161,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Wan I2V error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.request_id || data.id,
        status: "processing",
        videoUrl: data.video?.url,
      };
    } catch (error: any) {
      console.error("Wan I2V generation error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }
}

export const wanService = new WanService();

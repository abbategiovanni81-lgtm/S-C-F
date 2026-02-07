// Pixverse AI Video Service

export interface PixverseVideoRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  seed?: number;
}

export interface PixverseResult {
  videoId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export class PixverseService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.pixverse.ai/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PIXVERSE_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private getHeaders() {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async createVideo(request: PixverseVideoRequest): Promise<PixverseResult> {
    if (!this.isConfigured()) {
      throw new Error("Pixverse API key not configured.");
    }

    try {
      const requestBody: any = {
        prompt: request.prompt,
      };

      if (request.negativePrompt) {
        requestBody.negative_prompt = request.negativePrompt;
      }

      if (request.aspectRatio) {
        requestBody.aspect_ratio = request.aspectRatio;
      }

      if (request.seed) {
        requestBody.seed = request.seed;
      }

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pixverse API error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.id || data.task_id,
        status: "processing",
      };
    } catch (error: any) {
      console.error("Pixverse video generation error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  async getVideoStatus(videoId: string): Promise<PixverseResult> {
    if (!this.isConfigured()) {
      throw new Error("Pixverse API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/tasks/${videoId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pixverse status check error: ${error}`);
      }

      const data = await response.json();

      let status: "queued" | "processing" | "completed" | "failed" = "processing";
      if (data.status === "completed" || data.status === "success") {
        status = "completed";
      } else if (data.status === "failed") {
        status = "failed";
      } else if (data.status === "pending" || data.status === "queued") {
        status = "queued";
      }

      return {
        videoId,
        status,
        videoUrl: data.output_url || data.video_url,
        error: data.error,
      };
    } catch (error: any) {
      console.error("Pixverse status check error:", error);
      return {
        videoId,
        status: "failed",
        error: error.message,
      };
    }
  }
}

export const pixverseService = new PixverseService();

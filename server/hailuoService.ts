// Hailuo AI Video Service (Minimax)

export interface HailuoVideoRequest {
  prompt: string;
  duration?: 5 | 10;
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

export interface HailuoResult {
  videoId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export class HailuoService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.minimax.chat/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HAILUO_API_KEY || process.env.MINIMAX_API_KEY;
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

  async createVideo(request: HailuoVideoRequest): Promise<HailuoResult> {
    if (!this.isConfigured()) {
      throw new Error("Hailuo/Minimax API key not configured.");
    }

    try {
      const requestBody: any = {
        model: "video-01",
        prompt: request.prompt,
      };

      if (request.duration) {
        requestBody.duration = request.duration;
      }

      const response = await fetch(`${this.baseUrl}/video_generation`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Hailuo API error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.task_id || data.id,
        status: "processing",
      };
    } catch (error: any) {
      console.error("Hailuo video generation error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  async getVideoStatus(videoId: string): Promise<HailuoResult> {
    if (!this.isConfigured()) {
      throw new Error("Hailuo/Minimax API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/query/video_generation?task_id=${videoId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Hailuo status check error: ${error}`);
      }

      const data = await response.json();

      let status: "queued" | "processing" | "completed" | "failed" = "processing";
      if (data.status === "Success") {
        status = "completed";
      } else if (data.status === "Failed") {
        status = "failed";
      } else if (data.status === "Pending") {
        status = "queued";
      }

      return {
        videoId,
        status,
        videoUrl: data.file_url || data.video_url,
        error: data.error_message,
      };
    } catch (error: any) {
      console.error("Hailuo status check error:", error);
      return {
        videoId,
        status: "failed",
        error: error.message,
      };
    }
  }
}

export const hailuoService = new HailuoService();

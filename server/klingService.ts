// Kling AI Video Service

export interface KlingVideoRequest {
  prompt: string;
  negativePrompt?: string;
  imageUrl?: string;
  duration?: 5 | 10;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  mode?: "std" | "pro";
}

export interface KlingResult {
  videoId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export class KlingService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.klingai.com";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.KLING_API_KEY;
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

  async createVideo(request: KlingVideoRequest): Promise<KlingResult> {
    if (!this.isConfigured()) {
      throw new Error("Kling API key not configured.");
    }

    try {
      const requestBody: any = {
        model_name: request.mode === "pro" ? "kling-v1-5" : "kling-v1",
        prompt: request.prompt,
        duration: String(request.duration || 5),
      };

      if (request.negativePrompt) {
        requestBody.negative_prompt = request.negativePrompt;
      }

      if (request.imageUrl) {
        requestBody.image = request.imageUrl;
        requestBody.image_tail = true;
      }

      if (request.aspectRatio) {
        requestBody.aspect_ratio = request.aspectRatio;
      }

      const response = await fetch(`${this.baseUrl}/v1/videos/text2video`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Kling API error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.data?.task_id || data.task_id,
        status: "processing",
      };
    } catch (error: any) {
      console.error("Kling video generation error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  async getVideoStatus(videoId: string): Promise<KlingResult> {
    if (!this.isConfigured()) {
      throw new Error("Kling API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/videos/${videoId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Kling status check error: ${error}`);
      }

      const data = await response.json();
      const taskData = data.data || data;

      let status: "queued" | "processing" | "completed" | "failed" = "processing";
      if (taskData.task_status === "succeed") {
        status = "completed";
      } else if (taskData.task_status === "failed") {
        status = "failed";
      } else if (taskData.task_status === "submitted") {
        status = "queued";
      }

      return {
        videoId,
        status,
        videoUrl: taskData.task_result?.videos?.[0]?.url,
        error: taskData.task_status_msg,
      };
    } catch (error: any) {
      console.error("Kling status check error:", error);
      return {
        videoId,
        status: "failed",
        error: error.message,
      };
    }
  }
}

export const klingService = new KlingService();

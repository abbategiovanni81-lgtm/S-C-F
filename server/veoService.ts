// Google Veo 3 Video Service

export interface VeoVideoRequest {
  prompt: string;
  imageUrl?: string;
  duration?: 5 | 10;
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

export interface VeoResult {
  videoId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export class VeoService {
  private apiKey: string | undefined;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async createVideo(request: VeoVideoRequest): Promise<VeoResult> {
    if (!this.isConfigured()) {
      throw new Error("Google API key not configured for Veo.");
    }

    try {
      const requestBody: any = {
        prompt: request.prompt,
        model: "veo-3",
      };

      if (request.imageUrl) {
        requestBody.imagePrompt = request.imageUrl;
      }

      if (request.aspectRatio) {
        requestBody.aspectRatio = request.aspectRatio;
      }

      if (request.duration) {
        requestBody.duration = `${request.duration}s`;
      }

      const response = await fetch(`${this.baseUrl}/models/veo-3:generateVideo?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Veo API error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.name || data.id,
        status: "processing",
      };
    } catch (error: any) {
      console.error("Veo video generation error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  async getVideoStatus(videoId: string): Promise<VeoResult> {
    if (!this.isConfigured()) {
      throw new Error("Google API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/${videoId}?key=${this.apiKey}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Veo status check error: ${error}`);
      }

      const data = await response.json();

      let status: "queued" | "processing" | "completed" | "failed" = "processing";
      if (data.done) {
        if (data.error) {
          status = "failed";
        } else {
          status = "completed";
        }
      }

      return {
        videoId,
        status,
        videoUrl: data.response?.videoUrl,
        error: data.error?.message,
      };
    } catch (error: any) {
      console.error("Veo status check error:", error);
      return {
        videoId,
        status: "failed",
        error: error.message,
      };
    }
  }
}

export const veoService = new VeoService();

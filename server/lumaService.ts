// Luma Dream Machine Service

export interface LumaVideoRequest {
  prompt: string;
  keyframes?: {
    frame0?: { type: "image"; url: string };
    frame1?: { type: "image"; url: string };
  };
  aspectRatio?: "16:9" | "9:16" | "1:1";
  loop?: boolean;
}

export interface LumaResult {
  videoId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export class LumaService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.lumalabs.ai/dream-machine/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.LUMA_API_KEY;
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

  async createVideo(request: LumaVideoRequest): Promise<LumaResult> {
    if (!this.isConfigured()) {
      throw new Error("Luma API key not configured.");
    }

    try {
      const requestBody: any = {
        prompt: request.prompt,
      };

      if (request.keyframes) {
        requestBody.keyframes = request.keyframes;
      }

      if (request.aspectRatio) {
        requestBody.aspect_ratio = request.aspectRatio;
      }

      if (request.loop !== undefined) {
        requestBody.loop = request.loop;
      }

      const response = await fetch(`${this.baseUrl}/generations`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Luma API error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.id,
        status: "processing",
      };
    } catch (error: any) {
      console.error("Luma video generation error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  async getVideoStatus(videoId: string): Promise<LumaResult> {
    if (!this.isConfigured()) {
      throw new Error("Luma API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/generations/${videoId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Luma status check error: ${error}`);
      }

      const data = await response.json();

      let status: "queued" | "processing" | "completed" | "failed" = "processing";
      if (data.state === "completed") {
        status = "completed";
      } else if (data.state === "failed") {
        status = "failed";
      } else if (data.state === "queued") {
        status = "queued";
      }

      return {
        videoId,
        status,
        videoUrl: data.assets?.video,
        error: data.failure_reason,
      };
    } catch (error: any) {
      console.error("Luma status check error:", error);
      return {
        videoId,
        status: "failed",
        error: error.message,
      };
    }
  }

  async extendVideo(videoId: string): Promise<LumaResult> {
    if (!this.isConfigured()) {
      throw new Error("Luma API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/generations/${videoId}/extend`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Luma video extension error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.id,
        status: "processing",
      };
    } catch (error: any) {
      console.error("Luma video extension error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }
}

export const lumaService = new LumaService();

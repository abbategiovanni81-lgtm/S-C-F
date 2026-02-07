// SkyReels Video Service
// Supports talking avatars, video generation, and video extension

export interface SkyReelsAvatarRequest {
  text: string;
  avatarId?: string;
  voiceId?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  model?: "v1" | "v2" | "v3";
}

export interface SkyReelsVideoRequest {
  prompt: string;
  referenceImages?: string[];
  duration?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

export interface SkyReelsResult {
  videoId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export class SkyReelsService {
  private apiKey: string | undefined;
  private baseUrl = "https://apis.skyreels.ai";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SKYREELS_API_KEY;
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

  async createTalkingAvatar(request: SkyReelsAvatarRequest): Promise<SkyReelsResult> {
    if (!this.isConfigured()) {
      throw new Error("SkyReels API key not configured.");
    }

    try {
      const requestBody: any = {
        text: request.text,
        model: request.model || "v3",
      };

      if (request.avatarId) {
        requestBody.avatar_id = request.avatarId;
      }

      if (request.voiceId) {
        requestBody.voice_id = request.voiceId;
      }

      if (request.aspectRatio) {
        requestBody.aspect_ratio = request.aspectRatio;
      }

      const response = await fetch(`${this.baseUrl}/v1/avatar/create`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SkyReels API error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.id || data.video_id,
        status: "processing",
        videoUrl: data.video_url,
      };
    } catch (error: any) {
      console.error("SkyReels avatar generation error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  async createVideo(request: SkyReelsVideoRequest): Promise<SkyReelsResult> {
    if (!this.isConfigured()) {
      throw new Error("SkyReels API key not configured.");
    }

    try {
      const requestBody: any = {
        prompt: request.prompt,
      };

      if (request.referenceImages && request.referenceImages.length > 0) {
        requestBody.reference_images = request.referenceImages;
      }

      if (request.duration) {
        requestBody.duration = request.duration;
      }

      if (request.aspectRatio) {
        requestBody.aspect_ratio = request.aspectRatio;
      }

      const response = await fetch(`${this.baseUrl}/v1/video/generate`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SkyReels video generation error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.id || data.video_id,
        status: "processing",
        videoUrl: data.video_url,
      };
    } catch (error: any) {
      console.error("SkyReels video generation error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  async getVideoStatus(videoId: string): Promise<SkyReelsResult> {
    if (!this.isConfigured()) {
      throw new Error("SkyReels API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/video/${videoId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SkyReels status check error: ${error}`);
      }

      const data = await response.json();

      let status: "queued" | "processing" | "completed" | "failed" = "processing";
      if (data.status === "completed" || data.status === "success") {
        status = "completed";
      } else if (data.status === "failed" || data.status === "error") {
        status = "failed";
      } else if (data.status === "queued" || data.status === "pending") {
        status = "queued";
      }

      return {
        videoId,
        status,
        videoUrl: data.video_url || data.url,
        error: data.error || data.error_message,
      };
    } catch (error: any) {
      console.error("SkyReels status check error:", error);
      return {
        videoId,
        status: "failed",
        error: error.message,
      };
    }
  }

  async extendVideo(videoId: string, additionalSeconds: number = 5): Promise<SkyReelsResult> {
    if (!this.isConfigured()) {
      throw new Error("SkyReels API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/video/extend`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          video_id: videoId,
          extend_seconds: additionalSeconds,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SkyReels video extension error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.id || data.video_id,
        status: "processing",
        videoUrl: data.video_url,
      };
    } catch (error: any) {
      console.error("SkyReels video extension error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  async listAvatars(): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error("SkyReels API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/avatars`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SkyReels list avatars error: ${error}`);
      }

      const data = await response.json();
      return data.avatars || data.data || [];
    } catch (error: any) {
      console.error("SkyReels list avatars error:", error);
      return [];
    }
  }
}

export const skyreelsService = new SkyReelsService();

// Runway Gen-3 Video Service

export interface RunwayVideoRequest {
  prompt: string;
  imageUrl?: string; // For image-to-video
  duration?: 5 | 10;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  model?: "gen3a_turbo" | "gen3a";
}

export interface RunwayResult {
  videoId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export class RunwayService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.runwayml.com/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.RUNWAY_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private getHeaders() {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "X-Runway-Version": "2024-11-06",
    };
  }

  async createVideo(request: RunwayVideoRequest): Promise<RunwayResult> {
    if (!this.isConfigured()) {
      throw new Error("Runway API key not configured.");
    }

    try {
      const requestBody: any = {
        promptText: request.prompt,
        model: request.model || "gen3a_turbo",
        duration: request.duration || 5,
      };

      if (request.imageUrl) {
        requestBody.promptImage = request.imageUrl;
      }

      if (request.aspectRatio) {
        // Runway uses resolution parameters
        const resolutionMap: Record<string, string> = {
          "16:9": "1280:768",
          "9:16": "768:1280",
          "1:1": "1024:1024",
        };
        requestBody.resolution = resolutionMap[request.aspectRatio] || "1280:768";
      }

      const response = await fetch(`${this.baseUrl}/image_to_video`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Runway API error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.id,
        status: "processing",
      };
    } catch (error: any) {
      console.error("Runway video generation error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  async getVideoStatus(videoId: string): Promise<RunwayResult> {
    if (!this.isConfigured()) {
      throw new Error("Runway API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/tasks/${videoId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Runway status check error: ${error}`);
      }

      const data = await response.json();

      let status: "queued" | "processing" | "completed" | "failed" = "processing";
      if (data.status === "SUCCEEDED") {
        status = "completed";
      } else if (data.status === "FAILED") {
        status = "failed";
      } else if (data.status === "PENDING") {
        status = "queued";
      } else if (data.status === "RUNNING") {
        status = "processing";
      }

      return {
        videoId,
        status,
        videoUrl: data.output?.[0] || data.outputVideo,
        error: data.failure,
      };
    } catch (error: any) {
      console.error("Runway status check error:", error);
      return {
        videoId,
        status: "failed",
        error: error.message,
      };
    }
  }

  async extendVideo(videoId: string, additionalSeconds: number = 5): Promise<RunwayResult> {
    if (!this.isConfigured()) {
      throw new Error("Runway API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/extend`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          taskId: videoId,
          duration: additionalSeconds,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Runway video extension error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.id,
        status: "processing",
      };
    } catch (error: any) {
      console.error("Runway video extension error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }

  async createTextToVideo(prompt: string, duration: number = 5): Promise<RunwayResult> {
    if (!this.isConfigured()) {
      throw new Error("Runway API key not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/text_to_video`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          promptText: prompt,
          model: "gen3a_turbo",
          duration,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Runway T2V error: ${error}`);
      }

      const data = await response.json();

      return {
        videoId: data.id,
        status: "processing",
      };
    } catch (error: any) {
      console.error("Runway T2V generation error:", error);
      return {
        videoId: "",
        status: "failed",
        error: error.message,
      };
    }
  }
}

export const runwayService = new RunwayService();

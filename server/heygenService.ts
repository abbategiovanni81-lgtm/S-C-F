/**
 * HeyGen API Integration
 * Provides access to 100+ avatars for talking head videos
 * Free tier: 10 credits/month = ~3 minutes of video
 */

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const HEYGEN_BASE_URL = "https://api.heygen.com";

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url?: string;
  gender?: string;
  style?: string;
}

export interface HeyGenVoice {
  voice_id: string;
  voice_name: string;
  gender?: string;
  language?: string;
  preview_audio?: string;
}

export interface HeyGenVideoRequest {
  avatar_id: string;
  script: string;
  voice_id?: string;
  title?: string;
  dimension?: {
    width: number;
    height: number;
  };
}

export interface HeyGenVideoResult {
  video_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error_message?: string;
}

class HeyGenService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = HEYGEN_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private getHeaders() {
    return {
      "X-Api-Key": this.apiKey || "",
      "Content-Type": "application/json",
    };
  }

  /**
   * List available avatars
   */
  async listAvatars(): Promise<HeyGenAvatar[]> {
    if (!this.isConfigured()) {
      throw new Error("HeyGen API key not configured");
    }

    try {
      const response = await fetch(`${HEYGEN_BASE_URL}/v2/avatars`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.avatars || [];
    } catch (error) {
      console.error("Failed to list HeyGen avatars:", error);
      throw error;
    }
  }

  /**
   * List available voices
   */
  async listVoices(): Promise<HeyGenVoice[]> {
    if (!this.isConfigured()) {
      throw new Error("HeyGen API key not configured");
    }

    try {
      const response = await fetch(`${HEYGEN_BASE_URL}/v2/voices`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error("Failed to list HeyGen voices:", error);
      throw error;
    }
  }

  /**
   * Create a talking head video
   */
  async createVideo(request: HeyGenVideoRequest): Promise<HeyGenVideoResult> {
    if (!this.isConfigured()) {
      throw new Error("HeyGen API key not configured");
    }

    try {
      const response = await fetch(`${HEYGEN_BASE_URL}/v2/video/generate`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          video_inputs: [
            {
              character: {
                type: "avatar",
                avatar_id: request.avatar_id,
              },
              voice: {
                type: "text",
                input_text: request.script,
                voice_id: request.voice_id,
              },
            },
          ],
          dimension: request.dimension || {
            width: 1080,
            height: 1920, // 9:16 vertical for social media
          },
          title: request.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `HeyGen API error: ${response.statusText} - ${errorData.message || ""}`
        );
      }

      const data = await response.json();
      return {
        video_id: data.video_id,
        status: "pending",
      };
    } catch (error) {
      console.error("Failed to create HeyGen video:", error);
      throw error;
    }
  }

  /**
   * Check video generation status
   */
  async getVideoStatus(videoId: string): Promise<HeyGenVideoResult> {
    if (!this.isConfigured()) {
      throw new Error("HeyGen API key not configured");
    }

    try {
      const response = await fetch(`${HEYGEN_BASE_URL}/v1/video_status.get?video_id=${videoId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        video_id: videoId,
        status: data.status,
        video_url: data.video_url,
        thumbnail_url: data.thumbnail_url,
        duration: data.duration,
        error_message: data.error_message,
      };
    } catch (error) {
      console.error("Failed to get HeyGen video status:", error);
      throw error;
    }
  }

  /**
   * Poll for video completion
   * @param videoId Video ID to poll
   * @param maxAttempts Maximum number of polling attempts (default: 60 = 10 minutes)
   * @param intervalMs Polling interval in milliseconds (default: 10000 = 10 seconds)
   */
  async pollVideoCompletion(
    videoId: string,
    maxAttempts: number = 60,
    intervalMs: number = 10000
  ): Promise<HeyGenVideoResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getVideoStatus(videoId);

      if (status.status === "completed") {
        return status;
      }

      if (status.status === "failed") {
        throw new Error(`Video generation failed: ${status.error_message || "Unknown error"}`);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error("Video generation timed out");
  }
}

export const heygenService = new HeyGenService();

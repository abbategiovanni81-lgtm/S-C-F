import axios from "axios";

interface DIDTalkingPhotoRequest {
  sourceUrl: string; // Image URL
  scriptText: string;
  voice?: string;
  config?: {
    stitch?: boolean;
    fluent?: boolean;
  };
}

interface DIDVideoResponse {
  id: string;
  status: "created" | "processing" | "done" | "error";
  resultUrl?: string;
  error?: string;
}

/**
 * D-ID Integration
 * Create talking avatars and AI videos
 */
export class DIDService {
  private apiKey: string;
  private baseUrl = "https://api.d-id.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create talking photo from image and script
   */
  async createTalkingPhoto(request: DIDTalkingPhotoRequest): Promise<DIDVideoResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/talks`,
        {
          source_url: request.sourceUrl,
          script: {
            type: "text",
            input: request.scriptText,
            provider: {
              type: "microsoft",
              voice_id: request.voice || "en-US-JennyNeural",
            },
          },
          config: {
            stitch: request.config?.stitch ?? true,
            fluent: request.config?.fluent ?? true,
          },
        },
        {
          headers: {
            Authorization: `Basic ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        id: response.data.id,
        status: response.data.status,
        resultUrl: response.data.result_url,
      };
    } catch (error: any) {
      console.error("D-ID talking photo error:", error.response?.data || error.message);
      throw new Error(`Failed to create talking photo: ${error.message}`);
    }
  }

  /**
   * Get video status
   */
  async getVideoStatus(videoId: string): Promise<DIDVideoResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/talks/${videoId}`, {
        headers: {
          Authorization: `Basic ${this.apiKey}`,
        },
      });

      return {
        id: response.data.id,
        status: response.data.status,
        resultUrl: response.data.result_url,
        error: response.data.error,
      };
    } catch (error: any) {
      console.error("D-ID status check error:", error.response?.data || error.message);
      throw new Error(`Failed to check video status: ${error.message}`);
    }
  }

  /**
   * Create avatar video with audio file
   */
  async createAvatarVideo(
    imageUrl: string,
    audioUrl: string
  ): Promise<DIDVideoResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/talks`,
        {
          source_url: imageUrl,
          script: {
            type: "audio",
            audio_url: audioUrl,
          },
          config: {
            stitch: true,
          },
        },
        {
          headers: {
            Authorization: `Basic ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        id: response.data.id,
        status: response.data.status,
        resultUrl: response.data.result_url,
      };
    } catch (error: any) {
      console.error("D-ID avatar video error:", error.response?.data || error.message);
      throw new Error(`Failed to create avatar video: ${error.message}`);
    }
  }

  /**
   * List available voices
   */
  async listVoices(): Promise<Array<{ id: string; name: string; language: string }>> {
    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          Authorization: `Basic ${this.apiKey}`,
        },
      });

      return response.data.voices || [];
    } catch (error: any) {
      console.error("D-ID voices list error:", error.response?.data || error.message);
      return [];
    }
  }
}

export function createDIDService(apiKey: string): DIDService {
  return new DIDService(apiKey);
}

import axios from "axios";

interface CreatifyAdRequest {
  productName: string;
  productDescription: string;
  productUrl?: string;
  imageUrl?: string;
  voiceId?: string;
  style?: "dynamic" | "minimal" | "luxury" | "fun";
  duration?: number;
}

interface CreatifyVideoResponse {
  id: string;
  status: "processing" | "completed" | "failed";
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Creatify Integration
 * AI-powered video ad creation platform
 */
export class CreatifyService {
  private apiKey: string;
  private baseUrl = "https://api.creatify.ai/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create AI-generated video ad
   */
  async createVideoAd(request: CreatifyAdRequest): Promise<CreatifyVideoResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/videos`,
        {
          product_name: request.productName,
          product_description: request.productDescription,
          product_url: request.productUrl,
          image_url: request.imageUrl,
          voice_id: request.voiceId || "default",
          style: request.style || "dynamic",
          duration: request.duration || 30,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        id: response.data.id,
        status: response.data.status,
        videoUrl: response.data.video_url,
        thumbnailUrl: response.data.thumbnail_url,
      };
    } catch (error: any) {
      console.error("Creatify video creation error:", error.response?.data || error.message);
      throw new Error(`Failed to create video ad: ${error.message}`);
    }
  }

  /**
   * Get video status
   */
  async getVideoStatus(videoId: string): Promise<CreatifyVideoResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/videos/${videoId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return {
        id: response.data.id,
        status: response.data.status,
        videoUrl: response.data.video_url,
        thumbnailUrl: response.data.thumbnail_url,
        error: response.data.error,
      };
    } catch (error: any) {
      console.error("Creatify status check error:", error.response?.data || error.message);
      throw new Error(`Failed to check video status: ${error.message}`);
    }
  }

  /**
   * Generate multiple ad variations
   */
  async createAdVariations(
    request: CreatifyAdRequest,
    variationCount: number = 3
  ): Promise<CreatifyVideoResponse[]> {
    try {
      const styles = ["dynamic", "minimal", "luxury", "fun"];
      const variations: CreatifyVideoResponse[] = [];

      for (let i = 0; i < Math.min(variationCount, styles.length); i++) {
        const variation = await this.createVideoAd({
          ...request,
          style: styles[i] as any,
        });
        variations.push(variation);
      }

      return variations;
    } catch (error: any) {
      console.error("Creatify variations error:", error);
      throw new Error(`Failed to create ad variations: ${error.message}`);
    }
  }

  /**
   * List available voices
   */
  async listVoices(): Promise<Array<{ id: string; name: string; language: string }>> {
    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.data.voices || [];
    } catch (error: any) {
      console.error("Creatify voices list error:", error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Create UGC-style video ad
   */
  async createUGCAd(
    productName: string,
    script: string,
    avatarImageUrl: string
  ): Promise<CreatifyVideoResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/videos/ugc`,
        {
          product_name: productName,
          script: script,
          avatar_image: avatarImageUrl,
          style: "ugc",
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        id: response.data.id,
        status: response.data.status,
        videoUrl: response.data.video_url,
        thumbnailUrl: response.data.thumbnail_url,
      };
    } catch (error: any) {
      console.error("Creatify UGC ad error:", error.response?.data || error.message);
      throw new Error(`Failed to create UGC ad: ${error.message}`);
    }
  }
}

export function createCreatifyService(apiKey: string): CreatifyService {
  return new CreatifyService(apiKey);
}

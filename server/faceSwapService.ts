// Face Swap Service
// This service handles face swapping using external API

const FACE_SWAP_API_KEY = process.env.FACE_SWAP_API_KEY;
const FACE_SWAP_BASE_URL = "https://api.faceswap.ai/v1"; // Placeholder URL - update with actual endpoint

interface FaceSwapRequest {
  sourceImageUrl: string; // Face to extract
  targetImageUrl: string; // Image to apply face to
}

interface FaceSwapResponse {
  requestId: string;
  status: "queued" | "processing" | "completed" | "failed";
  resultUrl?: string;
  errorMessage?: string;
}

class FaceSwapService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = FACE_SWAP_API_KEY;
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

  /**
   * Submit a face swap request
   */
  async swapFace(request: FaceSwapRequest): Promise<FaceSwapResponse> {
    if (!this.isConfigured()) {
      throw new Error("Face Swap API key not configured");
    }

    try {
      const response = await fetch(`${FACE_SWAP_BASE_URL}/swap`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          source_image: request.sourceImageUrl,
          target_image: request.targetImageUrl,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Face Swap API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return {
        requestId: data.request_id || data.id,
        status: data.status,
        resultUrl: data.result_url || data.output,
        errorMessage: data.error_message,
      };
    } catch (error: any) {
      throw new Error(`Failed to swap face: ${error.message}`);
    }
  }

  /**
   * Check the status of a face swap job
   */
  async getStatus(requestId: string): Promise<FaceSwapResponse> {
    if (!this.isConfigured()) {
      throw new Error("Face Swap API key not configured");
    }

    try {
      const response = await fetch(`${FACE_SWAP_BASE_URL}/status/${requestId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Face Swap API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return {
        requestId: data.request_id || data.id,
        status: data.status,
        resultUrl: data.result_url || data.output,
        errorMessage: data.error_message,
      };
    } catch (error: any) {
      throw new Error(`Failed to get face swap status: ${error.message}`);
    }
  }
}

export const faceSwapService = new FaceSwapService();

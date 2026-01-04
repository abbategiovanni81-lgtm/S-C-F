const A2E_API_KEY = process.env.A2E_API_KEY;
const A2E_BASE_URL = "https://video.a2e.ai";

interface A2EAvatar {
  id: string;
  name: string;
  thumbnail?: string;
  gender?: string;
}

interface LipSyncResponse {
  lipsync_item_id: string;
  status: string;
}

interface LipSyncStatus {
  id: string;
  status: "pending" | "processing" | "done" | "error";
  output?: string;
  error_message?: string;
}

class A2EService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = A2E_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private getHeaders() {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "x-lang": "en-US",
    };
  }

  async listAvatars(): Promise<A2EAvatar[]> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/anchor/character_list`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E API error: ${error}`);
      }

      const data = await response.json();
      // Map A2E response to our avatar interface
      const avatars = data.data || [];
      return avatars.map((a: any) => ({
        id: a._id,
        name: a.type === "custom" ? "Custom Avatar" : `Avatar ${a._id.slice(-4)}`,
        thumbnail: a.video_cover || a.people_img || a.base_video,
        gender: a.type,
      }));
    } catch (error: any) {
      console.error("A2E list avatars error:", error);
      throw error;
    }
  }

  async generateLipSync(params: {
    text: string;
    creatorId: string;
    aspectRatio?: string;
    voiceId?: string;
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const requestBody: any = {
        text: params.text,
        creator_id: params.creatorId,
        aspect_ratio: params.aspectRatio || "9:16",
      };

      if (params.voiceId) {
        requestBody.voice_id = params.voiceId;
      }

      const response = await fetch(`${A2E_BASE_URL}/api/lipsyncs/`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E lip-sync error: ${error}`);
      }

      const data = await response.json();
      return data.lipsync_item_id || data.id;
    } catch (error: any) {
      console.error("A2E generate lip-sync error:", error);
      throw error;
    }
  }

  async checkLipSyncStatus(lipSyncId: string): Promise<LipSyncStatus> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/lipsyncs/${lipSyncId}/`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E status check error: ${error}`);
      }

      const data = await response.json();
      return {
        id: lipSyncId,
        status: data.status,
        output: data.output || data.video_url,
        error_message: data.error_message,
      };
    } catch (error: any) {
      console.error("A2E check status error:", error);
      throw error;
    }
  }

  async generateImageToVideo(params: {
    imageUrl: string;
    prompt?: string;
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/userImage2Video/start`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: `video_${Date.now()}`,
          image_url: params.imageUrl,
          prompt: params.prompt || "Smooth motion, camera slightly moving, cinematic scene, detailed, high quality",
          negative_prompt: "blurry, low quality, worst quality, distorted, static image, no motion",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E image-to-video error: ${error}`);
      }

      const data = await response.json();
      console.log("A2E image-to-video response:", JSON.stringify(data, null, 2));
      
      if (data.code === 0 && data.data?._id) {
        return data.data._id;
      }
      
      return data.task_id || data.id || data.data?._id;
    } catch (error: any) {
      console.error("A2E image-to-video error:", error);
      throw error;
    }
  }

  async checkImageToVideoStatus(taskId: string): Promise<LipSyncStatus> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/userImage2Video/${taskId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E status check error: ${error}`);
      }

      const data = await response.json();
      return {
        id: taskId,
        status: data.status,
        output: data.output || data.video_url,
        error_message: data.error_message,
      };
    } catch (error: any) {
      console.error("A2E check image-to-video status error:", error);
      throw error;
    }
  }

  async pollForCompletion(lipSyncId: string, maxAttempts = 60, intervalMs = 5000): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.checkLipSyncStatus(lipSyncId);
      
      if (status.status === "done" && status.output) {
        return status.output;
      }
      
      if (status.status === "error") {
        throw new Error(status.error_message || "A2E video generation failed");
      }
      
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error("A2E video generation timed out");
  }

  // ==================== CREATOR STUDIO FEATURES ====================

  // Voice Cloning - Clone a voice from audio/video
  async cloneVoice(params: {
    audioUrl: string;
    voiceName: string;
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/voice_clone/train`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          audio_url: params.audioUrl,
          voice_name: params.voiceName,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E voice clone error: ${error}`);
      }

      const data = await response.json();
      return data.task_id || data.voice_id;
    } catch (error: any) {
      console.error("A2E voice clone error:", error);
      throw error;
    }
  }

  // List cloned voices
  async listVoices(): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/voice_clone/list`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E list voices error: ${error}`);
      }

      const data = await response.json();
      return data.voices || data.results || [];
    } catch (error: any) {
      console.error("A2E list voices error:", error);
      throw error;
    }
  }

  // Talking Photo - Animate a photo to speak
  async generateTalkingPhoto(params: {
    imageUrl: string;
    text: string;
    voiceId?: string;
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/talking_photo/start`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          image_url: params.imageUrl,
          text: params.text,
          voice_id: params.voiceId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E talking photo error: ${error}`);
      }

      const data = await response.json();
      return data.task_id || data.id;
    } catch (error: any) {
      console.error("A2E talking photo error:", error);
      throw error;
    }
  }

  async checkTalkingPhotoStatus(taskId: string): Promise<LipSyncStatus> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/talking_photo/${taskId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E status check error: ${error}`);
      }

      const data = await response.json();
      return {
        id: taskId,
        status: data.status,
        output: data.output || data.video_url,
        error_message: data.error_message,
      };
    } catch (error: any) {
      console.error("A2E check talking photo status error:", error);
      throw error;
    }
  }

  // Talking Video - Make existing video speak new audio
  async generateTalkingVideo(params: {
    videoUrl: string;
    text: string;
    voiceId?: string;
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/talking_video/start`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          video_url: params.videoUrl,
          text: params.text,
          voice_id: params.voiceId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E talking video error: ${error}`);
      }

      const data = await response.json();
      return data.task_id || data.id;
    } catch (error: any) {
      console.error("A2E talking video error:", error);
      throw error;
    }
  }

  async checkTalkingVideoStatus(taskId: string): Promise<LipSyncStatus> {
    return this.checkTalkingPhotoStatus(taskId); // Same endpoint pattern
  }

  // Face Swap
  async generateFaceSwap(params: {
    sourceImageUrl: string;  // Face to swap in
    targetVideoUrl: string;  // Video to swap face into
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/face_swap/start`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          source_image_url: params.sourceImageUrl,
          target_video_url: params.targetVideoUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E face swap error: ${error}`);
      }

      const data = await response.json();
      return data.task_id || data.id;
    } catch (error: any) {
      console.error("A2E face swap error:", error);
      throw error;
    }
  }

  async checkFaceSwapStatus(taskId: string): Promise<LipSyncStatus> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/face_swap/${taskId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E status check error: ${error}`);
      }

      const data = await response.json();
      return {
        id: taskId,
        status: data.status,
        output: data.output || data.video_url,
        error_message: data.error_message,
      };
    } catch (error: any) {
      console.error("A2E check face swap status error:", error);
      throw error;
    }
  }

  // AI Dubbing - Translate and dub video
  async generateDubbing(params: {
    videoUrl: string;
    targetLanguage: string;  // "en", "es", "fr", etc.
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/dubbing/start`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          video_url: params.videoUrl,
          target_language: params.targetLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E dubbing error: ${error}`);
      }

      const data = await response.json();
      return data.task_id || data.id;
    } catch (error: any) {
      console.error("A2E dubbing error:", error);
      throw error;
    }
  }

  async checkDubbingStatus(taskId: string): Promise<LipSyncStatus> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/dubbing/${taskId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E status check error: ${error}`);
      }

      const data = await response.json();
      return {
        id: taskId,
        status: data.status,
        output: data.output || data.video_url,
        error_message: data.error_message,
      };
    } catch (error: any) {
      console.error("A2E check dubbing status error:", error);
      throw error;
    }
  }

  // Caption Removal
  async removeCaptions(params: {
    videoUrl: string;
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/caption_removal/start`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          video_url: params.videoUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E caption removal error: ${error}`);
      }

      const data = await response.json();
      return data.task_id || data.id;
    } catch (error: any) {
      console.error("A2E caption removal error:", error);
      throw error;
    }
  }

  async checkCaptionRemovalStatus(taskId: string): Promise<LipSyncStatus> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/caption_removal/${taskId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E status check error: ${error}`);
      }

      const data = await response.json();
      return {
        id: taskId,
        status: data.status,
        output: data.output || data.video_url,
        error_message: data.error_message,
      };
    } catch (error: any) {
      console.error("A2E check caption removal status error:", error);
      throw error;
    }
  }

  // Video to Video - Style transfer
  async generateVideoToVideo(params: {
    videoUrl: string;
    prompt: string;  // Style description
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/video_to_video/start`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          video_url: params.videoUrl,
          prompt: params.prompt,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E video-to-video error: ${error}`);
      }

      const data = await response.json();
      return data.task_id || data.id;
    } catch (error: any) {
      console.error("A2E video-to-video error:", error);
      throw error;
    }
  }

  async checkVideoToVideoStatus(taskId: string): Promise<LipSyncStatus> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/video_to_video/${taskId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E status check error: ${error}`);
      }

      const data = await response.json();
      return {
        id: taskId,
        status: data.status,
        output: data.output || data.video_url,
        error_message: data.error_message,
      };
    } catch (error: any) {
      console.error("A2E check video-to-video status error:", error);
      throw error;
    }
  }

  // Virtual Try-On
  async generateVirtualTryOn(params: {
    personImageUrl: string;
    clothingImageUrl: string;
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/virtual_tryon/start`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          person_image_url: params.personImageUrl,
          clothing_image_url: params.clothingImageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E virtual try-on error: ${error}`);
      }

      const data = await response.json();
      return data.task_id || data.id;
    } catch (error: any) {
      console.error("A2E virtual try-on error:", error);
      throw error;
    }
  }

  async checkVirtualTryOnStatus(taskId: string): Promise<LipSyncStatus> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/virtual_tryon/${taskId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E status check error: ${error}`);
      }

      const data = await response.json();
      return {
        id: taskId,
        status: data.status,
        output: data.output || data.image_url,
        error_message: data.error_message,
      };
    } catch (error: any) {
      console.error("A2E check virtual try-on status error:", error);
      throw error;
    }
  }

  // Generic task status check (for any task type)
  async checkTaskStatus(taskId: string, taskType: string): Promise<LipSyncStatus> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      const response = await fetch(`${A2E_BASE_URL}/api/v1/${taskType}/${taskId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E status check error: ${error}`);
      }

      const data = await response.json();
      return {
        id: taskId,
        status: data.status,
        output: data.output || data.video_url || data.image_url,
        error_message: data.error_message,
      };
    } catch (error: any) {
      console.error(`A2E check ${taskType} status error:`, error);
      throw error;
    }
  }

  // Text-to-Image generation - starts task and polls until complete
  async generateImage(params: {
    prompt: string;
    width?: number;
    height?: number;
    style?: "general" | "manga";
  }): Promise<{ imageUrl: string; taskId: string }> {
    if (!this.isConfigured()) {
      throw new Error("A2E API key not configured");
    }

    try {
      // Map style to req_key
      const reqKey = params.style === "manga" ? "high_aes" : "high_aes_general_v21_L";
      
      const response = await fetch(`${A2E_BASE_URL}/api/v1/userText2image/start`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: `image_${Date.now()}`,
          prompt: params.prompt,
          req_key: reqKey,
          width: params.width || 1024,
          height: params.height || 1024,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`A2E text-to-image error: ${error}`);
      }

      const data = await response.json();
      console.log("A2E text-to-image initial response:", JSON.stringify(data, null, 2));
      
      // A2E returns data as array with task info
      if (data.code === 0 && Array.isArray(data.data) && data.data[0]) {
        const task = data.data[0];
        const taskId = task._id;
        
        // If already completed with images
        if (task.current_status === "completed" && task.image_urls?.[0]) {
          return {
            imageUrl: task.image_urls[0],
            taskId,
          };
        }
        
        // Poll for completion
        return await this.pollImageTask(taskId);
      }
      
      // Check if the response has a different structure (single object)
      if (data.code === 0 && data.data?._id) {
        const task = data.data;
        if (task.current_status === "completed" && task.image_urls?.[0]) {
          return {
            imageUrl: task.image_urls[0],
            taskId: task._id,
          };
        }
        return await this.pollImageTask(task._id);
      }
      
      throw new Error(`A2E text-to-image failed: ${data.failed_message || data.message || 'Invalid response'}`);
    } catch (error: any) {
      console.error("A2E text-to-image error:", error);
      throw error;
    }
  }
  
  // Poll text-to-image task until complete
  private async pollImageTask(taskId: string, maxAttempts: number = 60): Promise<{ imageUrl: string; taskId: string }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
      
      try {
        const response = await fetch(`${A2E_BASE_URL}/api/v1/userText2image/${taskId}`, {
          method: "GET",
          headers: this.getHeaders(),
        });
        
        if (!response.ok) {
          console.log(`A2E image poll attempt ${attempt + 1} failed, retrying...`);
          continue;
        }
        
        const data = await response.json();
        console.log(`A2E image poll ${attempt + 1}:`, data.data?.current_status || data.current_status);
        
        const task = data.data || data;
        
        if (task.current_status === "completed" && task.image_urls?.[0]) {
          return {
            imageUrl: task.image_urls[0],
            taskId,
          };
        }
        
        if (task.current_status === "failed" || task.failed_code) {
          throw new Error(`A2E image generation failed: ${task.failed_message || 'Unknown error'}`);
        }
        
        // Continue polling for initialized/processing states
      } catch (error: any) {
        console.log(`A2E image poll attempt ${attempt + 1} error:`, error.message);
      }
    }
    
    throw new Error("A2E text-to-image timed out after 2 minutes");
  }
}

export const a2eService = new A2EService();

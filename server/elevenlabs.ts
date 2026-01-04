import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { ObjectStorageService } from "./objectStorage";

export interface ElevenLabsConfig {
  apiKey: string;
}

export interface VoiceoverRequest {
  text: string;
  voiceId?: string;
  modelId?: string;
}

export interface VideoGenerationRequest {
  script: string;
  voiceId?: string;
  avatarId?: string;
}

export interface VoiceoverResult {
  audioUrl: string;
  duration: number;
}

export interface VideoResult {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
}

export class ElevenLabsService {
  private apiKey: string | undefined;
  private baseUrl = "https://api.elevenlabs.io/v1";
  private objectStorageService: ObjectStorageService;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.objectStorageService = new ObjectStorageService();
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateVoiceover(request: VoiceoverRequest): Promise<VoiceoverResult> {
    if (!this.apiKey) {
      throw new Error("ElevenLabs API key not configured. Please add ELEVENLABS_API_KEY to your secrets.");
    }

    const voiceId = request.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel voice
    const modelId = request.modelId || "eleven_monolingual_v1";

    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": this.apiKey,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${error}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);
    const filename = `audio-${randomUUID()}.mp3`;
    
    // Save audio to cloud storage for persistence in production
    try {
      const result = await this.objectStorageService.uploadBuffer(buffer, filename, "audio/mpeg", true);
      console.log(`Saved ElevenLabs audio to cloud storage: ${result.objectPath}`);
      return {
        audioUrl: result.objectPath,
        duration: 0,
      };
    } catch (cloudError) {
      console.error("Failed to save audio to cloud storage, falling back to local:", cloudError);
      
      // Fallback to local storage (for dev only)
      const mediaDir = path.join(process.cwd(), "public", "generated-media");
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }
      const filePath = path.join(mediaDir, filename);
      fs.writeFileSync(filePath, buffer);
      
      return {
        audioUrl: `/generated-media/${filename}`,
        duration: 0,
      };
    }
  }

  async getVoices(): Promise<Array<{ id: string; name: string; category: string }>> {
    if (!this.apiKey) {
      throw new Error("ElevenLabs API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        "xi-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch voices from ElevenLabs");
    }

    const data = await response.json();
    return data.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category,
    }));
  }

  async checkQuota(): Promise<{ charactersUsed: number; charactersLimit: number }> {
    if (!this.apiKey) {
      throw new Error("ElevenLabs API key not configured.");
    }

    const response = await fetch(`${this.baseUrl}/user/subscription`, {
      headers: {
        "xi-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to check ElevenLabs quota");
    }

    const data = await response.json();
    return {
      charactersUsed: data.character_count,
      charactersLimit: data.character_limit,
    };
  }
}

export const elevenlabsService = new ElevenLabsService();

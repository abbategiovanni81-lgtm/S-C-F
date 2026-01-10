import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const ttsClient = new OpenAI({
  apiKey: process.env.OPENAI_DALLE_API_KEY || process.env.OPENAI_API_KEY,
});

export type OpenAIVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
export type TTSModel = "tts-1" | "tts-1-hd";

export interface OpenAITTSRequest {
  text: string;
  voice?: OpenAIVoice;
  model?: TTSModel;
  speed?: number;
}

export interface OpenAITTSResult {
  audioUrl: string;
  audioBuffer?: Buffer;
}

export function isOpenAITTSConfigured(): boolean {
  return !!(process.env.OPENAI_DALLE_API_KEY || process.env.OPENAI_API_KEY);
}

export async function generateOpenAIVoiceover(request: OpenAITTSRequest): Promise<OpenAITTSResult> {
  if (!isOpenAITTSConfigured()) {
    throw new Error("OpenAI API key not configured for TTS.");
  }

  const response = await ttsClient.audio.speech.create({
    model: request.model || "tts-1",
    voice: request.voice || "nova",
    input: request.text,
    speed: request.speed || 1.0,
  });

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  
  const mediaDir = path.join(process.cwd(), "public", "generated-media");
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }
  
  const filename = `openai-tts-${randomUUID()}.mp3`;
  const filePath = path.join(mediaDir, filename);
  fs.writeFileSync(filePath, audioBuffer);
  
  return {
    audioUrl: `/generated-media/${filename}`,
    audioBuffer,
  };
}

export const OPENAI_VOICES: { id: OpenAIVoice; name: string; description: string }[] = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "echo", name: "Echo", description: "Warm and friendly" },
  { id: "fable", name: "Fable", description: "Expressive and dynamic" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "nova", name: "Nova", description: "Warm and conversational" },
  { id: "shimmer", name: "Shimmer", description: "Clear and bright" },
];

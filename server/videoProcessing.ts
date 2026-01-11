import { openai } from "./openai";
import { ObjectStorageService } from "./objectStorage";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";
import OpenAI from "openai";

const execAsync = promisify(exec);
const objectStorageService = new ObjectStorageService();

// Use direct OpenAI API for Whisper (Replit proxy doesn't support audio endpoints)
function getWhisperClient(): OpenAI {
  const apiKey = process.env.OPENAI_DALLE_API_KEY;
  if (!apiKey) {
    throw new Error("Video transcription not configured. Please add OPENAI_DALLE_API_KEY in Settings.");
  }
  return new OpenAI({ apiKey });
}

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface ClipSuggestion {
  title: string;
  startTime: number;
  endTime: number;
  transcript: string;
  score: number;
  reason: string;
}

export async function getVideoDuration(videoPath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    );
    return Math.floor(parseFloat(stdout.trim()));
  } catch (error) {
    console.error("Error getting video duration:", error);
    return 0;
  }
}

export async function extractAudioFromVideo(videoPath: string, outputPath: string): Promise<void> {
  await execAsync(
    `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ar 16000 -ac 1 -q:a 4 "${outputPath}" -y`
  );
}

export async function transcribeAudio(audioPath: string): Promise<{ transcript: string; segments: TranscriptSegment[] }> {
  const audioFile = fs.createReadStream(audioPath);
  
  // Use direct OpenAI client for Whisper (not Replit proxy)
  const whisperClient = getWhisperClient();
  const response = await whisperClient.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  const segments: TranscriptSegment[] = (response as any).segments?.map((seg: any) => ({
    start: Math.floor(seg.start),
    end: Math.ceil(seg.end),
    text: seg.text.trim(),
  })) || [];

  return {
    transcript: response.text,
    segments,
  };
}

export async function analyzeTranscriptForClips(
  transcript: string,
  segments: TranscriptSegment[],
  duration: number,
  suggestions: string[],
  customPrompt?: string
): Promise<ClipSuggestion[]> {
  const suggestionMap: Record<string, string> = {
    key_insights: "Key insights, tips, and valuable advice",
    emotional_highs: "Emotional moments, reactions, or compelling stories",
    unique_strategies: "Unique strategies, tactics, or actionable frameworks",
  };

  const focusAreas = suggestions.map(s => suggestionMap[s] || s).join(", ");
  const additionalInstructions = customPrompt ? `\n\nAdditional user instructions: ${customPrompt}` : "";

  const systemPrompt = `You are an expert video editor and content strategist. Your job is to identify the best moments from a video transcript to create short-form clips (15-60 seconds) for social media.

Focus areas: ${focusAreas || "Most engaging and valuable moments"}${additionalInstructions}

Analyze the transcript and identify 3-6 clip-worthy segments. Each clip should:
- Be self-contained and make sense without context
- Start with a hook or attention-grabbing moment
- Have a clear payoff or value delivery
- Be between 15-60 seconds long

Return a JSON array of clip suggestions.`;

  const userPrompt = `Video duration: ${duration} seconds

Transcript with timestamps:
${segments.map(s => `[${s.start}s - ${s.end}s] ${s.text}`).join("\n")}

Identify the best 3-6 clips. Return ONLY a valid JSON array with this structure:
[
  {
    "title": "Brief descriptive title",
    "startTime": <start in seconds>,
    "endTime": <end in seconds>,
    "transcript": "The text for this clip segment",
    "score": <1-100 confidence score>,
    "reason": "Why this is a good clip"
  }
]`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  
  try {
    const parsed = JSON.parse(content);
    const clips = Array.isArray(parsed) ? parsed : parsed.clips || [];
    
    return clips.map((clip: any) => ({
      title: clip.title || "Untitled Clip",
      startTime: Math.max(0, clip.startTime || 0),
      endTime: Math.min(duration, clip.endTime || clip.startTime + 30),
      transcript: clip.transcript || "",
      score: clip.score || 50,
      reason: clip.reason || "",
    }));
  } catch (error) {
    console.error("Error parsing clip suggestions:", error);
    return [];
  }
}

export async function extractVideoClip(
  inputPath: string,
  outputPath: string,
  startTime: number,
  endTime: number,
  vertical: boolean = true
): Promise<void> {
  const duration = endTime - startTime;
  
  const scaleFilter = vertical 
    ? "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2"
    : "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2";

  await execAsync(
    `ffmpeg -ss ${startTime} -i "${inputPath}" -t ${duration} -vf "${scaleFilter}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outputPath}" -y`
  );
}

export async function generateThumbnail(
  videoPath: string,
  outputPath: string,
  timeOffset: number = 0
): Promise<void> {
  await execAsync(
    `ffmpeg -ss ${timeOffset} -i "${videoPath}" -vframes 1 -vf "scale=480:-1" "${outputPath}" -y`
  );
}

export async function processVideoForClipsFromPath(
  videoPath: string,
  userId: string,
  suggestions: string[],
  customPrompt?: string,
  onProgress?: (status: string, progress: number) => void
): Promise<{
  clips: ClipSuggestion[];
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
}> {
  const tempDir = path.dirname(videoPath);
  const audioPath = path.join(tempDir, "audio.mp3");
  
  try {
    onProgress?.("Getting video info...", 20);
    const duration = await getVideoDuration(videoPath);
    if (duration === 0) {
      throw new Error("Could not read video. Please check the file format is supported (MP4, MOV, AVI).");
    }
    
    onProgress?.("Extracting audio...", 30);
    try {
      await extractAudioFromVideo(videoPath, audioPath);
    } catch (err: any) {
      console.error("Audio extraction failed:", err);
      throw new Error("Failed to extract audio from video. The file may be corrupted or in an unsupported format.");
    }
    
    onProgress?.("Transcribing with AI...", 50);
    let transcript: string;
    let segments: TranscriptSegment[];
    try {
      const result = await transcribeAudio(audioPath);
      transcript = result.transcript;
      segments = result.segments;
    } catch (err: any) {
      console.error("Transcription failed:", err);
      if (err.message?.includes("not configured")) {
        throw err;
      }
      throw new Error("AI transcription failed. Please try again or use a shorter video.");
    }
    
    onProgress?.("Analyzing for best clips...", 70);
    const clips = await analyzeTranscriptForClips(
      transcript,
      segments,
      duration,
      suggestions,
      customPrompt
    );
    
    onProgress?.("Complete!", 100);
    
    return { clips, transcript, segments, duration };
  } finally {
    try { fs.unlinkSync(audioPath); } catch (e) { }
  }
}

export async function processVideoForClips(
  videoBuffer: Buffer,
  userId: string,
  suggestions: string[],
  customPrompt?: string,
  onProgress?: (status: string, progress: number) => void
): Promise<{
  clips: ClipSuggestion[];
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
}> {
  const tempDir = path.join(os.tmpdir(), `video-clips-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  
  const videoPath = path.join(tempDir, "input.mp4");
  
  try {
    onProgress?.("Saving video...", 10);
    fs.writeFileSync(videoPath, videoBuffer);
    
    return await processVideoForClipsFromPath(videoPath, userId, suggestions, customPrompt, onProgress);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

export async function extractAndUploadClip(
  videoPath: string,
  userId: string,
  clipIndex: number,
  startTime: number,
  endTime: number
): Promise<{ clipPath: string; thumbnailPath: string }> {
  const tempDir = path.join(os.tmpdir(), `clip-extract-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  
  const clipTempPath = path.join(tempDir, "clip.mp4");
  const thumbTempPath = path.join(tempDir, "thumb.jpg");
  
  try {
    await extractVideoClip(videoPath, clipTempPath, startTime, endTime, true);
    await generateThumbnail(clipTempPath, thumbTempPath, 1);
    
    const clipFilename = `clip-${userId}-${Date.now()}-${clipIndex}.mp4`;
    const thumbFilename = `thumb-${userId}-${Date.now()}-${clipIndex}.jpg`;
    
    const clipResult = await objectStorageService.uploadBuffer(
      fs.readFileSync(clipTempPath),
      clipFilename,
      "video/mp4",
      true
    );
    
    const thumbResult = await objectStorageService.uploadBuffer(
      fs.readFileSync(thumbTempPath),
      thumbFilename,
      "image/jpeg",
      true
    );
    
    return {
      clipPath: clipResult.objectPath,
      thumbnailPath: thumbResult.objectPath,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

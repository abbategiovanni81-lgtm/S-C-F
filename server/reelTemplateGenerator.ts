import OpenAI from "openai";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface ReelStructure {
  scene: number;
  start: number;
  end: number;
  type: "hook" | "buildup" | "climax" | "cta" | "other";
  description: string;
}

interface Transition {
  at: number;
  type: "cut" | "fade" | "zoom" | "slide" | "effect";
  style: string;
}

interface TextOverlay {
  start: number;
  end: number;
  text: string;
  position: "top" | "center" | "bottom";
  style?: string;
}

interface ReelTemplate {
  name: string;
  sourceVideoUrl: string;
  duration: number;
  structure: ReelStructure[];
  transitions: Transition[];
  audioTiming: {
    beats: number[];
    musicCues: Array<{ time: number; type: string }>;
  };
  visualStyle: {
    colorGrading?: string;
    effects?: string[];
    filters?: string[];
  };
  textOverlays: TextOverlay[];
  pacing: "fast" | "medium" | "slow";
}

/**
 * Reel-to-Template Generator
 * Analyzes viral reels to extract reusable templates
 */
export class ReelTemplateGenerator {
  private openai: OpenAI;

  constructor(openaiKey?: string) {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  /**
   * Analyze a reel and generate a reusable template
   */
  async analyzeReelForTemplate(
    videoUrl: string,
    videoPath?: string,
    transcript?: string
  ): Promise<ReelTemplate> {
    try {
      // Get video metadata
      const metadata = videoPath ? await this.getVideoMetadata(videoPath) : { duration: 60 };
      
      // Analyze structure using AI
      const structure = await this.analyzeStructure(transcript || "", metadata.duration);
      
      // Detect transitions
      const transitions = videoPath ? await this.detectTransitions(videoPath) : [];
      
      // Extract audio timing (beats, cues)
      const audioTiming = videoPath ? await this.extractAudioTiming(videoPath) : { beats: [], musicCues: [] };
      
      // Analyze visual style
      const visualStyle = await this.analyzeVisualStyle(transcript || "");
      
      // Extract text overlays from transcript analysis
      const textOverlays = await this.extractTextOverlays(transcript || "", metadata.duration);
      
      // Determine pacing
      const pacing = this.determinePacing(structure, metadata.duration);
      
      return {
        name: `Reel Template - ${new Date().toISOString()}`,
        sourceVideoUrl: videoUrl,
        duration: metadata.duration,
        structure,
        transitions,
        audioTiming,
        visualStyle,
        textOverlays,
        pacing,
      };
    } catch (error) {
      console.error("Reel template generation error:", error);
      throw new Error(`Failed to generate reel template: ${error.message}`);
    }
  }

  /**
   * Get video metadata using FFprobe
   */
  private async getVideoMetadata(videoPath: string): Promise<{ duration: number }> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format "${videoPath}"`
      );
      const data = JSON.parse(stdout);
      return { duration: parseFloat(data.format.duration) };
    } catch (error) {
      console.error("FFprobe error:", error);
      return { duration: 60 }; // Default
    }
  }

  /**
   * Analyze reel structure using AI
   */
  private async analyzeStructure(transcript: string, duration: number): Promise<ReelStructure[]> {
    const prompt = `Analyze this reel transcript and break it into structural components.

Transcript: ${transcript || "No transcript available"}
Duration: ${duration} seconds

Identify the key scenes/segments with:
- scene: number (1, 2, 3...)
- start: timestamp in seconds
- end: timestamp in seconds
- type: "hook" | "buildup" | "climax" | "cta" | "other"
- description: brief description of what happens

Return JSON with structure array. Example:
{"structure": [{"scene": 1, "start": 0, "end": 3, "type": "hook", "description": "Attention-grabbing opener"}, ...]}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert video editor and reel analyst. You identify narrative structures in viral content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.structure || this.generateDefaultStructure(duration);
  }

  /**
   * Detect transitions in video (basic implementation)
   */
  private async detectTransitions(videoPath: string): Promise<Transition[]> {
    // Simplified transition detection - could be enhanced with actual scene detection
    try {
      const { duration } = await this.getVideoMetadata(videoPath);
      const transitions: Transition[] = [];
      
      // Assume transitions every 3-5 seconds for fast-paced content
      const interval = 4;
      for (let t = interval; t < duration; t += interval) {
        transitions.push({
          at: t,
          type: "cut",
          style: "hard",
        });
      }
      
      return transitions;
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract audio timing (beats, music cues)
   */
  private async extractAudioTiming(videoPath: string): Promise<{
    beats: number[];
    musicCues: Array<{ time: number; type: string }>;
  }> {
    // Simplified audio analysis - could integrate with BeatSync engine
    try {
      const { duration } = await this.getVideoMetadata(videoPath);
      const beats: number[] = [];
      
      // Assume 120 BPM for template
      const bpm = 120;
      const beatInterval = 60 / bpm;
      for (let t = 0; t < duration; t += beatInterval) {
        beats.push(t);
      }
      
      return {
        beats,
        musicCues: [
          { time: 0, type: "intro" },
          { time: duration * 0.5, type: "buildup" },
          { time: duration * 0.8, type: "climax" },
        ],
      };
    } catch (error) {
      return { beats: [], musicCues: [] };
    }
  }

  /**
   * Analyze visual style using AI
   */
  private async analyzeVisualStyle(transcript: string): Promise<{
    colorGrading?: string;
    effects?: string[];
    filters?: string[];
  }> {
    const prompt = `Based on this reel content, suggest visual style:

Content: ${transcript || "Viral short-form content"}

Suggest:
- colorGrading: Description of color treatment
- effects: Array of video effects used
- filters: Array of filters applied

Return JSON. Example:
{"colorGrading": "warm, high contrast", "effects": ["speed ramp", "zoom transitions"], "filters": ["slight vignette"]}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in video aesthetics and viral content styling.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      return {
        colorGrading: "natural",
        effects: [],
        filters: [],
      };
    }
  }

  /**
   * Extract text overlays from transcript
   */
  private async extractTextOverlays(transcript: string, duration: number): Promise<TextOverlay[]> {
    if (!transcript) return [];

    const prompt = `Identify key text overlays for this reel transcript:

${transcript}

Duration: ${duration}s

For impactful moments, suggest text overlays:
- start: timestamp
- end: timestamp
- text: The overlay text (short, punchy)
- position: "top" | "center" | "bottom"

Return JSON with overlays array.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in viral video text overlays and captions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.overlays || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Determine pacing based on structure
   */
  private determinePacing(structure: ReelStructure[], duration: number): "fast" | "medium" | "slow" {
    const scenesPerSecond = structure.length / duration;
    
    if (scenesPerSecond > 0.3) return "fast"; // More than 1 scene every 3 seconds
    if (scenesPerSecond > 0.15) return "medium"; // 1 scene every 3-7 seconds
    return "slow"; // Less frequent cuts
  }

  /**
   * Generate default structure if analysis fails
   */
  private generateDefaultStructure(duration: number): ReelStructure[] {
    return [
      { scene: 1, start: 0, end: 3, type: "hook", description: "Opening hook" },
      { scene: 2, start: 3, end: duration * 0.7, type: "buildup", description: "Main content" },
      { scene: 3, start: duration * 0.7, end: duration, type: "cta", description: "Call to action" },
    ];
  }

  /**
   * Apply template to new content
   */
  async applyTemplate(
    template: ReelTemplate,
    newContent: {
      script: string;
      assetUrls: string[];
    }
  ): Promise<{
    editingInstructions: Array<{
      timestamp: number;
      action: string;
      parameters: any;
    }>;
  }> {
    const prompt = `Apply this reel template to new content:

Template structure: ${JSON.stringify(template.structure, null, 2)}
New script: ${newContent.script}
Available assets: ${newContent.assetUrls.length} files

Generate editing instructions that adapt the template to this new content.
Return JSON with editingInstructions array.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert video editor who adapts templates to new content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }
}

export function createReelTemplateGenerator(openaiKey?: string): ReelTemplateGenerator {
  return new ReelTemplateGenerator(openaiKey);
}

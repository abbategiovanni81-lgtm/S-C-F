import { exec } from "child_process";
import { promisify } from "util";
import OpenAI from "openai";

const execAsync = promisify(exec);

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface EditOperation {
  type: "cut" | "speed" | "silence" | "merge";
  startTime: number;
  endTime: number;
  parameters?: any;
}

/**
 * Text-Based Video Editing Service
 * Allows video editing through transcript manipulation
 */
export class TextBasedVideoEditor {
  private openai: OpenAI;

  constructor(openaiKey?: string) {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  /**
   * Edit video based on transcript text selection
   * @param videoPath Path to input video
   * @param transcript Full video transcript with timestamps
   * @param selectedText Text segments to keep
   * @param outputPath Path for output video
   */
  async editByTranscript(
    videoPath: string,
    transcript: TranscriptSegment[],
    selectedText: string[],
    outputPath: string
  ): Promise<void> {
    try {
      // Find segments matching selected text
      const keepSegments = this.matchTextToSegments(transcript, selectedText);
      
      // Generate edit operations
      const editOps = this.generateEditOperations(keepSegments);
      
      // Apply edits using FFmpeg
      await this.applyEdits(videoPath, editOps, outputPath);
    } catch (error) {
      console.error("Text-based editing error:", error);
      throw new Error(`Failed to edit video by transcript: ${error.message}`);
    }
  }

  /**
   * Remove silences and filler words from video
   */
  async removeFillerAndSilence(
    videoPath: string,
    transcript: TranscriptSegment[],
    outputPath: string
  ): Promise<void> {
    try {
      // Identify filler words and silences
      const fillerWords = ["um", "uh", "like", "you know", "basically", "actually"];
      const segmentsToRemove: Array<{ start: number; end: number }> = [];

      // Find filler words in transcript
      transcript.forEach(segment => {
        const text = segment.text.toLowerCase();
        fillerWords.forEach(filler => {
          if (text.includes(filler)) {
            // Mark for removal (simplified - would need word-level timestamps)
            segmentsToRemove.push({
              start: segment.start,
              end: segment.end,
            });
          }
        });
      });

      // Detect silences using FFmpeg
      const silences = await this.detectSilences(videoPath);
      segmentsToRemove.push(...silences);

      // Keep all segments except those to remove
      const keepSegments = this.invertSegments(transcript, segmentsToRemove);
      const editOps = this.generateEditOperations(keepSegments);

      await this.applyEdits(videoPath, editOps, outputPath);
    } catch (error) {
      console.error("Filler removal error:", error);
      throw new Error(`Failed to remove filler: ${error.message}`);
    }
  }

  /**
   * Create highlight reel from transcript keywords
   */
  async createHighlightReel(
    videoPath: string,
    transcript: TranscriptSegment[],
    keywords: string[],
    outputPath: string,
    contextSeconds: number = 2
  ): Promise<void> {
    try {
      // Find segments containing keywords
      const highlights: Array<{ start: number; end: number }> = [];

      transcript.forEach(segment => {
        const text = segment.text.toLowerCase();
        const hasKeyword = keywords.some(kw => text.includes(kw.toLowerCase()));
        
        if (hasKeyword) {
          // Add context before and after
          highlights.push({
            start: Math.max(0, segment.start - contextSeconds),
            end: segment.end + contextSeconds,
          });
        }
      });

      // Merge overlapping segments
      const mergedHighlights = this.mergeOverlappingSegments(highlights);
      const editOps = this.generateEditOperations(mergedHighlights);

      await this.applyEdits(videoPath, editOps, outputPath);
    } catch (error) {
      console.error("Highlight reel error:", error);
      throw new Error(`Failed to create highlight reel: ${error.message}`);
    }
  }

  /**
   * AI-powered content trimming
   */
  async aiTrimVideo(
    videoPath: string,
    transcript: TranscriptSegment[],
    targetDuration: number,
    outputPath: string
  ): Promise<void> {
    try {
      // Use AI to identify most important segments
      const fullTranscript = transcript.map(s => s.text).join(" ");
      
      const prompt = `Given this video transcript, identify the ${targetDuration} seconds of most valuable content:

${fullTranscript}

Return timestamps in format: [{"start": 0, "end": 10}, {"start": 30, "end": 50}]
Total duration should be approximately ${targetDuration} seconds.
Keep the most engaging, informative, and impactful parts.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert video editor. Identify the most valuable content segments.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const segments = result.segments || [];

      const editOps = this.generateEditOperations(segments);
      await this.applyEdits(videoPath, editOps, outputPath);
    } catch (error) {
      console.error("AI trim error:", error);
      throw new Error(`Failed to AI trim video: ${error.message}`);
    }
  }

  /**
   * Match selected text to transcript segments
   */
  private matchTextToSegments(
    transcript: TranscriptSegment[],
    selectedText: string[]
  ): Array<{ start: number; end: number }> {
    const segments: Array<{ start: number; end: number }> = [];

    selectedText.forEach(text => {
      transcript.forEach(segment => {
        if (segment.text.includes(text)) {
          segments.push({
            start: segment.start,
            end: segment.end,
          });
        }
      });
    });

    return this.mergeOverlappingSegments(segments);
  }

  /**
   * Merge overlapping time segments
   */
  private mergeOverlappingSegments(
    segments: Array<{ start: number; end: number }>
  ): Array<{ start: number; end: number }> {
    if (segments.length === 0) return [];

    // Sort by start time
    segments.sort((a, b) => a.start - b.start);

    const merged: Array<{ start: number; end: number }> = [segments[0]];

    for (let i = 1; i < segments.length; i++) {
      const current = segments[i];
      const last = merged[merged.length - 1];

      if (current.start <= last.end) {
        // Overlapping or adjacent - merge
        last.end = Math.max(last.end, current.end);
      } else {
        // No overlap - add as new segment
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * Generate edit operations from keep segments
   */
  private generateEditOperations(segments: Array<{ start: number; end: number }>): EditOperation[] {
    return segments.map(seg => ({
      type: "cut" as const,
      startTime: seg.start,
      endTime: seg.end,
    }));
  }

  /**
   * Invert segments (keep everything except specified segments)
   */
  private invertSegments(
    transcript: TranscriptSegment[],
    removeSegments: Array<{ start: number; end: number }>
  ): Array<{ start: number; end: number }> {
    const duration = transcript[transcript.length - 1]?.end || 0;
    const keep: Array<{ start: number; end: number }> = [];

    // Sort remove segments
    removeSegments.sort((a, b) => a.start - b.start);

    let currentTime = 0;
    removeSegments.forEach(remove => {
      if (currentTime < remove.start) {
        keep.push({ start: currentTime, end: remove.start });
      }
      currentTime = Math.max(currentTime, remove.end);
    });

    // Add final segment
    if (currentTime < duration) {
      keep.push({ start: currentTime, end: duration });
    }

    return keep;
  }

  /**
   * Detect silences in video using FFmpeg
   */
  private async detectSilences(videoPath: string): Promise<Array<{ start: number; end: number }>> {
    try {
      const { stdout } = await execAsync(
        `ffmpeg -i "${videoPath}" -af silencedetect=noise=-30dB:d=0.5 -f null - 2>&1`
      );

      const silences: Array<{ start: number; end: number }> = [];
      const lines = stdout.split("\n");

      let silenceStart: number | null = null;
      lines.forEach(line => {
        if (line.includes("silence_start")) {
          const match = line.match(/silence_start: ([\d.]+)/);
          if (match) silenceStart = parseFloat(match[1]);
        } else if (line.includes("silence_end") && silenceStart !== null) {
          const match = line.match(/silence_end: ([\d.]+)/);
          if (match) {
            silences.push({
              start: silenceStart,
              end: parseFloat(match[1]),
            });
            silenceStart = null;
          }
        }
      });

      return silences;
    } catch (error) {
      console.error("Silence detection error:", error);
      return [];
    }
  }

  /**
   * Apply edits to video using FFmpeg
   */
  private async applyEdits(
    videoPath: string,
    editOps: EditOperation[],
    outputPath: string
  ): Promise<void> {
    if (editOps.length === 0) {
      throw new Error("No edit operations to apply");
    }

    // Build FFmpeg filter complex for cuts
    const segments = editOps
      .filter(op => op.type === "cut")
      .map(op => `between(t,${op.startTime},${op.endTime})`)
      .join("+");

    const filterComplex = `select='${segments}',setpts=N/FRAME_RATE/TB`;

    await execAsync(
      `ffmpeg -i "${videoPath}" -vf "${filterComplex}" -af "aselect='${segments}',asetpts=N/SR/TB" "${outputPath}"`
    );
  }
}

export function createTextBasedVideoEditor(openaiKey?: string): TextBasedVideoEditor {
  return new TextBasedVideoEditor(openaiKey);
}

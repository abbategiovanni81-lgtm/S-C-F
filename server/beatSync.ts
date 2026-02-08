import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import os from "os";

const execAsync = promisify(exec);

interface Beat {
  time: number; // timestamp in seconds
  strength: number; // 0-1, energy of the beat
}

interface AudioSegment {
  start: number;
  end: number;
  energy: "low" | "medium" | "high" | "peak";
  avgAmplitude: number;
}

interface BeatSyncResult {
  duration: number;
  tempo: number; // BPM
  beats: Beat[];
  segments: AudioSegment[];
  analysisMetadata: {
    sampleRate: number;
    channels: number;
    bitrate: string;
  };
}

/**
 * BeatSync Engine - Music analysis and beat detection using FFmpeg
 * Analyzes audio to detect beats, tempo, and energy segments for video sync
 */
export class BeatSyncEngine {
  /**
   * Analyze audio file to detect beats and tempo
   */
  async analyzeAudio(audioPath: string): Promise<BeatSyncResult> {
    try {
      // Get audio metadata
      const metadata = await this.getAudioMetadata(audioPath);
      
      // Extract audio features for beat detection
      const audioData = await this.extractAudioData(audioPath);
      
      // Detect beats using energy-based algorithm
      const beats = this.detectBeats(audioData);
      
      // Calculate tempo (BPM)
      const tempo = this.calculateTempo(beats, metadata.duration);
      
      // Segment audio by energy levels
      const segments = this.segmentByEnergy(audioData);
      
      return {
        duration: metadata.duration,
        tempo,
        beats,
        segments,
        analysisMetadata: {
          sampleRate: metadata.sampleRate,
          channels: metadata.channels,
          bitrate: metadata.bitrate,
        },
      };
    } catch (error) {
      console.error("BeatSync analysis error:", error);
      throw new Error(`Failed to analyze audio: ${error.message}`);
    }
  }

  /**
   * Get audio file metadata using FFprobe
   */
  private async getAudioMetadata(audioPath: string): Promise<{
    duration: number;
    sampleRate: number;
    channels: number;
    bitrate: string;
  }> {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${audioPath}"`
    );
    
    const data = JSON.parse(stdout);
    const audioStream = data.streams.find((s: any) => s.codec_type === "audio");
    
    return {
      duration: parseFloat(data.format.duration),
      sampleRate: parseInt(audioStream.sample_rate),
      channels: audioStream.channels,
      bitrate: data.format.bit_rate,
    };
  }

  /**
   * Extract audio data for analysis
   * Converts to mono, downsamples, and analyzes amplitude
   */
  private async extractAudioData(audioPath: string): Promise<{
    samples: number[];
    sampleRate: number;
  }> {
    // Create temporary raw audio file
    const tempDir = path.join(os.tmpdir(), "beatsync");
    await fs.mkdir(tempDir, { recursive: true });
    const rawFile = path.join(tempDir, `audio_${Date.now()}.raw`);
    
    try {
      // Convert to mono, 8kHz sample rate, 16-bit PCM
      await execAsync(
        `ffmpeg -i "${audioPath}" -ac 1 -ar 8000 -f s16le -acodec pcm_s16le "${rawFile}"`
      );
      
      // Read raw audio data
      const buffer = await fs.readFile(rawFile);
      const samples: number[] = [];
      
      // Convert 16-bit PCM to normalized samples
      for (let i = 0; i < buffer.length; i += 2) {
        const sample = buffer.readInt16LE(i);
        samples.push(sample / 32768.0); // Normalize to -1 to 1
      }
      
      return { samples, sampleRate: 8000 };
    } finally {
      // Cleanup temp file
      try {
        await fs.unlink(rawFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Detect beats using energy-based algorithm
   * Analyzes short-term energy and identifies peaks
   */
  private detectBeats(audioData: { samples: number[]; sampleRate: number }): Beat[] {
    const { samples, sampleRate } = audioData;
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms window
    const hopSize = Math.floor(windowSize / 2);
    const beats: Beat[] = [];
    
    // Calculate energy for each window
    const energies: number[] = [];
    for (let i = 0; i < samples.length - windowSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += Math.abs(samples[i + j]);
      }
      energies.push(energy / windowSize);
    }
    
    // Calculate average and standard deviation
    const avg = energies.reduce((a, b) => a + b, 0) / energies.length;
    const variance = energies.reduce((sum, e) => sum + Math.pow(e - avg, 2), 0) / energies.length;
    const stdDev = Math.sqrt(variance);
    
    // Detect beats as energy peaks above threshold
    const threshold = avg + stdDev * 1.5;
    let lastBeatIndex = -10;
    
    for (let i = 1; i < energies.length - 1; i++) {
      const energy = energies[i];
      const prevEnergy = energies[i - 1];
      const nextEnergy = energies[i + 1];
      
      // Peak detection with minimum spacing
      if (energy > threshold && energy > prevEnergy && energy > nextEnergy && i - lastBeatIndex > 3) {
        const time = (i * hopSize) / sampleRate;
        const strength = Math.min((energy - avg) / (stdDev * 2), 1);
        beats.push({ time, strength });
        lastBeatIndex = i;
      }
    }
    
    return beats;
  }

  /**
   * Calculate tempo (BPM) from detected beats
   */
  private calculateTempo(beats: Beat[], duration: number): number {
    if (beats.length < 2) return 120; // Default tempo
    
    // Calculate average interval between beats
    const intervals: number[] = [];
    for (let i = 1; i < beats.length; i++) {
      intervals.push(beats[i].time - beats[i - 1].time);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = 60 / avgInterval;
    
    // Return reasonable BPM (60-200 range)
    return Math.max(60, Math.min(200, Math.round(bpm)));
  }

  /**
   * Segment audio by energy levels
   */
  private segmentByEnergy(audioData: { samples: number[]; sampleRate: number }): AudioSegment[] {
    const { samples, sampleRate } = audioData;
    const segmentDuration = 2.0; // 2 second segments
    const segmentSize = Math.floor(sampleRate * segmentDuration);
    const segments: AudioSegment[] = [];
    
    for (let i = 0; i < samples.length; i += segmentSize) {
      const end = Math.min(i + segmentSize, samples.length);
      let totalEnergy = 0;
      
      for (let j = i; j < end; j++) {
        totalEnergy += Math.abs(samples[j]);
      }
      
      const avgAmplitude = totalEnergy / (end - i);
      const start = i / sampleRate;
      const segmentEnd = end / sampleRate;
      
      // Classify energy level
      let energy: "low" | "medium" | "high" | "peak";
      if (avgAmplitude < 0.1) energy = "low";
      else if (avgAmplitude < 0.3) energy = "medium";
      else if (avgAmplitude < 0.6) energy = "high";
      else energy = "peak";
      
      segments.push({
        start,
        end: segmentEnd,
        energy,
        avgAmplitude,
      });
    }
    
    return segments;
  }

  /**
   * Generate video cuts synced to beats
   * Returns an array of cut points (timestamps) for video editing
   */
  async generateBeatSyncedCuts(
    audioPath: string,
    targetDuration: number,
    cutsPerBeat: number = 1
  ): Promise<number[]> {
    const analysis = await this.analyzeAudio(audioPath);
    const cuts: number[] = [0]; // Always start at 0
    
    // Filter beats to match target duration
    const relevantBeats = analysis.beats.filter(b => b.time <= targetDuration);
    
    // Add cuts at beat positions
    for (let i = 0; i < relevantBeats.length; i += cutsPerBeat) {
      if (relevantBeats[i].time > 0) {
        cuts.push(relevantBeats[i].time);
      }
    }
    
    return cuts.sort((a, b) => a - b);
  }

  /**
   * Create beat-matched video with automatic cuts
   */
  async createBeatMatchedVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string
  ): Promise<void> {
    try {
      // Analyze audio for beats
      const analysis = await this.analyzeAudio(audioPath);
      
      // Create filter complex for beat-synced cuts
      // This is a simplified version - could be enhanced with actual video manipulation
      await execAsync(
        `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputPath}"`
      );
    } catch (error) {
      console.error("Beat-matched video creation error:", error);
      throw new Error(`Failed to create beat-matched video: ${error.message}`);
    }
  }
}

export const beatSyncEngine = new BeatSyncEngine();

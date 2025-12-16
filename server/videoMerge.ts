import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const execAsync = promisify(exec);

const TEMP_DIR = "/tmp/video-merge";

async function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(outputPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, outputPath).then(resolve).catch(reject);
          return;
        }
      }
      
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export async function mergeVideosWithAudio(
  clipUrls: string[],
  voiceoverUrl: string | null
): Promise<{ mergedVideoPath: string; mergedVideoUrl: string }> {
  await ensureTempDir();
  
  const jobId = generateId();
  const jobDir = path.join(TEMP_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });
  
  try {
    console.log(`[VideoMerge] Starting merge job ${jobId} with ${clipUrls.length} clips`);
    
    const clipPaths: string[] = [];
    for (let i = 0; i < clipUrls.length; i++) {
      const clipPath = path.join(jobDir, `clip_${i}.mp4`);
      console.log(`[VideoMerge] Downloading clip ${i + 1}...`);
      await downloadFile(clipUrls[i], clipPath);
      clipPaths.push(clipPath);
    }
    
    let audioPath: string | null = null;
    if (voiceoverUrl) {
      audioPath = path.join(jobDir, "voiceover.mp3");
      console.log("[VideoMerge] Downloading voiceover...");
      await downloadFile(voiceoverUrl, audioPath);
    }
    
    const concatListPath = path.join(jobDir, "concat.txt");
    const concatContent = clipPaths.map(p => `file '${p}'`).join("\n");
    fs.writeFileSync(concatListPath, concatContent);
    
    const mergedVideoPath = path.join(jobDir, "merged.mp4");
    const finalOutputPath = path.join(jobDir, "final.mp4");
    
    console.log("[VideoMerge] Concatenating clips...");
    await execAsync(`ffmpeg -f concat -safe 0 -i "${concatListPath}" -c copy "${mergedVideoPath}"`, {
      timeout: 120000,
    });
    
    if (audioPath) {
      console.log("[VideoMerge] Adding voiceover audio...");
      await execAsync(
        `ffmpeg -i "${mergedVideoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${finalOutputPath}"`,
        { timeout: 120000 }
      );
    } else {
      fs.copyFileSync(mergedVideoPath, finalOutputPath);
    }
    
    const publicDir = path.join(process.cwd(), "public", "merged-videos");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const outputFileName = `merged_${jobId}.mp4`;
    const publicPath = path.join(publicDir, outputFileName);
    fs.copyFileSync(finalOutputPath, publicPath);
    
    for (const clipPath of clipPaths) {
      fs.unlinkSync(clipPath);
    }
    if (audioPath) fs.unlinkSync(audioPath);
    fs.unlinkSync(concatListPath);
    fs.unlinkSync(mergedVideoPath);
    if (fs.existsSync(finalOutputPath)) fs.unlinkSync(finalOutputPath);
    fs.rmdirSync(jobDir);
    
    console.log(`[VideoMerge] Merge complete: ${outputFileName}`);
    
    return {
      mergedVideoPath: publicPath,
      mergedVideoUrl: `/merged-videos/${outputFileName}`,
    };
  } catch (error) {
    console.error("[VideoMerge] Error:", error);
    try {
      fs.rmSync(jobDir, { recursive: true, force: true });
    } catch {}
    throw error;
  }
}

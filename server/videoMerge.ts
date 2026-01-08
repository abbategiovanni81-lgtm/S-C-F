import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { objectStorageClient } from "./objectStorage";

const execAsync = promisify(exec);

const TEMP_DIR = "/tmp/video-merge";
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

async function uploadToCloudStorage(localPath: string, fileName: string): Promise<string> {
  const privateDir = process.env.PRIVATE_OBJECT_DIR;
  if (!privateDir) {
    console.log("[VideoMerge] No PRIVATE_OBJECT_DIR set, using local storage");
    return "";
  }

  try {
    const objectPath = `${privateDir}/merged-videos/${fileName}`;
    const parts = objectPath.startsWith("/") ? objectPath.slice(1).split("/") : objectPath.split("/");
    const bucketName = parts[0];
    const objectName = parts.slice(1).join("/");
    
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    await file.save(fs.readFileSync(localPath), {
      contentType: "video/mp4",
      metadata: {
        "x-object-acl": JSON.stringify({ visibility: "public" }),
      },
    });
    
    console.log(`[VideoMerge] Uploaded to cloud storage: ${objectPath}`);
    return `/objects/merged-videos/${fileName}`;
  } catch (error) {
    console.error("[VideoMerge] Cloud upload failed:", error);
    return "";
  }
}

async function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  // Handle object storage paths (e.g., /objects/uploads/xxx.mp4)
  if (url.startsWith("/objects/")) {
    const privateDir = process.env.PRIVATE_OBJECT_DIR;
    if (privateDir) {
      try {
        const gcsPath = url.replace("/objects/", "");
        const objectPath = `${privateDir}/${gcsPath}`;
        const parts = objectPath.startsWith("/") ? objectPath.slice(1).split("/") : objectPath.split("/");
        const bucketName = parts[0];
        const objectName = parts.slice(1).join("/");
        
        const bucket = objectStorageClient.bucket(bucketName);
        const [buffer] = await bucket.file(objectName).download();
        fs.writeFileSync(outputPath, buffer);
        console.log(`[VideoMerge] Downloaded from object storage: ${url}`);
        return;
      } catch (storageError: any) {
        console.log(`[VideoMerge] Object storage download failed, trying HTTP: ${storageError.message}`);
        // Fall through to HTTP download
      }
    }
    
    // Fallback: Try HTTP download via localhost
    const port = process.env.PORT || 5000;
    const httpUrl = `http://localhost:${port}${url}`;
    return downloadFromHttp(httpUrl, outputPath);
  }
  
  // Handle local paths (e.g., /generated-media/video-xxx.mp4)
  if (url.startsWith("/")) {
    const localPath = path.join(process.cwd(), "public", url);
    if (fs.existsSync(localPath)) {
      fs.copyFileSync(localPath, outputPath);
      return;
    }
    
    // Try HTTP fallback for local paths that might be served dynamically
    const port = process.env.PORT || 5000;
    const httpUrl = `http://localhost:${port}${url}`;
    return downloadFromHttp(httpUrl, outputPath);
  }
  
  return downloadFromHttp(url, outputPath);
}

async function downloadFromHttp(url: string, outputPath: string): Promise<void> {
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
    
    console.log("[VideoMerge] Concatenating clips with re-encoding...");
    // Re-encode to ensure all clips are compatible (different sources may have different codecs)
    await execAsync(`ffmpeg -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${mergedVideoPath}"`, {
      timeout: 300000,
    });
    
    if (audioPath) {
      console.log("[VideoMerge] Adding voiceover audio...");
      // Replace video audio with voiceover
      await execAsync(
        `ffmpeg -i "${mergedVideoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${finalOutputPath}"`,
        { timeout: 120000 }
      );
    } else {
      fs.copyFileSync(mergedVideoPath, finalOutputPath);
    }
    
    const outputFileName = `merged_${jobId}.mp4`;
    
    // Try to upload to cloud storage for persistence
    let cloudUrl = await uploadToCloudStorage(finalOutputPath, outputFileName);
    
    // Also save locally as fallback
    const publicDir = path.join(process.cwd(), "public", "merged-videos");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
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
    
    // Use cloud URL if available, otherwise local
    const finalUrl = cloudUrl || `/merged-videos/${outputFileName}`;
    console.log(`[VideoMerge] Merge complete: ${finalUrl}`);
    
    return {
      mergedVideoPath: publicPath,
      mergedVideoUrl: finalUrl,
    };
  } catch (error) {
    console.error("[VideoMerge] Error:", error);
    try {
      fs.rmSync(jobDir, { recursive: true, force: true });
    } catch {}
    throw error;
  }
}

export class SkyReelsService {
    constructor() {
        if (!process.env.FAL_API_KEY) {
            throw new Error('FAL_API_KEY is not configured.');
        }
    }

    isConfigured(): boolean {
        return !!process.env.FAL_API_KEY;
    }

    generateVideo(input: { prompt: string, negativePrompt?: string, duration: 5 | 10, aspectRatio: "16:9" | "9:16" | "1:1", style?: string }): { videoUrl: string, duration: number, status: "completed" | "failed", generationTime: number } {
        // TODO: Implement actual HTTP call to https://queue.fal.run/fal-ai/skyreels-v2
        if (!process.env.FAL_API_KEY) {
            return { videoUrl: 'https://mock.video.url', duration: input.duration, status: 'completed', generationTime: Date.now() };
        }

        // TODO: Replace with actual implementation
        return { videoUrl: 'https://mock.video.url', duration: input.duration, status: 'completed', generationTime: Date.now() };
    }

    getStatus(jobId: string): { status: "queued" | "processing" | "completed" | "failed", progress: number, resultUrl?: string } {
        // TODO: Implement actual HTTP call to get status
        if (!process.env.FAL_API_KEY) {
            return { status: 'queued', progress: 0 };
        }

        // TODO: Replace with actual implementation
        return { status: 'queued', progress: 0 };
    }
}

export const skyReelsService = new SkyReelsService();

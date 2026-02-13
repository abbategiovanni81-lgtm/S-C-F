import { openai } from "./openai";

export class ContentCalendarService {
    async generateWeeklyPlan(input: {
        brandVoice: string;
        targetAudience: string;
        contentGoals: string;
        platforms: string[];
        postingFrequency: string;
        existingTopics?: string[];
    }): Promise<{ 
        weekStarting: string;
        days: Array<{ 
            day: string;
            posts: Array<{ 
                platform: string;
                contentFormat: "video" | "image" | "carousel" | "text";
                topic: string;
                hook: string;
                bestTimeToPost: string;
                notes: string;
            }>; 
        }>; 
    }> {
        try {
            const prompt = `Generate a weekly content calendar for a social media marketing strategy. Convert the following details into a detailed JSON: \nBrand Voice: ${input.brandVoice}\nTarget Audience: ${input.targetAudience}\nContent Goals: ${input.contentGoals}\nPlatforms: ${input.platforms.join(", ")}\nPosting Frequency: ${input.postingFrequency}\nExisting Topics: ${input.existingTopics?.join(", ") || "none"}`;

            const response = await openai.complete({
                model: "gpt-4o",
                prompt,
                max_tokens: 1000,
                temperature: 0.7,
                response_format: { type: "json_object" },
            });

            return response;
        } catch (error) {
            console.error("Error generating weekly content calendar:", error);
            return {
                weekStarting: new Date().toISOString(),
                days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => ({
                    day,
                    posts: [],
                })),
            };
        }
    }

    suggestBestTimes(platform: string): string {
        const postingTimes: { [platform: string]: string } = {
            tiktok: "6 PM - 9 PM",
            instagram: "12 PM - 3 PM",
            facebook: "1 PM - 4 PM",
            twitter: "9 AM - 11 AM",
            linkedin: "7 AM - 10 AM",
        };
        return postingTimes[platform.toLowerCase()] || "No data available";
    }
}

export const contentCalendarService = new ContentCalendarService();
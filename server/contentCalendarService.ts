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
            const systemPrompt = `You are a social media strategist creating a weekly content calendar. Generate a structured weekly plan with posts distributed across different days and platforms based on the posting frequency.

Return a JSON object with this exact structure:
{
  "weekStarting": "YYYY-MM-DD",
  "days": [
    {
      "day": "Monday",
      "posts": [
        {
          "platform": "instagram",
          "contentFormat": "video" | "image" | "carousel" | "text",
          "topic": "Main topic/theme of the post",
          "hook": "Attention-grabbing opening line",
          "bestTimeToPost": "12:00 PM - 3:00 PM",
          "notes": "Additional context or instructions"
        }
      ]
    }
  ]
}

Consider the brand voice, target audience, and content goals when creating topics and hooks. Distribute posts evenly across the week based on the posting frequency. Use viral hooks and engaging topics.`;

            const userPrompt = `Generate a weekly content calendar with the following details:

Brand Voice: ${input.brandVoice}
Target Audience: ${input.targetAudience}
Content Goals: ${input.contentGoals}
Platforms: ${input.platforms.join(", ")}
Posting Frequency: ${input.postingFrequency}
${input.existingTopics?.length ? `Existing Topics to Avoid: ${input.existingTopics.join(", ")}` : ""}

Create a diverse mix of content formats and topics that align with the brand voice and will resonate with the target audience. Schedule posts at optimal times for each platform.`;

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                response_format: { type: "json_object" },
                max_completion_tokens: 2000,
                temperature: 0.7,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error("No response from OpenAI");
            }

            const parsedPlan = JSON.parse(content);
            return parsedPlan;
        } catch (error) {
            console.error("Error generating weekly content calendar:", error);
            return {
                weekStarting: new Date().toISOString().split('T')[0],
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
import { openai } from "./openai";
import { randomUUID } from "crypto";

export class CharacterConsistencyService {
    async generateCharacterProfile(input: { name: string; description: string; visualTraits: string }): Promise<{ id: string; name: string; promptPrefix: string; negativePrompt: string; consistencyTags: string[] }> {
        try {
            const prompt = `Create a consistent character profile with the following details:\nName: ${input.name}\nDescription: ${input.description}\nVisual Traits: ${input.visualTraits}\nOutput JSON: {\"id\": string (UUID), \"name\": string, \"promptPrefix\": string, \"negativePrompt\": string, \"consistencyTags\": string[]}`;

            const response = await openai.complete({
                model: "gpt-4o",
                prompt: prompt,
                max_tokens: 500,
                temperature: 0.7,
                response_format: { type: "json_object" }
            });

            return {
                id: randomUUID(),
                name: response.name || input.name,
                promptPrefix: response.promptPrefix || input.description,
                negativePrompt: response.negativePrompt || "",
                consistencyTags: response.consistencyTags || []
            };
        } catch (error) {
            console.error("Error generating character profile:", error);
            return {
                id: randomUUID(),
                name: input.name,
                promptPrefix: `Ensure visual consistency for ${input.name}`,
                negativePrompt: "",
                consistencyTags: ["placeholder"]
            };
        }
    }

    buildConsistentPrompt(characterProfile: any, scenePrompt: string): string {
        return `${characterProfile.promptPrefix} ${scenePrompt}`;
    }
}

export const characterConsistencyService = new CharacterConsistencyService();
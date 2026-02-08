import OpenAI from "openai";

interface UGCAdScene {
  sceneNumber: number;
  sceneType: "hook" | "problem" | "solution" | "cta";
  duration: number;
  script: string;
  visualPrompt: string;
  avatarMode: "talking_head" | "voiceover" | "text_only";
}

interface UGCAdProject {
  name: string;
  productName: string;
  productUrl?: string;
  targetAudience: string;
  adGoal: "awareness" | "conversion" | "engagement";
  scenes: UGCAdScene[];
}

/**
 * UGC Ad Creator
 * Multi-scene video ad builder with talking avatar support
 */
export class UGCAdCreator {
  private openai: OpenAI;

  constructor(openaiKey?: string) {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  /**
   * Generate UGC ad structure from product info
   */
  async generateAdStructure(
    productName: string,
    productDescription: string,
    targetAudience: string,
    adGoal: "awareness" | "conversion" | "engagement",
    duration: number = 30
  ): Promise<UGCAdProject> {
    try {
      const prompt = `Create a ${duration}-second UGC video ad structure for:

Product: ${productName}
Description: ${productDescription}
Target Audience: ${targetAudience}
Goal: ${adGoal}

Generate a multi-scene ad with:
1. Hook (3-5s): Attention-grabbing opener
2. Problem (5-8s): Pain point identification
3. Solution (10-15s): How product solves it
4. CTA (3-5s): Clear call to action

For each scene provide:
- sceneNumber: 1, 2, 3, 4
- sceneType: "hook" | "problem" | "solution" | "cta"
- duration: seconds
- script: Spoken text (natural, conversational UGC style)
- visualPrompt: What to show visually
- avatarMode: "talking_head" | "voiceover" | "text_only"

Return JSON with scenes array.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert UGC video ad creator. You write authentic, conversion-focused ad scripts.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        name: `UGC Ad - ${productName}`,
        productName,
        targetAudience,
        adGoal,
        scenes: result.scenes || [],
      };
    } catch (error) {
      console.error("UGC ad generation error:", error);
      throw new Error(`Failed to generate UGC ad: ${error.message}`);
    }
  }

  /**
   * Generate multiple ad variations for A/B testing
   */
  async generateAdVariations(
    productName: string,
    productDescription: string,
    targetAudience: string,
    variationCount: number = 3
  ): Promise<UGCAdProject[]> {
    try {
      const prompt = `Create ${variationCount} different UGC video ad variations for:

Product: ${productName}
Description: ${productDescription}
Target Audience: ${targetAudience}

Each variation should have a different:
- Hook style (question, statement, story)
- Tone (excited, calm, urgent)
- Approach (testimonial, demonstration, lifestyle)

Keep duration ~30 seconds each.

Return JSON with variations array, each containing scenes array.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert UGC video ad creator specializing in A/B testing variations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return (result.variations || []).map((variation: any, index: number) => ({
        name: `UGC Ad ${index + 1} - ${productName}`,
        productName,
        targetAudience,
        adGoal: "conversion" as const,
        scenes: variation.scenes || [],
      }));
    } catch (error) {
      console.error("Ad variations generation error:", error);
      throw new Error(`Failed to generate ad variations: ${error.message}`);
    }
  }

  /**
   * Optimize ad script for platform
   */
  async optimizeForPlatform(
    adProject: UGCAdProject,
    platform: "tiktok" | "instagram" | "youtube" | "facebook"
  ): Promise<UGCAdProject> {
    try {
      const platformSpecs = {
        tiktok: { maxDuration: 60, style: "fast-paced, trendy, authentic" },
        instagram: { maxDuration: 60, style: "aesthetic, lifestyle-focused" },
        youtube: { maxDuration: 90, style: "detailed, informative" },
        facebook: { maxDuration: 60, style: "relatable, story-driven" },
      };

      const spec = platformSpecs[platform];

      const prompt = `Optimize this UGC ad for ${platform}:

Current scenes: ${JSON.stringify(adProject.scenes, null, 2)}

Platform requirements:
- Max duration: ${spec.maxDuration}s
- Style: ${spec.style}

Adjust:
- Script tone and pacing
- Visual prompts
- Scene durations
- Hook effectiveness

Return JSON with optimized scenes array.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a ${platform} ad expert. You optimize UGC ads for platform-specific success.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        ...adProject,
        scenes: result.scenes || adProject.scenes,
      };
    } catch (error) {
      console.error("Platform optimization error:", error);
      throw new Error(`Failed to optimize for ${platform}: ${error.message}`);
    }
  }

  /**
   * Generate talking head script with avatar instructions
   */
  async generateTalkingHeadScript(
    scene: UGCAdScene,
    avatarPersona: {
      age: string;
      gender: string;
      style: string;
      energy: "low" | "medium" | "high";
    }
  ): Promise<{
    script: string;
    avatarInstructions: {
      emotion: string;
      gesture: string;
      expression: string;
    };
  }> {
    try {
      const prompt = `Create talking head script for this UGC ad scene:

Scene: ${scene.sceneType}
Current script: ${scene.script}
Duration: ${scene.duration}s

Avatar persona:
- Age: ${avatarPersona.age}
- Gender: ${avatarPersona.gender}
- Style: ${avatarPersona.style}
- Energy: ${avatarPersona.energy}

Provide:
- script: Natural, conversational script with pauses marked
- avatarInstructions: {emotion, gesture, expression}

Make it authentic and relatable like real UGC content.

Return JSON.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a UGC video director specializing in authentic talking head content.",
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
      console.error("Talking head script error:", error);
      throw new Error(`Failed to generate talking head script: ${error.message}`);
    }
  }

  /**
   * Generate B-roll suggestions for UGC ad
   */
  async generateBRollSuggestions(adProject: UGCAdProject): Promise<Array<{
    sceneNumber: number;
    brollType: string;
    description: string;
    timing: string;
  }>> {
    try {
      const prompt = `Suggest B-roll for this UGC ad:

Product: ${adProject.productName}
Scenes: ${JSON.stringify(adProject.scenes.map(s => ({ 
      number: s.sceneNumber, 
      type: s.sceneType, 
      script: s.script 
    })), null, 2)}

For each scene, suggest authentic UGC-style B-roll:
- sceneNumber
- brollType: "product_demo" | "lifestyle" | "hands" | "reaction" | "result"
- description: What to film
- timing: When to show in scene

Return JSON with suggestions array.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a UGC video producer. You know what B-roll makes authentic, engaging ads.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.suggestions || [];
    } catch (error) {
      console.error("B-roll suggestions error:", error);
      throw new Error(`Failed to generate B-roll suggestions: ${error.message}`);
    }
  }

  /**
   * Analyze ad effectiveness
   */
  async analyzeAdEffectiveness(adProject: UGCAdProject): Promise<{
    overallScore: number;
    hookScore: number;
    clarityScore: number;
    ctaScore: number;
    authenticity: number;
    recommendations: string[];
  }> {
    try {
      const prompt = `Analyze this UGC ad for effectiveness:

${JSON.stringify(adProject, null, 2)}

Score (0-100) on:
- overallScore: Overall ad quality
- hookScore: Hook effectiveness
- clarityScore: Message clarity
- ctaScore: CTA strength
- authenticity: UGC authenticity feel

Provide recommendations for improvement.

Return JSON.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a performance marketing expert analyzing UGC ads.",
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
      console.error("Ad analysis error:", error);
      throw new Error(`Failed to analyze ad: ${error.message}`);
    }
  }
}

export function createUGCAdCreator(openaiKey?: string): UGCAdCreator {
  return new UGCAdCreator(openaiKey);
}

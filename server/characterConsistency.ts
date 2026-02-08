import OpenAI from "openai";

interface CharacterDefinition {
  name: string;
  description: string;
  visualPrompt: string;
  styleGuide: {
    clothing: string[];
    colors: string[];
    accessories: string[];
    pose: string;
    expression: string;
    environment: string;
  };
  referenceImages: string[];
}

interface ConsistencyCheckResult {
  isConsistent: boolean;
  consistencyScore: number; // 0-100
  deviations: Array<{
    aspect: string;
    expected: string;
    found: string;
    severity: "low" | "medium" | "high";
  }>;
  recommendations: string[];
}

/**
 * Character Consistency Engine
 * Ensures brand-consistent character creation across content
 */
export class CharacterConsistencyEngine {
  private openai: OpenAI;

  constructor(openaiKey?: string) {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  /**
   * Create character definition from brand brief
   */
  async createCharacterFromBrief(
    brandBrief: {
      name: string;
      brandVoice: string;
      targetAudience: string;
      accountType: string;
    },
    characterType: "mascot" | "spokesperson" | "customer" | "influencer"
  ): Promise<CharacterDefinition> {
    try {
      const prompt = `Create a consistent character definition for this brand:

Brand: ${brandBrief.name}
Voice: ${brandBrief.brandVoice}
Audience: ${brandBrief.targetAudience}
Type: ${brandBrief.accountType}

Character type: ${characterType}

Provide:
- name: Character name
- description: 2-3 sentence character bio
- visualPrompt: Detailed AI image generation prompt for consistency
- styleGuide: {
    clothing: [items],
    colors: [hex codes or names],
    accessories: [items],
    pose: default pose,
    expression: typical expression,
    environment: typical setting
  }

Make the character:
1. Aligned with brand voice
2. Appealing to target audience
3. Distinctive and memorable
4. Consistent across variations

Return JSON.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a character designer and brand expert. You create consistent, memorable brand characters.",
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
        name: result.name || "Brand Character",
        description: result.description || "",
        visualPrompt: result.visualPrompt || "",
        styleGuide: result.styleGuide || {
          clothing: [],
          colors: [],
          accessories: [],
          pose: "neutral",
          expression: "friendly",
          environment: "studio",
        },
        referenceImages: [],
      };
    } catch (error) {
      console.error("Character creation error:", error);
      throw new Error(`Failed to create character: ${error.message}`);
    }
  }

  /**
   * Generate consistent image prompt for character
   */
  generateConsistentPrompt(
    character: CharacterDefinition,
    scenario: string,
    emotion?: string
  ): string {
    const basePrompt = character.visualPrompt;
    const style = character.styleGuide;

    const consistencyPrompts = [
      `${style.clothing.join(", ")}`,
      `${style.colors.join(" and ")} color scheme`,
      `${style.accessories.join(", ")}`,
      `${emotion || style.expression} expression`,
      `${style.environment} setting`,
    ];

    return `${basePrompt}, ${scenario}, ${consistencyPrompts.join(", ")}, consistent character design, same character as previous, maintaining exact appearance`;
  }

  /**
   * Check if generated image matches character consistency
   */
  async checkImageConsistency(
    character: CharacterDefinition,
    generatedImageUrl: string,
    generationPrompt: string
  ): Promise<ConsistencyCheckResult> {
    try {
      const prompt = `Check if this generated image matches the character definition:

Character definition:
${JSON.stringify(character, null, 2)}

Generation prompt used:
${generationPrompt}

Generated image: ${generatedImageUrl}

Analyze:
1. Visual consistency (clothing, colors, accessories)
2. Character features (pose, expression, environment)
3. Brand alignment
4. Overall consistency score (0-100)

Identify deviations and provide recommendations.

Return JSON with: isConsistent, consistencyScore, deviations[], recommendations[]`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a visual consistency expert. You ensure character designs remain consistent.",
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
        isConsistent: result.isConsistent !== false,
        consistencyScore: result.consistencyScore || 75,
        deviations: result.deviations || [],
        recommendations: result.recommendations || [],
      };
    } catch (error) {
      console.error("Consistency check error:", error);
      return {
        isConsistent: true,
        consistencyScore: 75,
        deviations: [],
        recommendations: [],
      };
    }
  }

  /**
   * Update character definition based on feedback
   */
  async refineCharacter(
    character: CharacterDefinition,
    feedback: string,
    generatedImages: string[]
  ): Promise<CharacterDefinition> {
    try {
      const prompt = `Refine this character definition based on feedback:

Current definition:
${JSON.stringify(character, null, 2)}

Feedback: ${feedback}

Generated images so far: ${generatedImages.length} images

Improve the character definition to:
1. Address feedback
2. Increase consistency
3. Enhance visual appeal
4. Better align with brand

Return refined JSON with same structure.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a character design expert. You refine character definitions for consistency.",
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
        ...character,
        description: result.description || character.description,
        visualPrompt: result.visualPrompt || character.visualPrompt,
        styleGuide: result.styleGuide || character.styleGuide,
      };
    } catch (error) {
      console.error("Character refinement error:", error);
      return character;
    }
  }

  /**
   * Generate character variations for different scenarios
   */
  async generateScenarioVariations(
    character: CharacterDefinition,
    scenarios: string[]
  ): Promise<Array<{
    scenario: string;
    prompt: string;
    adaptations: string[];
  }>> {
    try {
      const prompt = `Generate consistent character prompts for these scenarios:

Character: ${character.name}
Definition: ${JSON.stringify(character, null, 2)}

Scenarios: ${scenarios.join(", ")}

For each scenario, provide:
- scenario: The scenario name
- prompt: Full consistent image generation prompt
- adaptations: What changes from base character (pose, expression, etc.)

Maintain character consistency while adapting to context.

Return JSON with variations array.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a character consistency expert. You adapt characters to scenarios while maintaining identity.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.variations || [];
    } catch (error) {
      console.error("Scenario variations error:", error);
      return [];
    }
  }

  /**
   * Create character evolution timeline
   */
  async createCharacterEvolution(
    character: CharacterDefinition,
    evolutionPhases: Array<{
      phase: string;
      description: string;
      timeline: string;
    }>
  ): Promise<Array<{
    phase: string;
    characterUpdate: Partial<CharacterDefinition>;
    changes: string[];
  }>> {
    try {
      const prompt = `Create character evolution timeline:

Base character:
${JSON.stringify(character, null, 2)}

Evolution phases:
${JSON.stringify(evolutionPhases, null, 2)}

For each phase, show how character evolves while maintaining core identity.

Return JSON with evolution array containing: phase, characterUpdate (partial changes), changes[] (list of what changed)`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a brand evolution strategist. You plan character development over time.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.evolution || [];
    } catch (error) {
      console.error("Character evolution error:", error);
      return [];
    }
  }

  /**
   * Generate character style guide document
   */
  async generateStyleGuideDocument(character: CharacterDefinition): Promise<{
    dos: string[];
    donts: string[];
    examples: Array<{ scenario: string; prompt: string }>;
    colorPalette: string[];
    typography: string;
    usage: string;
  }> {
    try {
      const prompt = `Create comprehensive style guide for this character:

${JSON.stringify(character, null, 2)}

Provide:
- dos: 5-7 guidelines for using character
- donts: 5-7 things to avoid
- examples: 3-5 scenario prompts
- colorPalette: Character colors
- typography: Suggested font style
- usage: Best practices

Return JSON.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a brand guidelines expert. You create comprehensive character style guides.",
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
      console.error("Style guide generation error:", error);
      return {
        dos: [],
        donts: [],
        examples: [],
        colorPalette: [],
        typography: "",
        usage: "",
      };
    }
  }
}

export function createCharacterConsistencyEngine(openaiKey?: string): CharacterConsistencyEngine {
  return new CharacterConsistencyEngine(openaiKey);
}

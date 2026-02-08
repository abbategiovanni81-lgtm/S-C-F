import { openai } from "../openai";
import type { AvaChatMessage, BrandBrief } from "@shared/schema";

interface ChatContext {
  sessionId: string;
  userId: string;
  messages: Array<{ role: string; content: string }>;
  brandBrief?: BrandBrief;
}

interface ContentPlanRequest {
  contentType: string;
  userPrompt: string;
  context: ChatContext;
}

interface ContentPlan {
  contentType: string;
  planData: any;
  summary: string;
}

// System prompt for Ava
const AVA_SYSTEM_PROMPT = `You are Ava, an AI assistant specialized in creating social media content from scratch through natural language conversations. Your role is to:

1. Understand user requirements through conversational interactions
2. Create structured content plans based on the requested format (Reels, UGC Ads, Blogs, Captions, Carousels, etc.)
3. Guide users through the content creation process
4. Provide helpful suggestions and alternatives
5. Be transparent about limitations and technical constraints

Key capabilities:
- Generate detailed content plans with scene breakdowns, slide details, or section outlines
- Suggest hooks, scripts, and visual concepts
- Adapt to user feedback and iterate on content
- Recommend optimal content strategies based on platform and audience

Communication style:
- Conversational and friendly
- Clear and concise
- Professional but approachable
- Proactive in offering suggestions
- Transparent about what you can and cannot do

When creating content plans:
- Break down complex content into manageable components
- Provide specific details for each section/scene/slide
- Include timing, visuals, and narrative elements
- Ensure plans align with platform best practices`;

/**
 * Generate a chat response from Ava based on user input
 */
export async function generateAvaResponse(
  userMessage: string,
  context: ChatContext
): Promise<string> {
  try {
    const messages = [
      { role: "system", content: AVA_SYSTEM_PROMPT },
      ...context.messages,
      { role: "user", content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1500,
    });

    return completion.choices[0]?.message?.content || "I apologize, but I'm having trouble generating a response. Please try again.";
  } catch (error) {
    console.error("Error generating Ava response:", error);
    throw new Error("Failed to generate response");
  }
}

/**
 * Create a structured content plan based on user requirements
 */
export async function createContentPlan(
  request: ContentPlanRequest
): Promise<ContentPlan> {
  const { contentType, userPrompt, context } = request;

  const planPrompt = `Based on the following user request, create a detailed content plan for a ${contentType}:

User Request: ${userPrompt}

${context.brandBrief ? `Brand Context:
- Brand Voice: ${context.brandBrief.brandVoice}
- Target Audience: ${context.brandBrief.targetAudience}
- Content Goals: ${context.brandBrief.contentGoals}
` : ''}

Generate a structured plan in JSON format with the following structure based on content type:

For REEL/VIDEO:
{
  "duration": "total duration in seconds",
  "hook": "attention-grabbing opening",
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": 3,
      "visualDescription": "what viewers see",
      "scriptNarration": "what is said/shown as text",
      "purpose": "why this scene matters"
    }
  ],
  "cta": "call to action"
}

For CAROUSEL:
{
  "format": "square or portrait",
  "slides": [
    {
      "slideNumber": 1,
      "type": "cover or content",
      "headline": "main text",
      "subtext": "supporting text",
      "visualConcept": "image/design description"
    }
  ],
  "caption": "post caption"
}

For BLOG:
{
  "title": "blog post title",
  "sections": [
    {
      "heading": "section title",
      "keyPoints": ["point 1", "point 2"],
      "wordCount": 200
    }
  ],
  "seoKeywords": ["keyword1", "keyword2"]
}

For CAPTION:
{
  "hookLine": "opening line",
  "body": "main content",
  "cta": "call to action",
  "hashtags": ["tag1", "tag2"]
}

Respond ONLY with valid JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a content planning expert. Generate detailed, platform-optimized content plans in JSON format." },
        { role: "user", content: planPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content || "{}";
    const planData = JSON.parse(responseContent);

    // Generate a summary of the plan
    const summary = generatePlanSummary(contentType, planData);

    return {
      contentType,
      planData,
      summary
    };
  } catch (error) {
    console.error("Error creating content plan:", error);
    throw new Error("Failed to create content plan");
  }
}

/**
 * Generate a human-readable summary of a content plan
 */
function generatePlanSummary(contentType: string, planData: any): string {
  switch (contentType.toLowerCase()) {
    case "reel":
    case "video":
      const sceneCount = planData.scenes?.length || 0;
      return `${planData.duration || "30"}s video with ${sceneCount} scenes. Hook: "${planData.hook?.substring(0, 50)}..."`;
    
    case "carousel":
      const slideCount = planData.slides?.length || 0;
      return `${slideCount}-slide carousel in ${planData.format || "square"} format`;
    
    case "blog":
      const sectionCount = planData.sections?.length || 0;
      return `Blog post: "${planData.title}" with ${sectionCount} sections`;
    
    case "caption":
      return `Caption with hook: "${planData.hookLine?.substring(0, 50)}..."`;
    
    default:
      return `${contentType} content plan created`;
  }
}

/**
 * Analyze user message to detect content creation intent
 */
export function detectContentIntent(message: string): {
  isContentRequest: boolean;
  contentType?: string;
  confidence: number;
} {
  const lowerMessage = message.toLowerCase();
  
  // Keywords for different content types
  const contentKeywords: Record<string, string[]> = {
    reel: ["reel", "short video", "tiktok", "instagram video"],
    carousel: ["carousel", "slides", "swipe post"],
    blog: ["blog", "article", "blog post"],
    caption: ["caption", "post caption", "write a caption"],
    ugc_ad: ["ugc", "ugc ad", "user generated content"]
  };

  // Check for creation intent
  const creationIntents = ["create", "make", "generate", "write", "produce", "need", "want"];
  const hasCreationIntent = creationIntents.some(intent => lowerMessage.includes(intent));

  if (!hasCreationIntent) {
    return { isContentRequest: false, confidence: 0 };
  }

  // Detect content type
  for (const [type, keywords] of Object.entries(contentKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        isContentRequest: true,
        contentType: type,
        confidence: 0.8
      };
    }
  }

  return { isContentRequest: true, confidence: 0.5 };
}

/**
 * Refine an existing content plan based on user feedback
 */
export async function refineContentPlan(
  originalPlan: any,
  feedback: string,
  contentType: string
): Promise<any> {
  try {
    const refinementPrompt = `You are refining a content plan based on user feedback.

Original Plan:
${JSON.stringify(originalPlan, null, 2)}

User Feedback: ${feedback}

Content Type: ${contentType}

Update the plan according to the feedback while maintaining the same JSON structure. Respond ONLY with the updated JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a content planning expert. Refine content plans based on feedback." },
        { role: "user", content: refinementPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("Error refining content plan:", error);
    throw new Error("Failed to refine content plan");
  }
}

/**
 * Generate batch content plans for multiple pieces
 */
export async function generateBatchPlans(
  batchRequest: string,
  context: ChatContext
): Promise<ContentPlan[]> {
  try {
    const batchPrompt = `Create multiple content plans based on this request: ${batchRequest}

${context.brandBrief ? `Brand Context:
- Brand Voice: ${context.brandBrief.brandVoice}
- Target Audience: ${context.brandBrief.targetAudience}
- Content Goals: ${context.brandBrief.contentGoals}
` : ''}

Generate an array of content plans. Each plan should include:
- contentType: type of content (reel, carousel, blog, caption)
- title: brief title for this content piece
- planData: the detailed plan structure

Respond with a JSON object containing a "plans" array.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a content planning expert. Generate multiple content plans efficiently." },
        { role: "user", content: batchPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content || '{"plans": []}';
    const response = JSON.parse(responseContent);
    
    return response.plans.map((plan: any) => ({
      contentType: plan.contentType,
      planData: plan.planData,
      summary: generatePlanSummary(plan.contentType, plan.planData)
    }));
  } catch (error) {
    console.error("Error generating batch plans:", error);
    throw new Error("Failed to generate batch plans");
  }
}

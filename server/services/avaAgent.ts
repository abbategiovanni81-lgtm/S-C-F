import { analyzeViralContentEnhanced, type EnhancedContentAnalysisResult, type TrendingContext } from "../openai";
import { storage } from "../storage";

/**
 * Ava Agent Service
 * Provides content analysis and comparison capabilities for the Ava AI chat
 */

export interface CompactAnalysisResult {
  viralPotential: number;
  scores: {
    hook: number;
    body: number;
    visual: number;
  };
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface ComparisonResult {
  currentContent: {
    title: string;
    scores: CompactAnalysisResult['scores'];
    viralPotential: number;
  };
  comparedContent: {
    title: string;
    scores: CompactAnalysisResult['scores'];
    viralPotential: number;
  };
  insights: {
    betterIn: string[];
    worseIn: string[];
    recommendations: string[];
  };
}

export interface BatchAnalysisResult {
  overallScore: number;
  batchSize: number;
  items: Array<{
    id: string;
    title: string;
    viralPotential: number;
    scores: CompactAnalysisResult['scores'];
    issues: string[];
  }>;
  consistencyReport: {
    toneConsistency: number;
    qualityVariance: number;
    gaps: string[];
    duplicates: string[];
  };
  recommendations: string[];
}

/**
 * Analyze content and return compact results suitable for inline display
 */
export async function analyzeContent(
  imageBase64: string,
  mimeType: string,
  brandBriefId?: string,
  userId?: string
): Promise<CompactAnalysisResult> {
  let brandBrief = undefined;
  let trendingContext: TrendingContext | undefined = undefined;

  // Fetch brand brief if provided
  if (brandBriefId && userId) {
    const brief = await storage.getBrandBrief(brandBriefId);
    if (brief && brief.userId === userId) {
      brandBrief = {
        name: brief.name,
        brandVoice: brief.brandVoice,
        targetAudience: brief.targetAudience,
        contentGoals: brief.contentGoals,
      };

      // Fetch trending context
      const trendingTopics = await storage.getTrendingTopics(undefined, brandBriefId);
      const listeningHits = await storage.getListeningHitsByBrief(brandBriefId);
      
      const highEngagementThemes: string[] = [];
      const keywordCounts: Record<string, number> = {};
      
      const sortedHits = [...listeningHits]
        .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
        .slice(0, 20);
      
      for (const hit of sortedHits) {
        if (hit.matchedKeywords && hit.matchedKeywords.length > 0) {
          for (const keyword of hit.matchedKeywords) {
            keywordCounts[keyword] = (keywordCounts[keyword] || 0) + (hit.engagementScore || 1);
          }
        }
      }
      
      const sortedThemes = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([keyword]) => keyword);
      highEngagementThemes.push(...sortedThemes);
      
      trendingContext = {
        topics: trendingTopics.slice(0, 5).map(t => ({
          topic: t.topic,
          keywords: t.keywords || undefined,
          engagement: t.engagementTotal || undefined,
        })),
        highEngagementThemes,
      };
    }
  }

  // Get enhanced analysis
  const fullAnalysis = await analyzeViralContentEnhanced(
    imageBase64,
    mimeType,
    brandBrief,
    trendingContext
  );

  // Create compact summary
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Collect top strengths from each section
  if (fullAnalysis.detailedFeedback.hook.strengths.length > 0) {
    strengths.push(fullAnalysis.detailedFeedback.hook.strengths[0]);
  }
  if (fullAnalysis.detailedFeedback.body.strengths.length > 0) {
    strengths.push(fullAnalysis.detailedFeedback.body.strengths[0]);
  }
  if (fullAnalysis.detailedFeedback.visual.strengths.length > 0) {
    strengths.push(fullAnalysis.detailedFeedback.visual.strengths[0]);
  }

  // Collect top weaknesses/improvements
  if (fullAnalysis.detailedFeedback.hook.improvements.length > 0) {
    weaknesses.push(fullAnalysis.detailedFeedback.hook.improvements[0]);
  }
  if (fullAnalysis.detailedFeedback.body.improvements.length > 0) {
    weaknesses.push(fullAnalysis.detailedFeedback.body.improvements[0]);
  }

  // Generate compact summary
  const avgScore = Math.round((fullAnalysis.scores.hook + fullAnalysis.scores.body + fullAnalysis.scores.visual) / 3);
  const summary = `This content scores ${avgScore}/100 overall. ${
    fullAnalysis.scores.viralPotential >= 80 
      ? "Strong viral potential with effective hooks and engaging content structure." 
      : fullAnalysis.scores.viralPotential >= 60
      ? "Good foundation with room for optimization in hook strength and visual appeal."
      : "Needs improvements in hook impact, content structure, and visual elements to increase engagement."
  } ${fullAnalysis.detailedFeedback.viralPotential.summary.split('.')[0]}.`;

  return {
    viralPotential: fullAnalysis.scores.viralPotential,
    scores: {
      hook: fullAnalysis.scores.hook,
      body: fullAnalysis.scores.body,
      visual: fullAnalysis.scores.visual,
    },
    summary,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 2),
  };
}

/**
 * Compare new content against reference content (past post or competitor)
 */
export async function compareContent(
  newContentBase64: string,
  newContentMimeType: string,
  referenceContentBase64: string,
  referenceContentMimeType: string,
  brandBriefId?: string,
  userId?: string
): Promise<ComparisonResult> {
  // Analyze both pieces of content
  const newAnalysis = await analyzeContent(newContentBase64, newContentMimeType, brandBriefId, userId);
  const refAnalysis = await analyzeContent(referenceContentBase64, referenceContentMimeType, brandBriefId, userId);

  const betterIn: string[] = [];
  const worseIn: string[] = [];
  const recommendations: string[] = [];

  // Compare scores
  if (newAnalysis.scores.hook > refAnalysis.scores.hook) {
    betterIn.push(`Hook (+${newAnalysis.scores.hook - refAnalysis.scores.hook} points)`);
  } else if (newAnalysis.scores.hook < refAnalysis.scores.hook) {
    worseIn.push(`Hook (-${refAnalysis.scores.hook - newAnalysis.scores.hook} points)`);
    recommendations.push("Consider strengthening your opening hook to match reference content's attention-grabbing power");
  }

  if (newAnalysis.scores.body > refAnalysis.scores.body) {
    betterIn.push(`Content Body (+${newAnalysis.scores.body - refAnalysis.scores.body} points)`);
  } else if (newAnalysis.scores.body < refAnalysis.scores.body) {
    worseIn.push(`Content Body (-${refAnalysis.scores.body - newAnalysis.scores.body} points)`);
    recommendations.push("Enhance your content structure and pacing to improve retention");
  }

  if (newAnalysis.scores.visual > refAnalysis.scores.visual) {
    betterIn.push(`Visual Appeal (+${newAnalysis.scores.visual - refAnalysis.scores.visual} points)`);
  } else if (newAnalysis.scores.visual < refAnalysis.scores.visual) {
    worseIn.push(`Visual Appeal (-${refAnalysis.scores.visual - newAnalysis.scores.visual} points)`);
    recommendations.push("Improve visual elements: colors, text overlays, and composition");
  }

  if (newAnalysis.viralPotential > refAnalysis.viralPotential) {
    betterIn.push(`Overall Viral Potential (+${newAnalysis.viralPotential - refAnalysis.viralPotential} points)`);
  } else if (newAnalysis.viralPotential < refAnalysis.viralPotential) {
    worseIn.push(`Overall Viral Potential (-${refAnalysis.viralPotential - newAnalysis.viralPotential} points)`);
  }

  return {
    currentContent: {
      title: "Your New Content",
      scores: newAnalysis.scores,
      viralPotential: newAnalysis.viralPotential,
    },
    comparedContent: {
      title: "Reference Content",
      scores: refAnalysis.scores,
      viralPotential: refAnalysis.viralPotential,
    },
    insights: {
      betterIn,
      worseIn,
      recommendations,
    },
  };
}

/**
 * Analyze multiple pieces of content in batch
 */
export async function batchAnalyze(
  items: Array<{ id: string; title: string; imageBase64: string; mimeType: string }>,
  brandBriefId?: string,
  userId?: string
): Promise<BatchAnalysisResult> {
  const analyses = await Promise.all(
    items.map(async (item) => ({
      id: item.id,
      title: item.title,
      analysis: await analyzeContent(item.imageBase64, item.mimeType, brandBriefId, userId),
    }))
  );

  const batchItems = analyses.map(({ id, title, analysis }) => ({
    id,
    title,
    viralPotential: analysis.viralPotential,
    scores: analysis.scores,
    issues: analysis.weaknesses,
  }));

  // Calculate overall metrics
  const avgViralPotential = Math.round(
    batchItems.reduce((sum, item) => sum + item.viralPotential, 0) / batchItems.length
  );

  // Check consistency
  const consistencyReport = await checkBatchConsistency(batchItems);

  // Generate recommendations
  const recommendations: string[] = [];
  if (consistencyReport.toneConsistency < 70) {
    recommendations.push("Consider unifying the tone and style across all content pieces");
  }
  if (consistencyReport.qualityVariance > 30) {
    recommendations.push("Some pieces significantly underperform - review and strengthen weaker content");
  }
  if (consistencyReport.duplicates.length > 0) {
    recommendations.push(`Found ${consistencyReport.duplicates.length} duplicate or very similar items`);
  }
  if (consistencyReport.gaps.length > 0) {
    recommendations.push(`Content gaps identified: ${consistencyReport.gaps.join(", ")}`);
  }

  return {
    overallScore: avgViralPotential,
    batchSize: items.length,
    items: batchItems,
    consistencyReport,
    recommendations,
  };
}

/**
 * Check consistency across batch content
 */
export async function checkBatchConsistency(
  items: Array<{
    id: string;
    title: string;
    viralPotential: number;
    scores: { hook: number; body: number; visual: number };
  }>
): Promise<{
  toneConsistency: number;
  qualityVariance: number;
  gaps: string[];
  duplicates: string[];
}> {
  // Calculate quality variance
  const scores = items.map(i => i.viralPotential);
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = Math.round(
    Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length)
  );

  // Simple duplicate detection (titles that are very similar)
  const duplicates: string[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const title1 = items[i].title.toLowerCase();
      const title2 = items[j].title.toLowerCase();
      
      // Simple similarity check
      const words1 = title1.split(/\s+/);
      const words2 = title2.split(/\s+/);
      const commonWords = words1.filter(w => words2.includes(w));
      
      if (commonWords.length >= Math.min(words1.length, words2.length) * 0.7) {
        duplicates.push(`"${items[i].title}" and "${items[j].title}"`);
      }
    }
  }

  // Identify gaps (simplified)
  const gaps: string[] = [];
  const avgHook = items.reduce((sum, i) => sum + i.scores.hook, 0) / items.length;
  const avgBody = items.reduce((sum, i) => sum + i.scores.body, 0) / items.length;
  const avgVisual = items.reduce((sum, i) => sum + i.scores.visual, 0) / items.length;

  if (avgHook < 60) gaps.push("weak hooks across batch");
  if (avgBody < 60) gaps.push("low content quality");
  if (avgVisual < 60) gaps.push("poor visual appeal");

  // Tone consistency (simplified - based on score distribution)
  const toneConsistency = Math.max(0, 100 - variance);

  return {
    toneConsistency,
    qualityVariance: variance,
    gaps,
    duplicates,
  };
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  Share2,
  Clock,
  Target,
  Sparkles,
  AlertCircle
} from "lucide-react";

interface ViralityFactors {
  hookStrength: number;
  pacing: number;
  trendAlignment: number;
  visualAppeal: number;
  callToAction: number;
  retention: number;
  shareability: number;
}

interface ViralityScoreProps {
  factors: ViralityFactors;
  overallScore: number;
  platform?: string;
  className?: string;
}

export function ViralityScore({ 
  factors, 
  overallScore, 
  platform = "all",
  className = "" 
}: ViralityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return { text: "text-green-400", bg: "bg-green-900/30", border: "border-green-700" };
    if (score >= 75) return { text: "text-blue-400", bg: "bg-blue-900/30", border: "border-blue-700" };
    if (score >= 60) return { text: "text-yellow-400", bg: "bg-yellow-900/30", border: "border-yellow-700" };
    return { text: "text-orange-400", bg: "bg-orange-900/30", border: "border-orange-700" };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Viral Potential";
    if (score >= 75) return "High Performance";
    if (score >= 60) return "Good Potential";
    return "Needs Improvement";
  };

  const colors = getScoreColor(overallScore);

  const factorDetails = [
    { 
      key: "hookStrength", 
      label: "Hook Strength", 
      icon: Target, 
      score: factors.hookStrength,
      description: "First 3 seconds impact"
    },
    { 
      key: "pacing", 
      label: "Pacing", 
      icon: Clock, 
      score: factors.pacing,
      description: "Content rhythm & flow"
    },
    { 
      key: "trendAlignment", 
      label: "Trend Alignment", 
      icon: TrendingUp, 
      score: factors.trendAlignment,
      description: "Relevance to current trends"
    },
    { 
      key: "visualAppeal", 
      label: "Visual Appeal", 
      icon: Eye, 
      score: factors.visualAppeal,
      description: "Thumbnail & visual quality"
    },
    { 
      key: "callToAction", 
      label: "Call-to-Action", 
      icon: MessageCircle, 
      score: factors.callToAction,
      description: "Engagement prompts"
    },
    { 
      key: "retention", 
      label: "Retention", 
      icon: ThumbsUp, 
      score: factors.retention,
      description: "Predicted watch time"
    },
    { 
      key: "shareability", 
      label: "Shareability", 
      icon: Share2, 
      score: factors.shareability,
      description: "Viral sharing potential"
    },
  ];

  return (
    <Card className={`${colors.bg} border-2 ${colors.border} ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className={`w-6 h-6 ${colors.text}`} />
              Virality Score
            </CardTitle>
            <CardDescription className="mt-1">
              AI-powered prediction for {platform === "all" ? "all platforms" : platform}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-black ${colors.text}`}>
              {overallScore}
            </div>
            <Badge className={`${colors.bg} ${colors.text} border-0 mt-2`}>
              {getScoreLabel(overallScore)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Score</span>
            <span className={`text-sm font-bold ${colors.text}`}>
              {overallScore}/100
            </span>
          </div>
          <Progress value={overallScore} className="h-3" />
        </div>

        {/* Factor Breakdown */}
        <div>
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Score Breakdown
          </h4>
          <div className="space-y-3">
            {factorDetails.map((factor) => {
              const factorColors = getScoreColor(factor.score);
              const Icon = factor.icon;
              
              return (
                <div key={factor.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{factor.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${factorColors.text}`}>
                      {factor.score}
                    </span>
                  </div>
                  <Progress value={factor.score} className="h-2" />
                  <p className="text-xs text-slate-400 ml-6">{factor.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div className="pt-4 border-t border-slate-700">
          <h4 className="text-sm font-bold mb-2">Top Recommendations</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            {factors.hookStrength < 70 && (
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Improve your hook - first 3 seconds are critical</span>
              </li>
            )}
            {factors.trendAlignment < 70 && (
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Add trending audio or topics to increase relevance</span>
              </li>
            )}
            {factors.callToAction < 70 && (
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Include a clear CTA to boost engagement</span>
              </li>
            )}
            {overallScore >= 85 && (
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Great score! This content is ready to go viral</span>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Example usage component
export function ViralityScoreDemo() {
  const [mockFactors] = useState<ViralityFactors>({
    hookStrength: 92,
    pacing: 85,
    trendAlignment: 78,
    visualAppeal: 88,
    callToAction: 75,
    retention: 90,
    shareability: 82,
  });

  const overallScore = Math.round(
    Object.values(mockFactors).reduce((a, b) => a + b, 0) / Object.values(mockFactors).length
  );

  return (
    <div className="p-6 max-w-2xl">
      <ViralityScore 
        factors={mockFactors} 
        overallScore={overallScore}
        platform="TikTok"
      />
    </div>
  );
}

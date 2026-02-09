import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  GitCompare, TrendingUp, ArrowUp, ArrowDown, CheckCircle, AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonCardProps {
  currentContent: {
    title: string;
    scores: {
      hook: number;
      body: number;
      visual: number;
    };
    viralPotential: number;
  };
  comparedContent: {
    title: string;
    scores: {
      hook: number;
      body: number;
      visual: number;
    };
    viralPotential: number;
  };
  insights: {
    betterIn: string[];
    worseIn: string[];
    recommendations: string[];
  };
}

export function ComparisonCard({
  currentContent,
  comparedContent,
  insights,
}: ComparisonCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const renderScoreComparison = (
    label: string,
    currentScore: number,
    comparedScore: number
  ) => {
    const diff = currentScore - comparedScore;
    const isPositive = diff > 0;
    const isNeutral = diff === 0;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          {!isNeutral && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {isPositive ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {Math.abs(diff)} pts
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-gray-500 mb-1">Yours</div>
            <Progress value={currentScore} className="h-2" />
            <div className={cn("text-xs font-bold mt-1", getScoreColor(currentScore))}>
              {currentScore}/100
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Reference</div>
            <Progress value={comparedScore} className="h-2 opacity-70" />
            <div className={cn("text-xs font-bold mt-1", getScoreColor(comparedScore))}>
              {comparedScore}/100
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-blue-600" />
          Content Comparison
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Titles */}
        <div className="grid grid-cols-2 gap-2 pb-2 border-b">
          <div className="text-xs">
            <div className="font-semibold text-gray-600 mb-1">Your Content</div>
            <div className="text-gray-700">{currentContent.title}</div>
          </div>
          <div className="text-xs">
            <div className="font-semibold text-gray-600 mb-1">Reference</div>
            <div className="text-gray-700">{comparedContent.title}</div>
          </div>
        </div>

        {/* Viral Potential Comparison */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Viral Potential</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Badge 
                variant={currentContent.viralPotential >= 70 ? "default" : "secondary"}
                className="text-lg px-3 mb-2"
              >
                {currentContent.viralPotential}
              </Badge>
              <div className="text-xs text-gray-500">Your Score</div>
            </div>
            <div className="text-center">
              <Badge 
                variant="outline"
                className="text-lg px-3 mb-2"
              >
                {comparedContent.viralPotential}
              </Badge>
              <div className="text-xs text-gray-500">Reference</div>
            </div>
          </div>
        </div>

        {/* Detailed Score Comparisons */}
        <div className="space-y-4 pt-2 border-t">
          {renderScoreComparison("Hook", currentContent.scores.hook, comparedContent.scores.hook)}
          {renderScoreComparison("Content Body", currentContent.scores.body, comparedContent.scores.body)}
          {renderScoreComparison("Visual Appeal", currentContent.scores.visual, comparedContent.scores.visual)}
        </div>

        {/* Better In */}
        {insights.betterIn.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <CheckCircle className="h-4 w-4" />
              You're Better In
            </div>
            <ul className="space-y-1 ml-6">
              {insights.betterIn.map((item, i) => (
                <li key={i} className="text-sm text-gray-700">• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Worse In */}
        {insights.worseIn.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
              <AlertCircle className="h-4 w-4" />
              Areas to Improve
            </div>
            <ul className="space-y-1 ml-6">
              {insights.worseIn.map((item, i) => (
                <li key={i} className="text-sm text-gray-700">• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations.length > 0 && (
          <div className="space-y-2 pt-2 border-t bg-blue-50 p-3 rounded-lg -mx-3">
            <div className="text-sm font-medium text-blue-900">
              💡 Recommendations
            </div>
            <ul className="space-y-1.5">
              {insights.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-blue-800">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

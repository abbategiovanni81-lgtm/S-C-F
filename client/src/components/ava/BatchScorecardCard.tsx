import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutGrid, TrendingUp, AlertTriangle, CheckCircle, AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Constants
const QUALITY_VARIANCE_SCALE_FACTOR = 2; // Scale factor for displaying quality variance on progress bar

interface BatchScorecardCardProps {
  overallScore: number;
  batchSize: number;
  items: Array<{
    id: string;
    title: string;
    viralPotential: number;
    scores: {
      hook: number;
      body: number;
      visual: number;
    };
    issues: string[];
  }>;
  consistencyReport: {
    toneConsistency: number;
    qualityVariance: number;
    gaps: string[];
    duplicates: string[];
  };
  recommendations: string[];
  onItemClick?: (itemId: string) => void;
  onFixIssues?: () => void;
}

export function BatchScorecardCard({
  overallScore,
  batchSize,
  items,
  consistencyReport,
  recommendations,
  onItemClick,
  onFixIssues,
}: BatchScorecardCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const hasIssues = 
    consistencyReport.gaps.length > 0 || 
    consistencyReport.duplicates.length > 0 ||
    consistencyReport.toneConsistency < 70 ||
    consistencyReport.qualityVariance > 30;

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-indigo-600" />
            Batch Content Scorecard
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {batchSize} items
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium">Batch Average Score</span>
            </div>
            <Badge variant={getScoreBadgeVariant(overallScore)} className="text-lg px-3">
              {overallScore}/100
            </Badge>
          </div>
          <Progress value={overallScore} className="h-2" />
        </div>

        {/* Consistency Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="space-y-1">
            <div className="text-xs text-gray-600 font-medium">Tone Consistency</div>
            <div className="flex items-center gap-2">
              <Progress value={consistencyReport.toneConsistency} className="h-1.5 flex-1" />
              <span className={cn(
                "text-xs font-bold",
                getScoreColor(consistencyReport.toneConsistency)
              )}>
                {consistencyReport.toneConsistency}%
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-600 font-medium">Quality Variance</div>
            <div className="flex items-center gap-2">
              <Progress 
                value={Math.min(100, consistencyReport.qualityVariance * QUALITY_VARIANCE_SCALE_FACTOR)} 
                className="h-1.5 flex-1" 
              />
              <span className={cn(
                "text-xs font-bold",
                consistencyReport.qualityVariance > 30 ? "text-red-600" : 
                consistencyReport.qualityVariance > 15 ? "text-yellow-600" : "text-green-600"
              )}>
                {consistencyReport.qualityVariance}
              </span>
            </div>
          </div>
        </div>

        {/* Issues Alert */}
        {hasIssues && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-900">
              <AlertTriangle className="h-4 w-4" />
              Issues Detected
            </div>
            <div className="space-y-1 text-xs text-orange-800">
              {consistencyReport.toneConsistency < 70 && (
                <div>• Inconsistent tone across batch</div>
              )}
              {consistencyReport.qualityVariance > 30 && (
                <div>• High quality variance - some items significantly weaker</div>
              )}
              {consistencyReport.gaps.length > 0 && (
                <div>• Content gaps: {consistencyReport.gaps.join(", ")}</div>
              )}
              {consistencyReport.duplicates.length > 0 && (
                <div>• {consistencyReport.duplicates.length} duplicate(s) found</div>
              )}
            </div>
          </div>
        )}

        {/* Individual Items */}
        <div className="space-y-2 pt-2 border-t">
          <div className="text-sm font-medium text-gray-700">Individual Scores</div>
          <ScrollArea className="h-48 rounded border">
            <div className="space-y-2 p-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick?.(item.id)}
                  className={cn(
                    "p-2 rounded-lg border bg-white",
                    onItemClick && "cursor-pointer hover:bg-gray-50 transition-colors"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium truncate flex-1 mr-2">
                      {item.title}
                    </div>
                    <Badge 
                      variant={getScoreBadgeVariant(item.viralPotential)}
                      className="text-xs px-2"
                    >
                      {item.viralPotential}
                    </Badge>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className={cn("font-medium", getScoreColor(item.scores.hook))}>
                      H:{item.scores.hook}
                    </span>
                    <span className={cn("font-medium", getScoreColor(item.scores.body))}>
                      B:{item.scores.body}
                    </span>
                    <span className={cn("font-medium", getScoreColor(item.scores.visual))}>
                      V:{item.scores.visual}
                    </span>
                  </div>
                  {item.issues.length > 0 && (
                    <div className="mt-1 text-xs text-orange-600 flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">{item.issues[0]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2 pt-2 border-t bg-indigo-50 p-3 rounded-lg -mx-3">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-900">
              <CheckCircle className="h-4 w-4" />
              Recommendations
            </div>
            <ul className="space-y-1.5">
              {recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-indigo-800">• {rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        {hasIssues && onFixIssues && (
          <Button onClick={onFixIssues} className="w-full" size="sm">
            Fix Issues Automatically
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

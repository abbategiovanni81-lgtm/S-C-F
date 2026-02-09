import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, TrendingUp, CheckCircle, AlertCircle, ChevronDown, ChevronUp 
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AnalysisCardProps {
  viralPotential: number;
  scores: {
    hook: number;
    body: number;
    visual: number;
  };
  summary: string;
  strengths: string[];
  weaknesses: string[];
  onDeepAnalysis?: () => void;
  onCompare?: () => void;
  onMakeChanges?: () => void;
}

export function AnalysisCard({
  viralPotential,
  scores,
  summary,
  strengths,
  weaknesses,
  onDeepAnalysis,
  onCompare,
  onMakeChanges,
}: AnalysisCardProps) {
  const [expanded, setExpanded] = useState(false);

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

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Content Analysis
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Viral Potential Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Viral Potential</span>
            </div>
            <Badge variant={getScoreBadgeVariant(viralPotential)} className="text-lg px-3">
              {viralPotential}/100
            </Badge>
          </div>
          <Progress value={viralPotential} className="h-2" />
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>

        {/* Compact Scores */}
        {!expanded && (
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              Hook: <span className={cn("ml-1 font-bold", getScoreColor(scores.hook))}>{scores.hook}</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              Body: <span className={cn("ml-1 font-bold", getScoreColor(scores.body))}>{scores.body}</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              Visual: <span className={cn("ml-1 font-bold", getScoreColor(scores.visual))}>{scores.visual}</span>
            </Badge>
          </div>
        )}

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-4 pt-2 border-t">
            {/* Detailed Scores */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Hook</span>
                  <span className={cn("font-bold", getScoreColor(scores.hook))}>{scores.hook}/100</span>
                </div>
                <Progress value={scores.hook} className="h-1.5" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Content Body</span>
                  <span className={cn("font-bold", getScoreColor(scores.body))}>{scores.body}/100</span>
                </div>
                <Progress value={scores.body} className="h-1.5" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Visual Appeal</span>
                  <span className={cn("font-bold", getScoreColor(scores.visual))}>{scores.visual}/100</span>
                </div>
                <Progress value={scores.visual} className="h-1.5" />
              </div>
            </div>

            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Strengths
                </div>
                <ul className="space-y-1 ml-6">
                  {strengths.map((strength, i) => (
                    <li key={i} className="text-sm text-gray-700">• {strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                  <AlertCircle className="h-4 w-4" />
                  Improvements
                </div>
                <ul className="space-y-1 ml-6">
                  {weaknesses.map((weakness, i) => (
                    <li key={i} className="text-sm text-gray-700">• {weakness}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap pt-2">
          {onDeepAnalysis && (
            <Button size="sm" variant="outline" onClick={onDeepAnalysis}>
              Deep Analysis
            </Button>
          )}
          {onCompare && (
            <Button size="sm" variant="outline" onClick={onCompare}>
              Compare
            </Button>
          )}
          {onMakeChanges && (
            <Button size="sm" variant="default" onClick={onMakeChanges}>
              Make Changes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

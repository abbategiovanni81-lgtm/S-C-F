import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  TrendingUp, 
  MessageSquare, 
  Eye, 
  Target,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState } from "react";

export interface AnalysisCardProps {
  viralPotential: number;
  hookScore: number;
  bodyScore: number;
  visualScore: number;
  competitiveScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestedActions: string[];
  predictedEngagement: "low" | "medium" | "high" | "viral";
  onActionClick?: (action: string) => void;
}

function getScoreColor(score: number): string {
  if (score >= 8) return "text-green-600 dark:text-green-400";
  if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getProgressColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function getEngagementBadge(engagement: string) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
    viral: { variant: "default", icon: Sparkles },
    high: { variant: "default", icon: TrendingUp },
    medium: { variant: "secondary", icon: Target },
    low: { variant: "outline", icon: AlertCircle },
  };
  
  const config = variants[engagement] || variants.medium;
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {engagement.charAt(0).toUpperCase() + engagement.slice(1)} Potential
    </Badge>
  );
}

export function AnalysisCard({
  viralPotential,
  hookScore,
  bodyScore,
  visualScore,
  competitiveScore,
  summary,
  strengths,
  improvements,
  suggestedActions,
  predictedEngagement,
  onActionClick,
}: AnalysisCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const scores = [
    { label: "Hook", value: hookScore, icon: MessageSquare },
    { label: "Body", value: bodyScore, icon: Eye },
    { label: "Visual", value: visualScore, icon: Sparkles },
    { label: "Competitive", value: competitiveScore, icon: Target },
  ];

  return (
    <Card className="w-full max-w-md bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Content Analysis
          </CardTitle>
          {getEngagementBadge(predictedEngagement)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Viral Potential Score */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Viral Potential</div>
            <div className={`text-3xl font-bold ${getScoreColor(viralPotential)}`}>
              {viralPotential.toFixed(1)}/10
            </div>
          </div>
          <TrendingUp className={`h-12 w-12 ${getScoreColor(viralPotential)}`} />
        </div>

        {/* Compact Score Grid */}
        <div className="grid grid-cols-2 gap-3">
          {scores.map(({ label, value, icon: Icon }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={value * 10} 
                  className="h-1.5 flex-1"
                  indicatorClassName={getProgressColor(value * 10)}
                />
                <span className={`text-sm font-semibold ${getScoreColor(value)}`}>
                  {value.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 text-sm">
          <p className="text-foreground/90">{summary}</p>
        </div>

        {/* Suggested Actions */}
        {suggestedActions.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Suggested Actions</div>
            <div className="flex flex-wrap gap-2">
              {suggestedActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => onActionClick?.(action)}
                  className="text-xs"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Toggle Details */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full justify-between"
        >
          <span className="text-xs font-medium">
            {showDetails ? "Hide" : "Show"} Detailed Analysis
          </span>
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {/* Detailed Analysis */}
        {showDetails && (
          <div className="space-y-3 pt-2 border-t">
            {strengths.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  Strengths
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {strengths.map((strength, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {improvements.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
                  <RefreshCw className="h-4 w-4" />
                  Areas to Improve
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {improvements.map((improvement, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-amber-600 dark:text-amber-400">→</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

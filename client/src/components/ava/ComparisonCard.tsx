import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowUp, 
  ArrowDown, 
  Minus,
  MessageSquare, 
  Eye, 
  Sparkles, 
  Target,
  TrendingUp,
  Lightbulb
} from "lucide-react";

export interface ComparisonCardProps {
  yourContent: {
    viralPotential: number;
    hookScore: number;
    bodyScore: number;
    visualScore: number;
    competitiveScore: number;
  };
  referenceContent: {
    viralPotential: number;
    hookScore: number;
    bodyScore: number;
    visualScore: number;
    competitiveScore: number;
  };
  differences: {
    hook: number;
    body: number;
    visual: number;
    overall: number;
  };
  feedback: string;
  actionableSteps: string[];
  comparisonType: "own" | "competitor";
}

function getDifferenceIcon(diff: number) {
  if (diff > 0.5) return <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
  if (diff < -0.5) return <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function getDifferenceColor(diff: number): string {
  if (diff > 0.5) return "text-green-600 dark:text-green-400";
  if (diff < -0.5) return "text-red-600 dark:text-red-400";
  return "text-gray-600 dark:text-gray-400";
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

export function ComparisonCard({
  yourContent,
  referenceContent,
  differences,
  feedback,
  actionableSteps,
  comparisonType,
}: ComparisonCardProps) {
  const referenceLabel = comparisonType === "own" ? "Your Top Post" : "Competitor";

  const metrics = [
    { 
      label: "Hook", 
      icon: MessageSquare, 
      your: yourContent.hookScore, 
      ref: referenceContent.hookScore,
      diff: differences.hook
    },
    { 
      label: "Body", 
      icon: Eye, 
      your: yourContent.bodyScore, 
      ref: referenceContent.bodyScore,
      diff: differences.body
    },
    { 
      label: "Visual", 
      icon: Sparkles, 
      your: yourContent.visualScore, 
      ref: referenceContent.visualScore,
      diff: differences.visual
    },
    { 
      label: "Overall", 
      icon: Target, 
      your: yourContent.viralPotential, 
      ref: referenceContent.viralPotential,
      diff: differences.overall
    },
  ];

  return (
    <Card className="w-full max-w-md bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Content Comparison
        </CardTitle>
        <Badge variant="secondary" className="w-fit text-xs">
          vs {referenceLabel}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Comparison Grid */}
        <div className="space-y-3">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
            <div className="text-center">Your Content</div>
            <div className="w-8"></div>
            <div className="text-center">{referenceLabel}</div>
            <div className="w-12"></div>
          </div>

          {/* Metric Rows */}
          {metrics.map(({ label, icon: Icon, your, ref, diff }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </div>
              
              <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                {/* Your Score */}
                <div className="space-y-1">
                  <Progress 
                    value={your * 10} 
                    className="h-2"
                    indicatorClassName={getProgressColor(your * 10)}
                  />
                  <div className={`text-right text-sm font-semibold ${getScoreColor(your)}`}>
                    {your.toFixed(1)}
                  </div>
                </div>

                {/* Difference Icon */}
                <div className="w-8 flex justify-center">
                  {getDifferenceIcon(diff)}
                </div>

                {/* Reference Score */}
                <div className="space-y-1">
                  <Progress 
                    value={ref * 10} 
                    className="h-2"
                    indicatorClassName={getProgressColor(ref * 10)}
                  />
                  <div className={`text-left text-sm font-semibold ${getScoreColor(ref)}`}>
                    {ref.toFixed(1)}
                  </div>
                </div>

                {/* Difference Value */}
                <div className={`w-12 text-xs font-semibold ${getDifferenceColor(diff)}`}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feedback */}
        <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-blue-700 dark:text-blue-400">
            <TrendingUp className="h-4 w-4" />
            Key Insights
          </div>
          <p className="text-sm text-foreground/90">{feedback}</p>
        </div>

        {/* Actionable Steps */}
        {actionableSteps.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
              <Lightbulb className="h-4 w-4" />
              How to Improve
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {actionableSteps.map((step, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

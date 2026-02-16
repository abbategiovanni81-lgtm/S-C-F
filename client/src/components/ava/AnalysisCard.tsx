import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Eye, Heart, Share2 } from "lucide-react";

interface AnalysisMetrics {
  viralPotential: number;
  engagementScore: number;
  shareability: number;
  viewRetention: number;
}

interface AnalysisCardProps {
  metrics: AnalysisMetrics;
  insights?: string[];
}

export function AnalysisCard({ metrics, insights }: AnalysisCardProps) {
  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-orange-400";
  };

  const progressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <Card className="bg-[#1a1a1a] border-purple-500/20" data-testid="analysis-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Viral Potential Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-2" data-testid="metric-viral-potential">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">Viral Potential</span>
              </div>
              <span className={`font-semibold ${scoreColor(metrics.viralPotential)}`}>
                {metrics.viralPotential}%
              </span>
            </div>
            <div className="relative h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${progressColor(metrics.viralPotential)} transition-all`}
                style={{ width: `${metrics.viralPotential}%` }}
              />
            </div>
          </div>

          <div className="space-y-2" data-testid="metric-engagement">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">Engagement Score</span>
              </div>
              <span className={`font-semibold ${scoreColor(metrics.engagementScore)}`}>
                {metrics.engagementScore}%
              </span>
            </div>
            <div className="relative h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${progressColor(metrics.engagementScore)} transition-all`}
                style={{ width: `${metrics.engagementScore}%` }}
              />
            </div>
          </div>

          <div className="space-y-2" data-testid="metric-shareability">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">Shareability</span>
              </div>
              <span className={`font-semibold ${scoreColor(metrics.shareability)}`}>
                {metrics.shareability}%
              </span>
            </div>
            <div className="relative h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${progressColor(metrics.shareability)} transition-all`}
                style={{ width: `${metrics.shareability}%` }}
              />
            </div>
          </div>

          <div className="space-y-2" data-testid="metric-retention">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">View Retention</span>
              </div>
              <span className={`font-semibold ${scoreColor(metrics.viewRetention)}`}>
                {metrics.viewRetention}%
              </span>
            </div>
            <div className="relative h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${progressColor(metrics.viewRetention)} transition-all`}
                style={{ width: `${metrics.viewRetention}%` }}
              />
            </div>
          </div>
        </div>

        {insights && insights.length > 0 && (
          <div className="pt-3 border-t border-purple-500/10">
            <div className="text-xs font-semibold text-purple-400 uppercase mb-2">
              Key Insights
            </div>
            <ul className="space-y-1">
              {insights.map((insight, index) => (
                <li key={index} className="text-sm text-gray-400 flex gap-2">
                  <span className="text-purple-400">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

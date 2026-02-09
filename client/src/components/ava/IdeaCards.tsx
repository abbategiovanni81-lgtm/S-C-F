import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, ArrowRight } from "lucide-react";

interface ContentIdea {
  title: string;
  description: string;
  estimatedEngagement: number;
  difficulty: string;
  trendAlignment: number;
}

interface IdeaCardsProps {
  ideas: ContentIdea[];
  onSelectIdea?: (idea: ContentIdea) => void;
}

export function IdeaCards({ ideas, onSelectIdea }: IdeaCardsProps) {
  const getEngagementColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-yellow-500";
    return "text-orange-500";
  };

  const getDifficultyColor = (difficulty: string) => {
    const lower = difficulty.toLowerCase();
    if (lower === "easy") return "bg-green-500/10 text-green-500 border-green-500/20";
    if (lower === "medium") return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-purple-500" />
        Content Ideas
      </h3>

      <div className="grid gap-4">
        {ideas.map((idea, index) => (
          <Card key={index} className="border-purple-200 dark:border-purple-800 hover:border-purple-400 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-2">{idea.title}</h4>
                  <p className="text-sm text-muted-foreground">{idea.description}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={getDifficultyColor(idea.difficulty)}
                >
                  {idea.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Engagement:</span>
                    <span className={`font-semibold ${getEngagementColor(idea.estimatedEngagement)}`}>
                      {idea.estimatedEngagement}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Trend:</span>
                    <span className={`font-semibold ${getEngagementColor(idea.trendAlignment)}`}>
                      {idea.trendAlignment}/10
                    </span>
                  </div>
                </div>
                {onSelectIdea && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectIdea(idea)}
                  >
                    Create
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

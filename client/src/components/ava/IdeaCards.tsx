import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Plus } from "lucide-react";

interface Idea {
  title: string;
  description: string;
  category: string;
}

interface IdeaCardsProps {
  ideas: Idea[];
  onCreateIdea?: (idea: Idea) => void;
}

export function IdeaCards({ ideas, onCreateIdea }: IdeaCardsProps) {
  return (
    <Card className="bg-[#1a1a1a] border-purple-500/20" data-testid="idea-cards">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
          <Lightbulb className="w-5 h-5 text-purple-400" />
          Content Ideas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ideas.map((idea, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-[#0a0a0a] border border-purple-500/10"
            data-testid={`idea-${index}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-purple-400 uppercase">
                    {idea.category}
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-gray-100 mb-1">
                  {idea.title}
                </h4>
                <p className="text-sm text-gray-400">
                  {idea.description}
                </p>
              </div>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                onClick={() => onCreateIdea?.(idea)}
                data-testid={`create-idea-${index}`}
              >
                <Plus className="w-3 h-3 mr-1" />
                Create This
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

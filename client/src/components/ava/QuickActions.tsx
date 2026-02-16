import { Card, CardContent } from "@/components/ui/card";
import { Video, FileText, BarChart3, Lightbulb } from "lucide-react";

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: Video,
    label: "Create a Reel",
    description: "Generate viral short-form content",
  },
  {
    icon: FileText,
    label: "Write captions for this week",
    description: "Get 7 days of engaging captions",
  },
  {
    icon: BarChart3,
    label: "Analyze my latest post",
    description: "Get insights on performance",
  },
  {
    icon: Lightbulb,
    label: "Generate content ideas",
    description: "Fresh ideas for your niche",
  },
];

interface QuickActionsProps {
  onActionClick: (action: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      {QUICK_ACTIONS.map((action, index) => {
        const Icon = action.icon;
        return (
          <Card
            key={index}
            className="cursor-pointer hover:bg-purple-900/20 hover:border-purple-500/50 transition-all bg-[#1a1a1a] border-purple-500/20"
            onClick={() => onActionClick(action.label)}
            data-testid={`quick-action-${index}`}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold text-gray-100 mb-1">
                    {action.label}
                  </div>
                  <div className="text-xs text-gray-400">
                    {action.description}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

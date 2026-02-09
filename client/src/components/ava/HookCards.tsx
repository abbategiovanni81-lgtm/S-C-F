import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Copy, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Hook {
  text: string;
  type: string;
  estimatedEngagement: number;
}

interface HookCardsProps {
  hooks: Hook[];
  onRegenerate?: () => void;
  loading?: boolean;
}

export function HookCards({ hooks, onRegenerate, loading }: HookCardsProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Hook copied to clipboard",
    });
  };

  const getEngagementColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Generated Hooks
        </h3>
        {onRegenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {hooks.map((hook, index) => (
          <Card key={index} className="relative overflow-hidden border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Badge variant="outline" className="text-xs">
                  {hook.type}
                </Badge>
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${getEngagementColor(hook.estimatedEngagement)}`} />
                  <span className="text-xs text-muted-foreground">
                    {hook.estimatedEngagement}/10
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed mb-4">{hook.text}</p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => copyToClipboard(hook.text)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Hook
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

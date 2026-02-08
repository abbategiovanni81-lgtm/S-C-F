import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ProgressCardProps {
  stage: string;
  progress: number;
  message?: string;
}

export function ProgressCard({ stage, progress, message }: ProgressCardProps) {
  return (
    <Card className="w-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          <div className="flex-1">
            <p className="font-medium text-sm">{stage}</p>
            {message && (
              <p className="text-xs text-muted-foreground">{message}</p>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-right text-muted-foreground">{progress}%</p>
      </CardContent>
    </Card>
  );
}

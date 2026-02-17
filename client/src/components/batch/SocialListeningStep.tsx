import { useState } from "react";
import { BatchState } from "./BatchWizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, SkipForward, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SocialListeningStepProps {
  batchState: BatchState;
  onUpdateState: (updates: Partial<BatchState>) => void;
}

export default function SocialListeningStep({
  batchState,
  onUpdateState,
}: SocialListeningStepProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const { toast } = useToast();

  const handleScanTrends = async () => {
    setIsScanning(true);
    
    try {
      const response = await fetch("/api/batch/scan-trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: batchState.platforms,
          timeframe: batchState.timeframe,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to scan trends");
      }

      const data = await response.json();
      
      onUpdateState({
        scanTrends: true,
        trendTopics: data.topics || [],
        pinnedTopics: [],
      });
      
      setHasScanned(true);
      
      toast({
        title: "Trends Scanned",
        description: `Found ${data.topics?.length || 0} trending topics`,
      });
    } catch (error) {
      console.error("Error scanning trends:", error);
      toast({
        title: "Scan Failed",
        description: "Could not retrieve trends. You can skip this step.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSkip = () => {
    onUpdateState({
      scanTrends: false,
      trendTopics: [],
      pinnedTopics: [],
    });
  };

  const handlePinTopic = (topic: string) => {
    const pinnedTopics = batchState.pinnedTopics || [];
    const isPinned = pinnedTopics.includes(topic);
    
    onUpdateState({
      pinnedTopics: isPinned
        ? pinnedTopics.filter(t => t !== topic)
        : [...pinnedTopics, topic],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Social Listening</h3>
        <p className="text-muted-foreground">
          Optionally scan current trends to inform your content generation
        </p>
      </div>

      {/* Choice Cards */}
      {!hasScanned && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-all border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Scan Trends</CardTitle>
              </div>
              <CardDescription>
                Analyze trending topics on your selected platforms to create relevant, timely content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleScanTrends}
                disabled={isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  "Start Scanning"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <SkipForward className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Skip</CardTitle>
              </div>
              <CardDescription>
                Continue without trend analysis. Content will be generated based on your brief only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isScanning}
                className="w-full"
              >
                Skip This Step
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trend Results */}
      {hasScanned && batchState.trendTopics && batchState.trendTopics.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Trending Topics</h4>
            <Badge variant="secondary">
              {batchState.pinnedTopics?.length || 0} Pinned
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {batchState.trendTopics.map((topic, index) => {
              const isPinned = batchState.pinnedTopics?.includes(topic);
              
              return (
                <Card
                  key={index}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isPinned && "border-primary ring-2 ring-primary/20"
                  )}
                  onClick={() => handlePinTopic(topic)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{topic}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Click to {isPinned ? "unpin" : "pin"}
                        </div>
                      </div>
                      <Button
                        variant={isPinned ? "default" : "ghost"}
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinTopic(topic);
                        }}
                      >
                        <Pin className={cn("h-4 w-4", isPinned && "fill-current")} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Pinned topics</strong> will be used to influence content generation,
              creating more relevant and timely posts.
            </p>
          </div>
        </div>
      )}

      {/* No Results */}
      {hasScanned && (!batchState.trendTopics || batchState.trendTopics.length === 0) && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No trending topics found. You can continue without trend analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

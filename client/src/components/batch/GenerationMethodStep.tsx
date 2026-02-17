import { useState } from "react";
import { BatchState } from "./BatchWizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Wand2, Edit3, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface GenerationMethodStepProps {
  batchState: BatchState;
  onUpdateState: (updates: Partial<BatchState>) => void;
}

export default function GenerationMethodStep({
  batchState,
  onUpdateState,
}: GenerationMethodStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobProgress, setJobProgress] = useState(0);
  const { toast } = useToast();

  const selectedIdeas = batchState.generatedIdeas?.filter(i => i.selected) || [];

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    onUpdateState({ generationMethod: "ai" });

    try {
      // Start batch generation job
      const response = await fetch("/api/batch/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideas: selectedIdeas,
          platforms: batchState.platforms,
          timeframe: batchState.timeframe,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start batch generation");
      }

      const data = await response.json();
      onUpdateState({ jobId: data.jobId });

      // Poll for job status
      pollJobStatus(data.jobId);
    } catch (error) {
      console.error("Error starting batch generation:", error);
      toast({
        title: "Generation Failed",
        description: "Could not start batch generation. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const MAX_POLL_ATTEMPTS = 120; // 2 minutes max
    const POLL_INTERVAL_MS = 1000; // 1 second
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/batch/jobs/${jobId}/status`);
        
        if (!response.ok) {
          throw new Error("Failed to get job status");
        }

        const data = await response.json();
        
        setJobProgress(data.progress || 0);

        if (data.status === "completed") {
          onUpdateState({ generatedItems: data.items });
          setIsGenerating(false);
          toast({
            title: "Generation Complete",
            description: `Successfully generated ${data.items?.length || 0} content items`,
          });
          return;
        }

        if (data.status === "failed") {
          throw new Error(data.error || "Job failed");
        }

        // Continue polling if still processing
        if (data.status === "processing" && attempts < MAX_POLL_ATTEMPTS) {
          attempts++;
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (error) {
        console.error("Error polling job status:", error);
        setIsGenerating(false);
        toast({
          title: "Job Monitoring Failed",
          description: "Lost connection to generation job. Please check the Review Board.",
          variant: "destructive",
        });
      }
    };

    poll();
  };

  const handleManualEntry = () => {
    onUpdateState({ 
      generationMethod: "manual",
      generatedItems: selectedIdeas.map(idea => ({
        id: idea.id,
        title: idea.title,
        format: idea.format,
        status: "draft",
        // Pre-populate with idea data
        script: "",
        caption: "",
      })),
    });

    toast({
      title: "Manual Entry Mode",
      description: "Ideas loaded as drafts. You can edit them in the Review Board.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Generation Method</h3>
        <p className="text-muted-foreground">
          Choose how you want to create your content
        </p>
      </div>

      {/* Progress Indicator */}
      {isGenerating && (
        <div className="space-y-4 p-6 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-medium">Generating content...</span>
          </div>
          <Progress value={jobProgress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {jobProgress}% complete • Processing {selectedIdeas.length} ideas
          </p>
        </div>
      )}

      {/* Method Cards */}
      {!isGenerating && !batchState.generationMethod && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-all border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wand2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">AI Generate All</CardTitle>
              <CardDescription className="text-base mt-2">
                Let AI automatically create scripts, captions, and hashtags for all selected ideas.
                Optimized for each platform with viral patterns and engagement tactics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Fully automated generation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Platform-optimized content</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Batch processing queue</span>
                </div>
              </div>
              <Button
                onClick={handleAIGenerate}
                className="w-full"
                size="lg"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-muted">
                  <Edit3 className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <CardTitle className="text-xl">Manual Entry</CardTitle>
              <CardDescription className="text-base mt-2">
                Pre-load selected ideas as drafts and manually write your own scripts and captions.
                Full creative control with guided templates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Complete creative control</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Ideas as draft templates</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Manual editing workflow</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleManualEntry}
                className="w-full"
                size="lg"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Method Selected */}
      {!isGenerating && batchState.generationMethod && (
        <Card className="border-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              {batchState.generationMethod === "ai" ? (
                <>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Wand2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-lg">AI Generation Selected</div>
                    <div className="text-sm text-muted-foreground">
                      Content will be automatically generated for {selectedIdeas.length} ideas
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-muted">
                    <Edit3 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium text-lg">Manual Entry Selected</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedIdeas.length} ideas loaded as draft templates
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm">
          <strong>Note:</strong> You can review, edit, and approve all generated content
          in the next step before scheduling or publishing.
        </p>
      </div>
    </div>
  );
}

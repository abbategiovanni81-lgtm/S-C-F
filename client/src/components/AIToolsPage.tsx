import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Eraser,
  Mic,
  Maximize,
  Palette,
  Scissors,
  PaintBucket,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  status?: "idle" | "processing" | "completed" | "failed";
}

export function AIToolsPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});
  const [results, setResults] = useState<{ [key: string]: any }>({});
  const { toast } = useToast();

  const tools: Tool[] = [
    {
      id: "face-swap",
      name: "Face Swap",
      description: "Swap faces between two images using AI",
      icon: Users,
      category: "image",
    },
    {
      id: "remove-bg",
      name: "Background Removal",
      description: "Remove background from images instantly",
      icon: Eraser,
      category: "image",
    },
    {
      id: "lip-sync",
      name: "Lip Sync",
      description: "Sync video to audio perfectly",
      icon: Mic,
      category: "video",
    },
    {
      id: "upscale",
      name: "Image Upscale",
      description: "Enhance image resolution up to 4x",
      icon: Maximize,
      category: "image",
    },
    {
      id: "style-transfer",
      name: "Style Transfer",
      description: "Apply artistic styles to your images",
      icon: Palette,
      category: "image",
    },
    {
      id: "inpaint",
      name: "Inpainting",
      description: "Remove objects or fill areas in images",
      icon: PaintBucket,
      category: "image",
    },
    {
      id: "outpaint",
      name: "Outpainting",
      description: "Expand images beyond their boundaries",
      icon: Scissors,
      category: "image",
    },
  ];

  const handleProcess = async (toolId: string, inputs: any) => {
    setProcessing({ ...processing, [toolId]: true });

    try {
      let endpoint = "";
      let body = {};

      switch (toolId) {
        case "face-swap":
          endpoint = "/api/ai-tools/face-swap";
          body = {
            sourceImageUrl: inputs.sourceImage,
            targetImageUrl: inputs.targetImage,
          };
          break;
        case "remove-bg":
          endpoint = "/api/ai-tools/remove-background";
          body = { imageUrl: inputs.imageUrl };
          break;
        case "lip-sync":
          endpoint = "/api/ai-tools/lip-sync";
          body = {
            videoUrl: inputs.videoUrl,
            audioUrl: inputs.audioUrl,
          };
          break;
        case "upscale":
          endpoint = "/api/ai-tools/upscale";
          body = {
            imageUrl: inputs.imageUrl,
            scale: inputs.scale || 4,
          };
          break;
        case "style-transfer":
          endpoint = "/api/ai-tools/style-transfer";
          body = {
            contentImageUrl: inputs.contentImage,
            styleImageUrl: inputs.styleImage,
          };
          break;
        case "inpaint":
          endpoint = "/api/ai-tools/inpaint";
          body = {
            imageUrl: inputs.imageUrl,
            maskUrl: inputs.maskUrl,
            prompt: inputs.prompt,
          };
          break;
        case "outpaint":
          endpoint = "/api/ai-tools/outpaint";
          body = {
            imageUrl: inputs.imageUrl,
            prompt: inputs.prompt,
            direction: inputs.direction,
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to process: ${response.statusText}`);
      }

      const data = await response.json();

      // For async operations, poll for status
      if (data.predictionId) {
        pollForResult(toolId, data.predictionId);
      } else {
        setResults({ ...results, [toolId]: data });
        toast({
          title: "Success",
          description: `${tools.find(t => t.id === toolId)?.name} completed`,
        });
      }
    } catch (error: any) {
      console.error(`${toolId} error:`, error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setProcessing({ ...processing, [toolId]: false });
    }
  };

  const pollForResult = async (toolId: string, predictionId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setProcessing({ ...processing, [toolId]: false });
        toast({
          title: "Timeout",
          description: "Processing took too long",
          variant: "destructive",
        });
        return;
      }

      try {
        const response = await fetch(`/api/ai-tools/status/${predictionId}`);
        const data = await response.json();

        if (data.status === "succeeded") {
          setResults({ ...results, [toolId]: data.output });
          setProcessing({ ...processing, [toolId]: false });
          toast({
            title: "Success",
            description: `${tools.find(t => t.id === toolId)?.name} completed`,
          });
        } else if (data.status === "failed") {
          setProcessing({ ...processing, [toolId]: false });
          toast({
            title: "Failed",
            description: data.error || "Processing failed",
            variant: "destructive",
          });
        } else {
          // Still processing, poll again
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch (error) {
        console.error("Polling error:", error);
        setProcessing({ ...processing, [toolId]: false });
      }
    };

    poll();
  };

  const renderToolCard = (tool: Tool) => {
    const Icon = tool.icon;
    const isProcessing = processing[tool.id];
    const result = results[tool.id];

    return (
      <Card
        key={tool.id}
        className={`cursor-pointer transition-all hover:shadow-lg ${
          selectedTool === tool.id ? "ring-2 ring-primary" : ""
        }`}
        onClick={() => setSelectedTool(tool.id)}
      >
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{tool.name}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Processing...</span>
            </div>
          ) : result ? (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Processing complete! Result is ready.
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                // Show input form
              }}
            >
              Use Tool
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const imageTools = tools.filter((t) => t.category === "image");
  const videoTools = tools.filter((t) => t.category === "video");

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🛠️ AI Tools</h1>
        <p className="text-muted-foreground">
          Standalone AI-powered tools for image and video editing
        </p>
      </div>

      <Tabs defaultValue="image" className="w-full">
        <TabsList>
          <TabsTrigger value="image">
            Image Tools ({imageTools.length})
          </TabsTrigger>
          <TabsTrigger value="video">
            Video Tools ({videoTools.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {imageTools.map(renderToolCard)}
          </div>
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videoTools.map(renderToolCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tool Usage Form */}
      {selectedTool && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {tools.find((t) => t.id === selectedTool)?.name}
            </CardTitle>
            <CardDescription>
              Configure and run the tool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedTool === "face-swap" && (
                <>
                  <div>
                    <Label>Source Face Image URL</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/face.jpg"
                    />
                  </div>
                  <div>
                    <Label>Target Image URL</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/target.jpg"
                    />
                  </div>
                </>
              )}
              {selectedTool === "remove-bg" && (
                <div>
                  <Label>Image URL</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}
              {selectedTool === "lip-sync" && (
                <>
                  <div>
                    <Label>Video URL</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  <div>
                    <Label>Audio URL</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/audio.mp3"
                    />
                  </div>
                </>
              )}
              <Button
                className="w-full"
                disabled={processing[selectedTool]}
              >
                {processing[selectedTool] ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run Tool
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

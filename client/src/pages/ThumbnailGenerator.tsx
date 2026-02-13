import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon, Sparkles, Download } from "lucide-react";

type ThumbnailStyle = "bold" | "minimal" | "cinematic" | "mrbeast";
type Platform = "youtube" | "instagram" | "tiktok";

interface ThumbnailResult {
  imageUrl: string;
  prompt: string;
}

const STYLE_OPTIONS: { value: ThumbnailStyle; label: string; description: string; icon: string }[] = [
  { value: "bold", label: "Bold", description: "Bright colors + large text", icon: "⚡" },
  { value: "minimal", label: "Minimal", description: "Clean + whitespace", icon: "✨" },
  { value: "cinematic", label: "Cinematic", description: "Dark + dramatic", icon: "🎬" },
  { value: "mrbeast", label: "MrBeast", description: "Shocked face + arrows", icon: "🤯" },
];

const PLATFORM_OPTIONS: { value: Platform; label: string; aspectRatio: string }[] = [
  { value: "youtube", label: "YouTube", aspectRatio: "16/9" },
  { value: "instagram", label: "Instagram", aspectRatio: "1/1" },
  { value: "tiktok", label: "TikTok", aspectRatio: "9/16" },
];

export default function ThumbnailGenerator() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState<ThumbnailStyle>("bold");
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [thumbnails, setThumbnails] = useState<ThumbnailResult[]>([]);

  const generateMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; style: ThumbnailStyle; platform: Platform }) => {
      const response = await apiRequest("POST", "/api/thumbnails/generate", data);
      return response.json() as Promise<ThumbnailResult>;
    },
    onSuccess: (data) => {
      setThumbnails([data]);
      toast({
        title: "Thumbnail generated!",
        description: "Your thumbnail has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate thumbnail",
        variant: "destructive",
      });
    },
  });

  const generateVariationsMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; style: ThumbnailStyle; platform: Platform }) => {
      // Generate 3 variations by adding slight variations to the description
      const variations = [
        { ...data, description: `${data.description} - variation 1 with different composition` },
        { ...data, description: `${data.description} - variation 2 with alternative angle` },
        { ...data, description: `${data.description} - variation 3 with unique perspective` },
      ];

      const results = await Promise.all(
        variations.map(async (variation) => {
          const response = await apiRequest("POST", "/api/thumbnails/generate", variation);
          return response.json() as Promise<ThumbnailResult>;
        })
      );

      return results;
    },
    onSuccess: (data) => {
      setThumbnails(data);
      toast({
        title: "Variations generated!",
        description: "3 thumbnail variations have been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate variations",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in both title and description",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate({ title, description, style, platform });
  };

  const handleGenerateVariations = () => {
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in both title and description",
        variant: "destructive",
      });
      return;
    }
    generateVariationsMutation.mutate({ title, description, style, platform });
  };

  const isGenerating = generateMutation.isPending || generateVariationsMutation.isPending;
  const selectedPlatformRatio = PLATFORM_OPTIONS.find(p => p.value === platform)?.aspectRatio || "16/9";

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">Thumbnail Generator</h1>
            <p className="text-muted-foreground">Create stunning thumbnails with AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Configure Your Thumbnail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter your thumbnail title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              {/* Description Textarea */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you want in the thumbnail"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isGenerating}
                  rows={4}
                />
              </div>

              {/* Style Selector */}
              <div className="space-y-2">
                <Label>Style</Label>
                <div className="grid grid-cols-2 gap-3">
                  {STYLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStyle(option.value)}
                      disabled={isGenerating}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-all
                        ${style === option.value
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                        }
                        ${isGenerating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Selector */}
              <div className="space-y-2">
                <Label>Platform</Label>
                <div className="grid grid-cols-3 gap-3">
                  {PLATFORM_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPlatform(option.value)}
                      disabled={isGenerating}
                      className={`
                        p-3 rounded-lg border-2 text-center transition-all
                        ${platform === option.value
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                        }
                        ${isGenerating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.aspectRatio}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Thumbnail
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleGenerateVariations}
                  disabled={isGenerating}
                  variant="outline"
                  className="flex-1"
                >
                  {generateVariationsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating 3...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generate 3 Variations
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Area */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="space-y-4">
                  {/* Loading Skeleton */}
                  <div
                    className="w-full bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center"
                    style={{ aspectRatio: selectedPlatformRatio, minHeight: "300px" }}
                  >
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-500" />
                      <p className="text-muted-foreground">Generating your thumbnail...</p>
                    </div>
                  </div>
                </div>
              ) : thumbnails.length > 0 ? (
                <div className="space-y-4">
                  {thumbnails.map((thumbnail, index) => (
                    <div key={index} className="space-y-2">
                      {thumbnails.length > 1 && (
                        <div className="text-sm font-semibold text-muted-foreground">
                          Variation {index + 1}
                        </div>
                      )}
                      <div
                        className="relative rounded-lg overflow-hidden border"
                        style={{ aspectRatio: selectedPlatformRatio }}
                      >
                        <img
                          src={thumbnail.imageUrl}
                          alt={`Generated thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = thumbnail.imageUrl;
                            link.download = `thumbnail-${index + 1}.png`;
                            link.click();
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="w-full bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed"
                  style={{ aspectRatio: selectedPlatformRatio, minHeight: "300px" }}
                >
                  <div className="text-center p-6">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-muted-foreground">
                      Your generated thumbnail will appear here
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

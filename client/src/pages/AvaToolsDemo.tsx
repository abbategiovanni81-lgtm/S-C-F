import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HookCards } from "@/components/ava/HookCards";
import { ScriptCard } from "@/components/ava/ScriptCard";
import { CaptionCards } from "@/components/ava/CaptionCards";
import { IdeaCards } from "@/components/ava/IdeaCards";
import { CarouselPreview } from "@/components/ava/CarouselPreview";

export default function AvaToolsDemo() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [activeTab, setActiveTab] = useState("hooks");

  // State for each tool
  const [hooks, setHooks] = useState<any[]>([]);
  const [script, setScript] = useState<any>(null);
  const [captions, setCaptions] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [carousel, setCarousel] = useState<any[]>([]);

  // Hooks mutation
  const hooksMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ hooks: any[] }>("/api/ava/generate-hooks", {
        method: "POST",
        body: JSON.stringify({ topic, platform, tone: "engaging" }),
      });
    },
    onSuccess: (data) => {
      setHooks(data.hooks);
      toast({ title: "Hooks Generated", description: "3 hook variations ready" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Script mutation
  const scriptMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ script: any }>("/api/ava/generate-script", {
        method: "POST",
        body: JSON.stringify({ topic, platform, length: "medium", tone: "engaging" }),
      });
    },
    onSuccess: (data) => {
      setScript(data.script);
      toast({ title: "Script Generated", description: "Full timed script ready" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Captions mutation
  const captionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ captions: any[] }>("/api/ava/generate-captions", {
        method: "POST",
        body: JSON.stringify({ 
          contentTopic: topic, 
          contentType: "video", 
          platform,
          includeHashtags: true 
        }),
      });
    },
    onSuccess: (data) => {
      setCaptions(data.captions);
      toast({ title: "Captions Generated", description: "3 caption variations ready" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Ideas mutation
  const ideasMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ ideas: any[] }>("/api/ava/generate-ideas", {
        method: "POST",
        body: JSON.stringify({ niche: topic, platform, count: 5 }),
      });
    },
    onSuccess: (data) => {
      setIdeas(data.ideas);
      toast({ title: "Ideas Generated", description: `${data.ideas.length} content ideas ready` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Carousel mutation
  const carouselMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ slides: any[] }>("/api/ava/generate-carousel", {
        method: "POST",
        body: JSON.stringify({ topic, slideCount: 5, tone: "professional" }),
      });
    },
    onSuccess: (data) => {
      setCarousel(data.slides);
      toast({ title: "Carousel Generated", description: `${data.slides.length} slides ready` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const generateContent = () => {
    if (!topic) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic",
        variant: "destructive",
      });
      return;
    }

    switch (activeTab) {
      case "hooks":
        hooksMutation.mutate();
        break;
      case "script":
        scriptMutation.mutate();
        break;
      case "captions":
        captionsMutation.mutate();
        break;
      case "ideas":
        ideasMutation.mutate();
        break;
      case "carousel":
        carouselMutation.mutate();
        break;
    }
  };

  const isLoading = 
    hooksMutation.isPending || 
    scriptMutation.isPending || 
    captionsMutation.isPending || 
    ideasMutation.isPending ||
    carouselMutation.isPending;

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-500" />
            Ava AI Tools Demo
          </h1>
          <p className="text-muted-foreground text-lg">
            Experience AI-powered content creation tools
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Configure your content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., productivity tips"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger id="platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={generateContent}
                  disabled={isLoading || !topic}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="hooks">Hooks</TabsTrigger>
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="captions">Captions</TabsTrigger>
                <TabsTrigger value="ideas">Ideas</TabsTrigger>
                <TabsTrigger value="carousel">Carousel</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="hooks">
                  {hooks.length > 0 ? (
                    <HookCards 
                      hooks={hooks} 
                      onRegenerate={() => hooksMutation.mutate()}
                      loading={hooksMutation.isPending}
                    />
                  ) : (
                    <Card className="border-dashed border-2">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">
                          Enter a topic and click Generate to create hooks
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="script">
                  {script ? (
                    <ScriptCard script={script} />
                  ) : (
                    <Card className="border-dashed border-2">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">
                          Enter a topic and click Generate to create a script
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="captions">
                  {captions.length > 0 ? (
                    <CaptionCards captions={captions} />
                  ) : (
                    <Card className="border-dashed border-2">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">
                          Enter a topic and click Generate to create captions
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="ideas">
                  {ideas.length > 0 ? (
                    <IdeaCards ideas={ideas} />
                  ) : (
                    <Card className="border-dashed border-2">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">
                          Enter a topic and click Generate to get content ideas
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="carousel">
                  {carousel.length > 0 ? (
                    <CarouselPreview slides={carousel} />
                  ) : (
                    <Card className="border-dashed border-2">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">
                          Enter a topic and click Generate to create carousel slides
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}

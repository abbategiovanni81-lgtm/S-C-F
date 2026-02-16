import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Link as LinkIcon, 
  Loader2, 
  LayoutGrid, 
  Video, 
  FileText, 
  MessageSquare,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface CarouselSlide {
  headline: string;
  subtext: string;
  imagePrompt: string;
}

interface ContentResponse {
  sourceUrl: string;
  sourceTitle: string;
  content: {
    carousel: {
      slides: CarouselSlide[];
      theme: string;
    };
    videoScript: {
      hook: string;
      body: string;
      cta: string;
    };
    blogPost: {
      title: string;
      excerpt: string;
      outline: string[];
    };
    socialCaptions: {
      instagram: string;
      twitter: string;
      linkedin: string;
      tiktok: string;
    };
  };
}

// Constants for sessionStorage keys
const PREFILL_CONTENT_KEY = "prefillContent";
const PREFILL_BLOG_KEY = "prefillBlog";

// Helper function to format video script
function formatVideoScript(videoScript: { hook: string; body: string; cta: string }): string {
  return `${videoScript.hook}\n\n${videoScript.body}\n\n${videoScript.cta}`;
}

export default function UrlToContent() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [url, setUrl] = useState("");
  const [generatedContent, setGeneratedContent] = useState<ContentResponse | null>(null);

  const generateMutation = useMutation({
    mutationFn: async (url: string) => {
      return await apiRequest<ContentResponse>("/api/ava/url-to-content", {
        method: "POST",
        body: JSON.stringify({ url }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({
        title: "Content generated!",
        description: "Your content ideas are ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(url);
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate(url);
  };

  const handleUseCarousel = () => {
    if (!generatedContent) return;
    
    // Navigate to content queue with carousel data
    const carouselData = {
      contentType: "carousel",
      slides: generatedContent.content.carousel.slides,
      caption: generatedContent.content.socialCaptions.instagram,
    };
    
    // Store in sessionStorage for the editor to pick up
    sessionStorage.setItem(PREFILL_CONTENT_KEY, JSON.stringify(carouselData));
    setLocation("/content-queue");
  };

  const handleUseVideoScript = () => {
    if (!generatedContent) return;
    
    const videoData = {
      contentType: "video",
      script: formatVideoScript(generatedContent.content.videoScript),
      caption: generatedContent.content.socialCaptions.instagram,
    };
    
    sessionStorage.setItem(PREFILL_CONTENT_KEY, JSON.stringify(videoData));
    setLocation("/content-queue");
  };

  const handleUseBlogPost = () => {
    if (!generatedContent) return;
    
    const blogData = {
      title: generatedContent.content.blogPost.title,
      summary: generatedContent.content.blogPost.excerpt,
      outline: generatedContent.content.blogPost.outline,
    };
    
    sessionStorage.setItem(PREFILL_BLOG_KEY, JSON.stringify(blogData));
    setLocation("/blog-studio");
  };

  const handleUseSocialCaptions = () => {
    if (!generatedContent) return;
    
    const socialData = {
      contentType: "social",
      captions: generatedContent.content.socialCaptions,
    };
    
    sessionStorage.setItem(PREFILL_CONTENT_KEY, JSON.stringify(socialData));
    setLocation("/content-queue");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-purple-500" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                URL to Content
              </h1>
            </div>
            <p className="text-slate-400 text-lg">
              Turn any webpage into multiple content ideas
            </p>
          </div>

          {/* Input Section */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Enter a URL</CardTitle>
              <CardDescription className="text-slate-400">
                Paste any webpage URL and we'll analyze it to generate content ideas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-slate-300">
                  Website URL
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/article"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                      disabled={generateMutation.isPending}
                      className="pl-10 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={generateMutation.isPending || !url.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze"
                    )}
                  </Button>
                </div>
              </div>

              {generateMutation.isPending && (
                <div className="flex items-center justify-center p-8 space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  <p className="text-slate-300 text-lg">Scanning page content...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Options Grid */}
          {generatedContent && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Content Ideas Ready
                </h2>
                <p className="text-slate-400">
                  From: <span className="text-purple-400">{generatedContent.sourceTitle}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Carousel Card */}
                <Card className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <LayoutGrid className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Carousel</CardTitle>
                        <CardDescription className="text-slate-400">
                          {generatedContent.content.carousel.slides.length} slides
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400 font-medium">Preview:</p>
                      {generatedContent.content.carousel.slides.slice(0, 2).map((slide, idx) => (
                        <div key={idx} className="p-2 bg-slate-900 rounded border border-slate-700">
                          <p className="text-sm font-medium text-white">{slide.headline}</p>
                          <p className="text-xs text-slate-400 mt-1">{slide.subtext}</p>
                        </div>
                      ))}
                      {generatedContent.content.carousel.slides.length > 2 && (
                        <p className="text-xs text-slate-500 text-center">
                          +{generatedContent.content.carousel.slides.length - 2} more slides
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleUseCarousel}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Use This
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Video Script Card */}
                <Card className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <Video className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Video Script</CardTitle>
                        <CardDescription className="text-slate-400">
                          30-60 second script
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="p-2 bg-slate-900 rounded border border-slate-700">
                        <p className="text-xs font-medium text-purple-400 mb-1">Hook</p>
                        <p className="text-sm text-white line-clamp-2">
                          {generatedContent.content.videoScript.hook}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-700">
                        <p className="text-xs font-medium text-purple-400 mb-1">Body</p>
                        <p className="text-sm text-white line-clamp-2">
                          {generatedContent.content.videoScript.body}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-700">
                        <p className="text-xs font-medium text-purple-400 mb-1">CTA</p>
                        <p className="text-sm text-white line-clamp-2">
                          {generatedContent.content.videoScript.cta}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleUseVideoScript}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Use This
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Blog Post Card */}
                <Card className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <FileText className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Blog Post</CardTitle>
                        <CardDescription className="text-slate-400">
                          Article outline
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="p-2 bg-slate-900 rounded border border-slate-700">
                        <p className="text-sm font-bold text-white line-clamp-2">
                          {generatedContent.content.blogPost.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                          {generatedContent.content.blogPost.excerpt}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-700">
                        <p className="text-xs font-medium text-purple-400 mb-1">Outline</p>
                        <ul className="space-y-1">
                          {generatedContent.content.blogPost.outline.slice(0, 3).map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-300 truncate">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <Button
                      onClick={handleUseBlogPost}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Use This
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Social Captions Card */}
                <Card className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <MessageSquare className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Social Captions</CardTitle>
                        <CardDescription className="text-slate-400">
                          Multi-platform captions
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="p-2 bg-slate-900 rounded border border-slate-700">
                        <p className="text-xs font-medium text-purple-400 mb-1">Instagram</p>
                        <p className="text-sm text-white line-clamp-2">
                          {generatedContent.content.socialCaptions.instagram}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-700">
                        <p className="text-xs font-medium text-purple-400 mb-1">LinkedIn</p>
                        <p className="text-sm text-white line-clamp-2">
                          {generatedContent.content.socialCaptions.linkedin}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-slate-900 rounded border border-slate-700">
                          <p className="text-xs font-medium text-purple-400 mb-1">Twitter</p>
                          <p className="text-xs text-white line-clamp-2">
                            {generatedContent.content.socialCaptions.twitter}
                          </p>
                        </div>
                        <div className="p-2 bg-slate-900 rounded border border-slate-700">
                          <p className="text-xs font-medium text-purple-400 mb-1">TikTok</p>
                          <p className="text-xs text-white line-clamp-2">
                            {generatedContent.content.socialCaptions.tiktok}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleUseSocialCaptions}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Use This
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Link as LinkIcon, Video, Image as ImageIcon, ArrowRight, BarChart2, Target, Lightbulb, CheckCircle, AlertCircle, X, Wand2, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { GeneratedContent } from "@shared/schema";

interface ContentMetadata {
  platform: "youtube" | "tiktok" | "instagram";
  title: string;
  description: string;
  caption?: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  channelTitle: string;
  authorHandle?: string;
  publishedAt: string;
}

interface ComparisonResult {
  similarityScore: number;
  predictedViewRange: { min: number; max: number };
  hookStrength: { score: number; feedback: string };
  visualStyleMatch: { score: number; feedback: string };
  structureAlignment: { score: number; feedback: string };
  captionStrategy: { score: number; feedback: string };
  improvements: string[];
  strengths: string[];
}

export default function ContentComparison() {
  const { toast } = useToast();
  
  const [yourContentSource, setYourContentSource] = useState<"editmerge" | "url">("editmerge");
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [yourUrl, setYourUrl] = useState("");
  const [yourScreenshots, setYourScreenshots] = useState<File[]>([]);
  const [yourScreenshotPreviews, setYourScreenshotPreviews] = useState<string[]>([]);
  
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorScreenshots, setCompetitorScreenshots] = useState<File[]>([]);
  const [competitorScreenshotPreviews, setCompetitorScreenshotPreviews] = useState<string[]>([]);
  
  const [competitorMetadata, setCompetitorMetadata] = useState<ContentMetadata | null>(null);
  const [yourMetadata, setYourMetadata] = useState<ContentMetadata | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  const { data: editMergeContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=approved"],
  });

  const { data: readyContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=ready"],
  });

  const allContent = [...editMergeContent, ...readyContent];

  // Detect platform from URL
  const detectPlatform = (url: string): "youtube" | "tiktok" | "instagram" | null => {
    if (/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(url)) return "youtube";
    if (/tiktok\.com/.test(url)) return "tiktok";
    if (/instagram\.com/.test(url)) return "instagram";
    return null;
  };

  const isValidUrl = (url: string) => detectPlatform(url) !== null;

  const fetchContentMetaMutation = useMutation({
    mutationFn: async ({ url, side }: { url: string; side: "your" | "competitor" }) => {
      const platform = detectPlatform(url);
      
      if (platform === "youtube") {
        const res = await fetch("/api/youtube/fetch-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ url }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to fetch video metadata");
        }
        const data = await res.json();
        return { 
          data: { ...data, platform: "youtube" as const }, 
          side 
        };
      } else {
        // TikTok or Instagram - use scrape-post endpoint
        const res = await fetch("/api/scrape-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ url }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to scrape post");
        }
        const result = await res.json();
        const scraped = result.scrapedData;
        return { 
          data: {
            platform: scraped.platform as "tiktok" | "instagram",
            title: scraped.caption?.substring(0, 100) || "Post",
            description: scraped.caption || "",
            caption: scraped.caption,
            thumbnailUrl: scraped.thumbnailUrl || "",
            viewCount: scraped.views || 0,
            likeCount: scraped.likes || 0,
            commentCount: scraped.comments || 0,
            shareCount: scraped.shares,
            channelTitle: scraped.author || scraped.authorHandle,
            authorHandle: scraped.authorHandle,
            publishedAt: scraped.postedAt || "",
          } as ContentMetadata, 
          side 
        };
      }
    },
    onSuccess: ({ data, side }) => {
      if (side === "competitor") {
        setCompetitorMetadata(data);
      } else {
        setYourMetadata(data);
      }
      toast({ title: `${data.platform === "youtube" ? "Video" : "Post"} metadata fetched!` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to fetch metadata", description: error.message, variant: "destructive" });
    },
  });

  const compareMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      
      if (yourContentSource === "editmerge" && selectedContentId) {
        formData.append("yourContentId", selectedContentId);
      } else if (yourContentSource === "url") {
        // Only send URL if it's valid
        if (isValidUrl(yourUrl)) formData.append("yourUrl", yourUrl);
        yourScreenshots.forEach((file, i) => {
          formData.append(`yourScreenshot${i}`, file);
        });
      }
      
      // Only send competitor URL if it's valid
      if (isValidUrl(competitorUrl)) formData.append("competitorUrl", competitorUrl);
      competitorScreenshots.forEach((file, i) => {
        formData.append(`competitorScreenshot${i}`, file);
      });
      
      const res = await fetch("/api/content/compare", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Comparison failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setComparisonResult(data);
      toast({ title: "Comparison complete!" });
    },
    onError: (error: Error) => {
      toast({ title: "Comparison failed", description: error.message, variant: "destructive" });
    },
  });

  const handleScreenshotUpload = (files: FileList | null, side: "your" | "competitor") => {
    if (!files) return;
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    
    if (side === "your") {
      setYourScreenshots(prev => [...prev, ...newFiles]);
      setYourScreenshotPreviews(prev => [...prev, ...newPreviews]);
    } else {
      setCompetitorScreenshots(prev => [...prev, ...newFiles]);
      setCompetitorScreenshotPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeScreenshot = (index: number, side: "your" | "competitor") => {
    if (side === "your") {
      setYourScreenshots(prev => prev.filter((_, i) => i !== index));
      setYourScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      setCompetitorScreenshots(prev => prev.filter((_, i) => i !== index));
      setCompetitorScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const selectedContent = allContent.find(c => c.id === selectedContentId);

  const canCompare = () => {
    const hasYourContent = yourContentSource === "editmerge" 
      ? !!selectedContentId 
      : (!!yourUrl || yourScreenshots.length > 0);
    const hasCompetitor = !!competitorUrl || competitorScreenshots.length > 0;
    return hasYourContent && hasCompetitor;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <Layout title="Content Comparison">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title">Content Comparison</h1>
            <p className="text-muted-foreground">Compare your content against viral competitors to improve before posting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Your Content
              </CardTitle>
              <CardDescription>Select from Edit & Merge or paste URL of posted content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={yourContentSource} onValueChange={(v) => setYourContentSource(v as "editmerge" | "url")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="editmerge" data-testid="tab-editmerge">From Edit & Merge</TabsTrigger>
                  <TabsTrigger value="url" data-testid="tab-url">Posted Content (URL)</TabsTrigger>
                </TabsList>
                
                <TabsContent value="editmerge" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Select Content</Label>
                    <Select value={selectedContentId} onValueChange={setSelectedContentId}>
                      <SelectTrigger data-testid="select-content">
                        <SelectValue placeholder="Choose content from Edit & Merge..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allContent.map((content) => (
                          <SelectItem key={content.id} value={content.id}>
                            {content.script?.substring(0, 50) || content.caption?.substring(0, 50) || `Content ${content.id.substring(0, 8)}`}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedContent && (
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <Badge variant="outline">{selectedContent.status}</Badge>
                      <p className="text-sm font-medium">{selectedContent.script?.substring(0, 100) || selectedContent.caption?.substring(0, 100)}...</p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedContent.platforms.map(p => (
                          <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="url" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>YouTube, TikTok, or Instagram URL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://youtube.com/watch?v=... or tiktok.com/..."
                        value={yourUrl}
                        onChange={(e) => setYourUrl(e.target.value)}
                        data-testid="input-your-url"
                      />
                      <ResponsiveTooltip content="Fetch metadata">
                        <Button
                          variant="outline"
                          onClick={() => fetchContentMetaMutation.mutate({ url: yourUrl, side: "your" })}
                          disabled={!yourUrl || fetchContentMetaMutation.isPending}
                          data-testid="button-fetch-your-meta"
                        >
                          {fetchContentMetaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                        </Button>
                      </ResponsiveTooltip>
                    </div>
                  </div>
                  
                  {yourMetadata && (
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="capitalize">{yourMetadata.platform}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {yourMetadata.authorHandle ? `@${yourMetadata.authorHandle}` : yourMetadata.channelTitle}
                        </span>
                      </div>
                      {yourMetadata.thumbnailUrl && (
                        <img src={yourMetadata.thumbnailUrl} alt="Thumbnail" className="rounded-lg w-full max-h-32 object-cover" />
                      )}
                      <p className="text-sm font-medium line-clamp-2">
                        {yourMetadata.platform === "youtube" ? yourMetadata.title : (yourMetadata.caption?.substring(0, 100) || yourMetadata.title)}
                      </p>
                      <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                        {yourMetadata.viewCount > 0 && <span>{yourMetadata.viewCount.toLocaleString()} views</span>}
                        <span>{yourMetadata.likeCount.toLocaleString()} likes</span>
                        <span>{yourMetadata.commentCount.toLocaleString()} comments</span>
                        {yourMetadata.shareCount && yourMetadata.shareCount > 0 && (
                          <span>{yourMetadata.shareCount.toLocaleString()} shares</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Screenshots (optional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {yourScreenshotPreviews.map((preview, i) => (
                        <div key={i} className="relative">
                          <img src={preview} alt={`Screenshot ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
                          <button
                            onClick={() => removeScreenshot(i, "your")}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleScreenshotUpload(e.target.files, "your")}
                          data-testid="input-your-screenshots"
                        />
                      </label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-orange-500" />
                Competitor / Viral Content
              </CardTitle>
              <CardDescription>Paste YouTube, TikTok, or Instagram URL and/or upload screenshots</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Video/Post URL</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://youtube.com/... or tiktok.com/... or instagram.com/..."
                    value={competitorUrl}
                    onChange={(e) => setCompetitorUrl(e.target.value)}
                    data-testid="input-competitor-url"
                  />
                  <ResponsiveTooltip content="Fetch metadata">
                    <Button
                      variant="outline"
                      onClick={() => fetchContentMetaMutation.mutate({ url: competitorUrl, side: "competitor" })}
                      disabled={!competitorUrl || fetchContentMetaMutation.isPending}
                      data-testid="button-fetch-competitor-meta"
                    >
                      {fetchContentMetaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                    </Button>
                  </ResponsiveTooltip>
                </div>
              </div>
              
              {competitorMetadata && (
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 space-y-2 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="capitalize">{competitorMetadata.platform}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {competitorMetadata.authorHandle ? `@${competitorMetadata.authorHandle}` : competitorMetadata.channelTitle}
                    </span>
                  </div>
                  {competitorMetadata.thumbnailUrl && (
                    <img src={competitorMetadata.thumbnailUrl} alt="Thumbnail" className="rounded-lg w-full max-h-32 object-cover" />
                  )}
                  <p className="text-sm font-medium line-clamp-2">
                    {competitorMetadata.platform === "youtube" ? competitorMetadata.title : (competitorMetadata.caption?.substring(0, 100) || competitorMetadata.title)}
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                    {competitorMetadata.viewCount > 0 && (
                      <span className="font-semibold text-orange-600">{competitorMetadata.viewCount.toLocaleString()} views</span>
                    )}
                    <span>{competitorMetadata.likeCount.toLocaleString()} likes</span>
                    <span>{competitorMetadata.commentCount.toLocaleString()} comments</span>
                    {competitorMetadata.shareCount && competitorMetadata.shareCount > 0 && (
                      <span>{competitorMetadata.shareCount.toLocaleString()} shares</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Screenshots (for visual analysis)</Label>
                <p className="text-xs text-muted-foreground">Upload key moments from the video for deeper analysis</p>
                <div className="flex flex-wrap gap-2">
                  {competitorScreenshotPreviews.map((preview, i) => (
                    <div key={i} className="relative">
                      <img src={preview} alt={`Screenshot ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
                      <button
                        onClick={() => removeScreenshot(i, "competitor")}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleScreenshotUpload(e.target.files, "competitor")}
                      data-testid="input-competitor-screenshots"
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <ResponsiveTooltip content="Compare content">
            <Button
              size="lg"
              onClick={() => compareMutation.mutate()}
              disabled={!canCompare() || compareMutation.isPending}
              className="gap-2 px-8"
              data-testid="button-compare"
            >
              {compareMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Compare Content
                </>
              )}
            </Button>
          </ResponsiveTooltip>
        </div>

        {comparisonResult && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Comparison Results
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Overall Score:</span>
                  <Badge variant={getScoreBadgeVariant(comparisonResult.similarityScore)} className="text-lg px-3 py-1">
                    {comparisonResult.similarityScore}%
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Predicted view range: {comparisonResult.predictedViewRange.min.toLocaleString()} - {comparisonResult.predictedViewRange.max.toLocaleString()} views
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Hook Strength", ...comparisonResult.hookStrength },
                  { label: "Visual Style", ...comparisonResult.visualStyleMatch },
                  { label: "Structure", ...comparisonResult.structureAlignment },
                  { label: "Caption Strategy", ...comparisonResult.captionStrategy },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className={`text-lg font-bold ${getScoreColor(item.score)}`}>{item.score}%</span>
                    </div>
                    <Progress value={item.score} className="h-2" />
                    <p className="text-xs text-muted-foreground">{item.feedback}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {comparisonResult.strengths.map((strength, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    Suggested Improvements
                  </h4>
                  <ul className="space-y-2">
                    {comparisonResult.improvements.map((improvement, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Generate Content from Comparison */}
              <div className="pt-4 border-t space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-primary" />
                  Create Content Using These Insights
                </h4>
                <p className="text-sm text-muted-foreground">
                  Use the strengths and improvements from this comparison to generate new content
                </p>
                <div className="flex gap-3">
                  <Link href="/content-queue">
                    <ResponsiveTooltip content="Generate content">
                      <Button className="gap-2" data-testid="button-generate-from-comparison">
                        <Wand2 className="w-4 h-4" />
                        Generate Video/Image Content
                      </Button>
                    </ResponsiveTooltip>
                  </Link>
                  <Link href="/blog-studio">
                    <ResponsiveTooltip content="Create blog post">
                      <Button variant="outline" className="gap-2" data-testid="button-blog-from-comparison">
                        <BookOpen className="w-4 h-4" />
                        Create Blog Post
                      </Button>
                    </ResponsiveTooltip>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

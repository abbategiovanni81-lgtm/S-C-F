import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, Wand2, Loader2, Save, Send, Image as ImageIcon, 
  Hash, Type, Link as LinkIcon, Sparkles, ArrowLeft
} from "lucide-react";
import type { BrandBrief, GeneratedContent } from "@shared/schema";

const DEMO_USER_ID = "demo-user";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export default function BlogStudio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const params = useParams<{ sourceType?: string; sourceId?: string }>();

  const [selectedBriefId, setSelectedBriefId] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  const [blogTitle, setBlogTitle] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogSummary, setBlogSummary] = useState("");
  const [blogBody, setBlogBody] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");

  const { data: briefs = [] } = useQuery<BrandBrief[]>({
    queryKey: [`/api/brand-briefs?userId=${DEMO_USER_ID}`],
  });

  // Fetch from content-analysis/videos endpoint (where scraped videos are stored)
  const { data: analyzedContent = [] } = useQuery<any[]>({
    queryKey: ["/api/content-analysis/videos"],
  });

  useEffect(() => {
    if (briefs.length > 0 && !selectedBriefId) {
      setSelectedBriefId(briefs[0].id);
    }
  }, [briefs, selectedBriefId]);

  useEffect(() => {
    if (blogTitle && !blogSlug) {
      setBlogSlug(slugify(blogTitle));
    }
  }, [blogTitle, blogSlug]);

  useEffect(() => {
    if (params.sourceType && params.sourceId && analyzedContent.length > 0) {
      const source = analyzedContent.find(c => c.id === params.sourceId);
      if (source) {
        setTopic(`Convert this viral content to a blog: ${source.title || source.url || 'Analyzed content'}`);
        toast({ title: "Source content loaded", description: "AI will use this as inspiration for your blog." });
      }
    }
  }, [params.sourceType, params.sourceId, analyzedContent, toast]);

  const generateBlogMutation = useMutation({
    mutationFn: async (data: { briefId: string; topic: string; sourceId?: string }) => {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate blog");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setBlogTitle(data.title || "");
      setBlogSlug(slugify(data.title || ""));
      setBlogSummary(data.summary || "");
      setBlogBody(data.body || "");
      setMetaDescription(data.metaDescription || "");
      setMetaKeywords(data.metaKeywords || "");
      toast({ title: "Blog generated!", description: "Review and edit the content below." });
    },
    onError: (error: Error) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    },
  });

  const saveBlogMutation = useMutation({
    mutationFn: async (data: { status: "draft" | "ready" }) => {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefId: selectedBriefId,
          contentType: "blog",
          status: data.status,
          platforms: ["blog"],
          blogTitle,
          blogSlug,
          blogSummary,
          blogBody,
          blogMetaDescription: metaDescription,
          blogMetaKeywords: metaKeywords,
          blogHeroImageUrl: heroImageUrl,
          generationMetadata: {
            contentFormat: "blog",
            topic,
            sourceId: params.sourceId,
            sourceType: params.sourceType,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save blog");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({ 
        title: variables.status === "draft" ? "Saved as draft" : "Blog created!", 
        description: variables.status === "ready" ? "Your blog is ready to use." : "You can continue editing later."
      });
      if (variables.status === "ready") {
        setLocation("/ready-to-post");
      }
    },
    onError: (error: Error) => {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!selectedBriefId || !topic) {
      toast({ title: "Please select a brand and enter a topic", variant: "destructive" });
      return;
    }
    generateBlogMutation.mutate({ 
      briefId: selectedBriefId, 
      topic,
      sourceId: params.sourceId 
    });
  };

  const selectedBrief = briefs.find(b => b.id === selectedBriefId);

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/content-queue")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">Blog Studio</h1>
              <p className="text-muted-foreground">Create AI-generated blog posts for your brand</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Generate Blog
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Brand Brief</Label>
                <Select value={selectedBriefId} onValueChange={setSelectedBriefId}>
                  <SelectTrigger data-testid="select-brief">
                    <SelectValue placeholder="Select brand..." />
                  </SelectTrigger>
                  <SelectContent>
                    {briefs.map(brief => (
                      <SelectItem key={brief.id} value={brief.id}>{brief.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBrief && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Voice: {selectedBrief.brandVoice?.slice(0, 50)}...
                  </p>
                )}
              </div>

              <div>
                <Label>Topic / Prompt</Label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter a topic or describe what the blog should be about..."
                  rows={4}
                  data-testid="input-topic"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  AI will generate a full blog post based on your brand voice and this topic.
                </p>
              </div>

              {params.sourceId && (
                <Badge variant="secondary" className="w-full justify-center">
                  <LinkIcon className="w-3 h-3 mr-1" /> Using analyzed content as source
                </Badge>
              )}

              <Button
                onClick={handleGenerate}
                disabled={generateBlogMutation.isPending || !selectedBriefId || !topic}
                className="w-full"
                data-testid="button-generate"
              >
                {generateBlogMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="w-4 h-4 mr-2" /> Generate Blog with AI</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Blog Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={blogTitle}
                    onChange={(e) => {
                      setBlogTitle(e.target.value);
                      if (!blogSlug) setBlogSlug(slugify(e.target.value));
                    }}
                    placeholder="Enter post title"
                    data-testid="input-title"
                  />
                </div>
                <div>
                  <Label>URL Slug</Label>
                  <Input
                    value={blogSlug}
                    onChange={(e) => setBlogSlug(e.target.value)}
                    placeholder="auto-generated-from-title"
                    data-testid="input-slug"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Will appear as /blog/{blogSlug || "your-slug"}
                  </p>
                </div>
              </div>

              <div>
                <Label>Summary</Label>
                <Textarea
                  value={blogSummary}
                  onChange={(e) => setBlogSummary(e.target.value)}
                  placeholder="Brief description for listings..."
                  rows={2}
                  data-testid="input-summary"
                />
              </div>

              <div>
                <Label>Content (Markdown)</Label>
                <Textarea
                  value={blogBody}
                  onChange={(e) => setBlogBody(e.target.value)}
                  placeholder="Write your content in Markdown..."
                  rows={12}
                  className="font-mono text-sm"
                  data-testid="input-body"
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">SEO Meta Tags</h4>
                <div>
                  <Label>Meta Description</Label>
                  <Textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="SEO description for search results (150-160 chars)"
                    rows={2}
                    maxLength={160}
                    data-testid="input-meta-description"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {metaDescription.length}/160 characters
                  </p>
                </div>

                <div>
                  <Label>Meta Keywords</Label>
                  <Input
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                    data-testid="input-meta-keywords"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated keywords</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Hero Image</h4>
                <div>
                  <Label>Image URL</Label>
                  <Input
                    value={heroImageUrl}
                    onChange={(e) => setHeroImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    data-testid="input-hero-image"
                  />
                </div>
                {heroImageUrl && (
                  <div className="mt-2 aspect-video bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={heroImageUrl} 
                      alt="Hero preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/content-queue")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => saveBlogMutation.mutate({ status: "draft" })}
                  disabled={!blogTitle || saveBlogMutation.isPending}
                  data-testid="button-save-draft"
                >
                  <Save className="w-4 h-4 mr-2" /> Save as Draft
                </Button>
                <Button
                  onClick={() => saveBlogMutation.mutate({ status: "ready" })}
                  disabled={!blogTitle || !blogBody || saveBlogMutation.isPending}
                  data-testid="button-create-post"
                >
                  <Send className="w-4 h-4 mr-2" /> Create Post
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

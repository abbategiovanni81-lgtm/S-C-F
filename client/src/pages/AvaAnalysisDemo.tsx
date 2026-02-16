import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, GitCompare } from "lucide-react";
import type { AnalysisCardProps } from "@/components/ava/AnalysisCard";
import type { ComparisonCardProps } from "@/components/ava/ComparisonCard";

export default function AvaAnalysisDemo() {
  const { toast } = useToast();
  const [hook, setHook] = useState("Stop scrolling! This will change everything you know about AI");
  const [script, setScript] = useState("In this post, I'll show you 3 mind-blowing AI tools that will 10x your productivity. First, ChatGPT for content creation. Second, Midjourney for stunning visuals. Third, Eleven Labs for voice overs. Try them now!");
  const [caption, setCaption] = useState("3 AI tools that changed my workflow forever 🚀 #AI #productivity");
  const [hashtags, setHashtags] = useState("AI,productivity,tools");

  const analyzeContentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ava/analyze-content", {
        content: {
          hook,
          script,
          caption,
          hashtags: hashtags.split(",").map(h => h.trim()),
          platform: "Instagram",
          contentFormat: "reel",
        },
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Analysis complete!" });
      
      // Trigger Ava chat to open and display the analysis
      const avaChat = (window as any).avaChat;
      if (avaChat && typeof avaChat.addAnalysisMessage === 'function') {
        avaChat.addAnalysisMessage(data as AnalysisCardProps);
        avaChat.openChat();
      } else {
        toast({ 
          title: "Chat not available", 
          description: "Please refresh the page and try again",
          variant: "destructive" 
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Analysis failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const compareContentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ava/compare-own-content", {
        yourContent: {
          hook,
          script,
          caption,
          hashtags: hashtags.split(",").map(h => h.trim()),
          platform: "Instagram",
          contentFormat: "reel",
        },
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Comparison complete!" });
      
      // Trigger Ava chat to open and display the comparison
      const avaChat = (window as any).avaChat;
      if (avaChat && typeof avaChat.addComparisonMessage === 'function') {
        const comparisonData: ComparisonCardProps = {
          ...data,
          comparisonType: "own" as const,
        };
        avaChat.addComparisonMessage(comparisonData);
        avaChat.openChat();
      } else {
        toast({ 
          title: "Chat not available", 
          description: "Please refresh the page and try again",
          variant: "destructive" 
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Comparison failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Ava Content Analysis Demo</h1>
            <p className="text-muted-foreground mt-2">
              Test the new Ava content analysis and comparison features
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Content</CardTitle>
              <CardDescription>
                Edit the content below and click "Analyze" or "Compare" to see Ava's insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hook">Hook</Label>
                <Input
                  id="hook"
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  placeholder="Enter your hook..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="script">Script/Body</Label>
                <Textarea
                  id="script"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Enter your script..."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Enter your caption..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
                <Input
                  id="hashtags"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="e.g., AI,productivity,tools"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => analyzeContentMutation.mutate()}
                  disabled={analyzeContentMutation.isPending}
                  className="flex-1"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {analyzeContentMutation.isPending ? "Analyzing..." : "Analyze Content"}
                </Button>

                <Button
                  onClick={() => compareContentMutation.mutate()}
                  disabled={compareContentMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  <GitCompare className="h-4 w-4 mr-2" />
                  {compareContentMutation.isPending ? "Comparing..." : "Compare to Top Posts"}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center pt-2">
                Results will appear in the Ava chat window
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong className="text-primary">Analyze Content:</strong>
                <p className="text-muted-foreground mt-1">
                  Ava analyzes your content and provides a viral potential score (0-10), 
                  plus scores for Hook, Body, Visual, and Competitive aspects. You'll get 
                  actionable suggestions and see strengths/improvements.
                </p>
              </div>
              <div>
                <strong className="text-primary">Compare to Top Posts:</strong>
                <p className="text-muted-foreground mt-1">
                  Ava compares your content against your top-performing posts (or competitors). 
                  See side-by-side scores with green/red arrows showing differences, plus 
                  specific steps to improve.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

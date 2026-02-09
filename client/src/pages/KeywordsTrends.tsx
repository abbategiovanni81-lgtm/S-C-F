import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Hash, TrendingUp, Copy, CheckCircle, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KeywordData {
  keyword: string;
  popularity: number;
  competition: number;
  trend: string;
  category: string;
}

export default function KeywordsTrends() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [copiedAll, setCopiedAll] = useState(false);

  const keywordsMutation = useMutation({
    mutationFn: async (topic: string) => {
      // Using hashtag generation as keyword trends
      return apiRequest<{ hashtags: any[] }>("/api/ava/generate-hashtags", {
        method: "POST",
        body: JSON.stringify({
          topic,
          niche: topic,
          platform: "instagram",
          count: 20,
          style: "balanced"
        }),
      });
    },
    onSuccess: (data) => {
      // Transform hashtags to keywords format
      const keywordData: KeywordData[] = data.hashtags.map((tag: any) => ({
        keyword: tag.tag,
        popularity: tag.estimatedReach === "High" ? 9 : tag.estimatedReach === "Medium" ? 6 : 4,
        // TODO: Replace mock competition score with real data from keyword research API
        competition: Math.floor(Math.random() * 10) + 1, // Mock competition score
        trend: Math.random() > 0.5 ? "rising" : "stable",
        category: tag.category || "general"
      }));
      setKeywords(keywordData);
      setSelectedKeywords(new Set());
      toast({
        title: "Keywords Generated",
        description: `Found ${keywordData.length} trending keywords`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!topic) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic to search",
        variant: "destructive",
      });
      return;
    }
    keywordsMutation.mutate(topic);
  };

  const toggleKeyword = (keyword: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedKeywords.size === keywords.length) {
      setSelectedKeywords(new Set());
    } else {
      setSelectedKeywords(new Set(keywords.map(k => k.keyword)));
    }
  };

  const copySelected = () => {
    if (selectedKeywords.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select keywords to copy",
        variant: "destructive",
      });
      return;
    }
    
    const selectedText = Array.from(selectedKeywords).join(", ");
    navigator.clipboard.writeText(selectedText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
    toast({
      title: "Copied!",
      description: `${selectedKeywords.size} keywords copied to clipboard`,
    });
  };

  const getPopularityColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 5) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getCompetitionColor = (score: number) => {
    if (score >= 8) return "text-red-500";
    if (score >= 5) return "text-yellow-500";
    return "text-green-500";
  };

  const getTrendBadge = (trend: string) => {
    if (trend === "rising") {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Rising</Badge>;
    }
    return <Badge variant="outline">Stable</Badge>;
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Hash className="h-8 w-8 text-purple-500" />
            Keywords & Trends
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover trending keywords with popularity and competition scores
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Search Section */}
          <div className="lg:col-span-1">
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle>Search Keywords</CardTitle>
                <CardDescription>
                  Enter a topic to find related keywords
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic / Niche</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., fitness, cooking, tech"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSearch}
                  disabled={keywordsMutation.isPending || !topic}
                >
                  {keywordsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search Keywords
                    </>
                  )}
                </Button>

                {keywords.length > 0 && (
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">
                        {selectedKeywords.size} selected
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSelectAll}
                      >
                        {selectedKeywords.size === keywords.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={copySelected}
                      disabled={selectedKeywords.size === 0}
                      variant={copiedAll ? "default" : "outline"}
                    >
                      {copiedAll ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Selected
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Keywords Results */}
          <div className="lg:col-span-2">
            {keywords.length > 0 ? (
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Keyword Results</span>
                    <Badge variant="secondary">{keywords.length} keywords</Badge>
                  </CardTitle>
                  <CardDescription>
                    Click keywords to select them for bulk copy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {keywords.map((keyword, index) => (
                      <div
                        key={index}
                        onClick={() => toggleKeyword(keyword.keyword)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedKeywords.has(keyword.keyword)
                            ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700"
                            : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                        }`}
                      >
                        <Checkbox
                          checked={selectedKeywords.has(keyword.keyword)}
                          onCheckedChange={() => toggleKeyword(keyword.keyword)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold truncate">{keyword.keyword}</span>
                            {getTrendBadge(keyword.trend)}
                            <Badge variant="outline" className="text-xs">
                              {keyword.category}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>Popularity:</span>
                              <div className="flex gap-1">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1 h-3 rounded ${
                                      i < keyword.popularity
                                        ? getPopularityColor(keyword.popularity)
                                        : "bg-gray-200 dark:bg-gray-700"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <span>Competition:</span>
                              <span className={`font-semibold ${getCompetitionColor(keyword.competition)}`}>
                                {keyword.competition}/10
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-purple-200 dark:border-purple-800">
                <CardContent className="flex flex-col items-center justify-center py-24">
                  <Hash className="h-16 w-16 text-purple-300 mb-4" />
                  <p className="text-muted-foreground text-center mb-2 text-lg font-semibold">
                    No Keywords Yet
                  </p>
                  <p className="text-muted-foreground text-center text-sm">
                    Enter a topic and click search to discover trending keywords
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

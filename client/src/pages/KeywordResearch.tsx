import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  TrendingUp, 
  MessageCircle, 
  Brain,
  Download,
  RefreshCw,
  Filter,
  BarChart3
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface KeywordCluster {
  topic: string;
  volume: number;
  questions: string[];
  difficulty: "easy" | "medium" | "hard";
  trend: "rising" | "stable" | "declining";
}

interface BrandMention {
  brand: string;
  mentions: number;
  sentiment: "positive" | "neutral" | "negative";
  context: string[];
}

export default function KeywordResearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("keywords");
  
  const mockKeywordClusters: KeywordCluster[] = [
    {
      topic: "Weight Loss Tips",
      volume: 12400,
      questions: [
        "What are the best weight loss tips for beginners?",
        "How to lose weight without exercise?",
        "What foods help with weight loss?",
        "How long does it take to see weight loss results?",
      ],
      difficulty: "medium",
      trend: "rising",
    },
    {
      topic: "Healthy Diet Plans",
      volume: 8900,
      questions: [
        "What is the best diet plan for weight loss?",
        "How to start a healthy diet?",
        "What are healthy meal prep ideas?",
      ],
      difficulty: "hard",
      trend: "stable",
    },
    {
      topic: "Home Workouts",
      volume: 15200,
      questions: [
        "What are effective home workouts?",
        "How to workout at home without equipment?",
        "What are the best home workout routines?",
        "How long should home workouts be?",
      ],
      difficulty: "easy",
      trend: "rising",
    },
  ];

  const mockBrandMentions: BrandMention[] = [
    {
      brand: "Nike",
      mentions: 234,
      sentiment: "positive",
      context: [
        "Best workout shoes for running",
        "Nike training app recommendations",
        "Quality athletic wear brands",
      ],
    },
    {
      brand: "Peloton",
      mentions: 156,
      sentiment: "neutral",
      context: [
        "Home fitness equipment comparison",
        "Is Peloton worth the price?",
        "Alternatives to expensive fitness equipment",
      ],
    },
    {
      brand: "MyFitnessPal",
      mentions: 89,
      sentiment: "positive",
      context: [
        "Best calorie tracking apps",
        "Free fitness tracking tools",
        "How to track macros effectively",
      ],
    },
  ];

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 2000);
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "easy") return "bg-green-900/30 text-green-400 border-green-700";
    if (difficulty === "medium") return "bg-yellow-900/30 text-yellow-400 border-yellow-700";
    return "bg-red-900/30 text-red-400 border-red-700";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "rising") return "↗";
    if (trend === "declining") return "↘";
    return "→";
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === "positive") return "text-green-400";
    if (sentiment === "negative") return "text-red-400";
    return "text-slate-400";
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-indigo-700/50">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Brain className="w-8 h-8 text-indigo-400" />
                Keyword & Brand Research
              </CardTitle>
              <CardDescription className="text-lg">
                Discover trending topics, questions, and track brand mentions across AI platforms
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Search Input */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Enter your niche or brand name (e.g., 'fitness', 'Nike')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-11 h-12 text-lg"
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={!searchQuery || isSearching}
                  size="lg"
                  className="px-8"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Research
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isSearching && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Analyzing data across multiple sources...</span>
                    <span className="text-sm font-medium">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Tabs */}
          {!isSearching && searchQuery && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="keywords">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Topic Clusters
                </TabsTrigger>
                <TabsTrigger value="brands">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Brand Tracking
                </TabsTrigger>
              </TabsList>

              {/* Keyword Clusters Tab */}
              <TabsContent value="keywords" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                      Question Clusters ({mockKeywordClusters.length})
                    </h2>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>

                  {mockKeywordClusters.map((cluster, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{cluster.topic}</CardTitle>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {cluster.volume.toLocaleString()} searches/mo
                              </Badge>
                              <Badge className={getDifficultyColor(cluster.difficulty)}>
                                {cluster.difficulty}
                              </Badge>
                              <Badge variant="outline">
                                {getTrendIcon(cluster.trend)} {cluster.trend}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h4 className="text-sm font-medium mb-3 text-slate-400">
                          Common Questions ({cluster.questions.length})
                        </h4>
                        <div className="space-y-2">
                          {cluster.questions.map((question, qIndex) => (
                            <div
                              key={qIndex}
                              className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <MessageCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm">{question}</p>
                            </div>
                          ))}
                        </div>
                        <Button className="w-full mt-4" variant="outline">
                          Create Content for This Topic
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Brand Tracking Tab */}
              <TabsContent value="brands" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                      Brand Mentions in AI Responses
                    </h2>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>

                  <Card className="bg-blue-900/20 border-blue-700/50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-400" />
                        How It Works
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-300">
                        We query major AI platforms (ChatGPT, Claude, Gemini) with common questions in your niche
                        and track how often brands are mentioned, in what context, and with what sentiment.
                      </p>
                    </CardContent>
                  </Card>

                  {mockBrandMentions.map((mention, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{mention.brand}</CardTitle>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">
                                {mention.mentions} mentions
                              </Badge>
                              <Badge 
                                variant="outline"
                                className={getSentimentColor(mention.sentiment)}
                              >
                                {mention.sentiment} sentiment
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h4 className="text-sm font-medium mb-3 text-slate-400">
                          Mention Contexts
                        </h4>
                        <div className="space-y-2">
                          {mention.context.map((ctx, ctxIndex) => (
                            <div
                              key={ctxIndex}
                              className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg"
                            >
                              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                              <p className="text-sm">{ctx}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Share of Voice</span>
                            <span className="font-medium">
                              {Math.round((mention.mentions / 500) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(mention.mentions / 500) * 100} 
                            className="h-2 mt-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Empty State */}
          {!isSearching && !searchQuery && (
            <Card className="bg-slate-800/50">
              <CardContent className="p-12 text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-bold mb-2">Start Your Research</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  Enter a topic or brand name to discover trending questions and track brand mentions
                  across AI platforms like ChatGPT, Claude, and Gemini.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

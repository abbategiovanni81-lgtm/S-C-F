import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, Users, Target, Clock, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ViralForecast {
  viralPotential: number;
  audienceSize: string;
  demographics: {
    primaryAge: string;
    genderSplit: string;
    interests: string[];
  };
  competitionLevel: string;
  recommendations: string[];
  bestTimeToPost: string;
}

export default function ViralForecaster() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [country, setCountry] = useState("global");
  const [platform, setPlatform] = useState("instagram");
  const [contentType, setContentType] = useState("video");
  const [forecast, setForecast] = useState<ViralForecast | null>(null);

  const forecastMutation = useMutation({
    mutationFn: async (data: { topic: string; country: string; platform: string; contentType: string }) => {
      return apiRequest<{ forecast: ViralForecast }>("/api/ava/viral-forecast", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      setForecast(data.forecast);
      toast({
        title: "Forecast Complete",
        description: "Your viral potential analysis is ready",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Forecast Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleForecast = () => {
    if (!topic) {
      toast({
        title: "Topic Required",
        description: "Please enter a content topic",
        variant: "destructive",
      });
      return;
    }
    forecastMutation.mutate({ topic, country, platform, contentType });
  };

  const getViralColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-yellow-500";
    if (score >= 4) return "text-orange-500";
    return "text-red-500";
  };

  const getCompetitionColor = (level: string) => {
    const lower = level.toLowerCase();
    if (lower.includes("low")) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (lower.includes("medium")) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    if (lower.includes("high")) return "bg-red-500/10 text-red-500 border-red-500/20";
    return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            Viral Forecaster
          </h1>
          <p className="text-muted-foreground text-lg">
            Validate content ideas before creation with AI-powered viral potential analysis
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle>Content Idea</CardTitle>
              <CardDescription>
                Enter your content idea to analyze its viral potential
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic / Idea</Label>
                <Input
                  id="topic"
                  placeholder="e.g., '10 productivity hacks for remote workers'"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger id="contentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="text">Text Post</SelectItem>
                      <SelectItem value="reel">Reel/Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Target Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="in">India</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="fr">France</SelectItem>
                    <SelectItem value="br">Brazil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleForecast}
                disabled={forecastMutation.isPending || !topic}
              >
                {forecastMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Forecast Viral Potential
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {forecast ? (
              <>
                {/* Viral Potential Score */}
                <Card className="border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Viral Potential</span>
                      <span className={`text-4xl font-bold ${getViralColor(forecast.viralPotential)}`}>
                        {forecast.viralPotential}/10
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={forecast.viralPotential * 10} className="h-3" />
                  </CardContent>
                </Card>

                {/* Audience & Demographics */}
                <Card className="border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      Audience Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Potential Reach</p>
                      <p className="text-2xl font-bold">{forecast.audienceSize}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Primary Age</p>
                        <p className="font-semibold">{forecast.demographics.primaryAge}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Gender Split</p>
                        <p className="font-semibold">{forecast.demographics.genderSplit}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Top Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {forecast.demographics.interests.map((interest, i) => (
                          <Badge key={i} variant="secondary">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Competition & Timing */}
                <Card className="border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-500" />
                      Market Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Competition Level</p>
                      <Badge className={getCompetitionColor(forecast.competitionLevel)}>
                        {forecast.competitionLevel}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Best Time to Post
                      </p>
                      <p className="font-semibold">{forecast.bestTimeToPost}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-purple-500" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {forecast.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-purple-500 mt-1">•</span>
                          <span className="text-sm leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-dashed border-2 border-purple-200 dark:border-purple-800">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-16 w-16 text-purple-300 mb-4" />
                  <p className="text-muted-foreground text-center">
                    Enter a content idea to see your viral forecast
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

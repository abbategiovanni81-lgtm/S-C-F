import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Calendar, Sparkles, Youtube, Instagram, Video, Twitter, Linkedin, Facebook, Clock, Pin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BrandBrief } from "@shared/schema";

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  youtube: <Youtube className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  tiktok: <Video className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  pinterest: <Pin className="w-4 h-4" />,
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "bg-red-100 text-red-700 border-red-200",
  instagram: "bg-pink-100 text-pink-700 border-pink-200",
  tiktok: "bg-slate-100 text-slate-700 border-slate-200",
  twitter: "bg-blue-100 text-blue-700 border-blue-200",
  linkedin: "bg-sky-100 text-sky-700 border-sky-200",
  facebook: "bg-indigo-100 text-indigo-700 border-indigo-200",
  pinterest: "bg-red-100 text-red-700 border-red-200",
};

const DEFAULT_PLATFORM_COLOR = "bg-gray-100 text-gray-700 border-gray-200";

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const FREQUENCIES = ["Daily", "3x per week", "Weekly", "Bi-weekly", "Monthly"];
const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter", "linkedin", "facebook", "pinterest"];

interface Post {
  platform: string;
  contentFormat: string;
  topic: string;
  hook: string;
  bestTime: string;
}

interface WeeklyPlan {
  days: {
    [key: string]: Post[];
  };
}

interface GenerateCalendarRequest {
  brandBriefId?: string;
  platforms: string[];
  postingFrequency: string;
  brandVoice?: string;
  targetAudience?: string;
  contentGoals?: string;
}

export default function ContentCalendar() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedBriefId, setSelectedBriefId] = useState<string>("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [postingFrequency, setPostingFrequency] = useState<string>("3x per week");
  const [manualMode, setManualMode] = useState(false);
  const [manualBrandVoice, setManualBrandVoice] = useState("");
  const [manualTargetAudience, setManualTargetAudience] = useState("");
  const [manualContentGoals, setManualContentGoals] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<WeeklyPlan | null>(null);

  // Fetch brand briefs
  const { data: briefs = [] } = useQuery<BrandBrief[]>({
    queryKey: ["/api/brand-briefs"],
  });

  // Generate plan mutation
  const generatePlan = useMutation({
    mutationFn: async () => {
      const requestData: GenerateCalendarRequest = {
        platforms: selectedPlatforms,
        postingFrequency,
      };

      if (selectedBriefId && !manualMode) {
        requestData.brandBriefId = selectedBriefId;
      } else {
        requestData.brandVoice = manualBrandVoice;
        requestData.targetAudience = manualTargetAudience;
        requestData.contentGoals = manualContentGoals;
      }

      const response = await apiRequest("POST", "/api/content-calendar/generate", requestData);
      return response.json();
    },
    onSuccess: (data: WeeklyPlan) => {
      setGeneratedPlan(data);
      toast({
        title: "Success!",
        description: "Your weekly content calendar has been generated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate content calendar",
        variant: "destructive",
      });
    },
  });

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerate = () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one platform",
        variant: "destructive",
      });
      return;
    }

    if (!manualMode && !selectedBriefId) {
      toast({
        title: "Error",
        description: "Please select a brand brief or switch to manual mode",
        variant: "destructive",
      });
      return;
    }

    if (manualMode && (!manualBrandVoice || !manualTargetAudience || !manualContentGoals)) {
      toast({
        title: "Error",
        description: "Please fill in all manual input fields",
        variant: "destructive",
      });
      return;
    }

    generatePlan.mutate();
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              Content Calendar
            </h1>
            <p className="text-muted-foreground mt-2">
              Generate a weekly content plan tailored to your brand and platforms
            </p>
          </div>
        </div>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Weekly Plan</CardTitle>
            <CardDescription>
              Configure your content calendar preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Brand Brief Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Brand Brief</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManualMode(!manualMode)}
                >
                  {manualMode ? "Use Brand Brief" : "Enter Manually"}
                </Button>
              </div>
              
              {!manualMode ? (
                <Select value={selectedBriefId} onValueChange={setSelectedBriefId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a brand brief" />
                  </SelectTrigger>
                  <SelectContent>
                    {briefs.map((brief) => (
                      <SelectItem key={brief.id} value={brief.id}>
                        {brief.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label>Brand Voice</Label>
                    <Textarea
                      placeholder="e.g., Professional, friendly, educational..."
                      value={manualBrandVoice}
                      onChange={(e) => setManualBrandVoice(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Target Audience</Label>
                    <Textarea
                      placeholder="e.g., Young professionals aged 25-35..."
                      value={manualTargetAudience}
                      onChange={(e) => setManualTargetAudience(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Content Goals</Label>
                    <Textarea
                      placeholder="e.g., Increase brand awareness, drive engagement..."
                      value={manualContentGoals}
                      onChange={(e) => setManualContentGoals(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => (
                  <Button
                    key={platform}
                    variant={selectedPlatforms.includes(platform) ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePlatform(platform)}
                    className="capitalize"
                  >
                    {PLATFORM_ICONS[platform]}
                    <span className="ml-2">{platform}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Posting Frequency */}
            <div className="space-y-2">
              <Label>Posting Frequency</Label>
              <Select value={postingFrequency} onValueChange={setPostingFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generatePlan.isPending}
              className="w-full"
              size="lg"
            >
              {generatePlan.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Weekly Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Calendar */}
        {generatedPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Your Weekly Content Calendar</CardTitle>
              <CardDescription>
                Planned content for the upcoming week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                {DAYS_OF_WEEK.map((day, index) => {
                  const posts = generatedPlan.days[day] || [];
                  return (
                    <div key={day} className="space-y-3">
                      <h3 className="font-semibold text-sm border-b pb-2">
                        {DAY_LABELS[index]}
                      </h3>
                      <div className="space-y-2">
                        {posts.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            No posts scheduled
                          </p>
                        ) : (
                          posts.map((post, postIndex) => {
                            const platformColor = PLATFORM_COLORS[post.platform.toLowerCase()] || DEFAULT_PLATFORM_COLOR;
                            const icon = PLATFORM_ICONS[post.platform.toLowerCase()];
                            
                            return (
                              <Card key={postIndex} className={`p-3 ${platformColor} border`}>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    {icon}
                                    <span className="font-medium text-xs capitalize">
                                      {post.platform}
                                    </span>
                                  </div>
                                  <div className="text-xs">
                                    <p className="font-semibold">{post.contentFormat}</p>
                                    <p className="mt-1 font-medium">{post.topic}</p>
                                    <p className="mt-1 italic text-[11px]">"{post.hook}"</p>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] opacity-70">
                                    <Clock className="w-3 h-3" />
                                    <span>{post.bestTime}</span>
                                  </div>
                                </div>
                              </Card>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

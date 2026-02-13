import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Youtube, Instagram, Video, Twitter, Linkedin, Facebook, Loader2, Clock, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BrandBrief } from "@shared/schema";

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  youtube: <Youtube className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  tiktok: <Video className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "bg-red-100 text-red-700 border-red-200",
  instagram: "bg-pink-100 text-pink-700 border-pink-200",
  tiktok: "bg-slate-100 text-slate-700 border-slate-200",
  twitter: "bg-blue-100 text-blue-700 border-blue-200",
  linkedin: "bg-sky-100 text-sky-700 border-sky-200",
  facebook: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface Post {
  platform: string;
  contentFormat: string;
  topic: string;
  hook: string;
  bestTime: string;
}

interface WeeklyPlan {
  days: Array<{
    day: string;
    posts: Post[];
  }>;
}

interface PostCardProps {
  post: Post;
}

function PostCard({ post }: PostCardProps) {
  const platformColor = PLATFORM_COLORS[post.platform.toLowerCase()] || "bg-gray-100 text-gray-700 border-gray-200";
  const icon = PLATFORM_ICONS[post.platform.toLowerCase()];
  
  return (
    <div className={`p-3 rounded-lg border ${platformColor} space-y-2`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium capitalize text-sm">{post.platform}</span>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Format:</p>
        <p className="text-sm">{post.contentFormat}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Topic:</p>
        <p className="text-sm line-clamp-2">{post.topic}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Hook:</p>
        <p className="text-sm italic line-clamp-2">{post.hook}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
        <Clock className="w-3 h-3" />
        <span>{post.bestTime}</span>
      </div>
    </div>
  );
}

export default function ContentCalendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedBriefId, setSelectedBriefId] = useState<string>("");
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);

  const { data: briefs = [], isLoading: isLoadingBriefs } = useQuery<BrandBrief[]>({
    queryKey: ["/api/brand-briefs"],
    queryFn: async () => {
      const res = await fetch("/api/brand-briefs");
      if (!res.ok) throw new Error("Failed to fetch brand briefs");
      return res.json();
    },
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (briefId: string) => {
      const res = await apiRequest("POST", "/api/content-calendar/generate", { briefId });
      return res.json();
    },
    onSuccess: (data) => {
      setWeeklyPlan(data);
      toast({
        title: "Success",
        description: "Weekly content plan generated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate weekly plan",
        variant: "destructive",
      });
    },
  });

  const handleGeneratePlan = () => {
    if (!selectedBriefId) {
      toast({
        title: "No Brand Brief Selected",
        description: "Please select a brand brief first",
        variant: "destructive",
      });
      return;
    }
    generatePlanMutation.mutate(selectedBriefId);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              Content Calendar
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Generate and view your weekly content plan
            </p>
          </div>
        </div>

        {/* Controls Card */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Weekly Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-brief">Select Brand Brief</Label>
              <Select
                value={selectedBriefId}
                onValueChange={setSelectedBriefId}
                disabled={isLoadingBriefs}
              >
                <SelectTrigger id="brand-brief">
                  <SelectValue placeholder={isLoadingBriefs ? "Loading..." : "Select a brand brief"} />
                </SelectTrigger>
                <SelectContent>
                  {briefs.map((brief) => (
                    <SelectItem key={brief.id} value={brief.id}>
                      {brief.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {briefs.length === 0 && !isLoadingBriefs && (
                <p className="text-sm text-gray-500">
                  No brand briefs found. Create one in the Brand Briefs page first.
                </p>
              )}
            </div>

            <Button
              onClick={handleGeneratePlan}
              disabled={!selectedBriefId || generatePlanMutation.isPending}
              className="w-full"
            >
              {generatePlanMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
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

        {/* Weekly Plan Display */}
        {weeklyPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Your Weekly Content Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                {DAYS_OF_WEEK.map((day) => {
                  const dayData = weeklyPlan.days.find((d) => d.day === day);
                  const posts = dayData?.posts || [];
                  
                  return (
                    <div key={day} className="space-y-3">
                      <h3 className="font-semibold text-lg text-center pb-2 border-b">
                        {day}
                      </h3>
                      <div className="space-y-3">
                        {posts.length > 0 ? (
                          posts.map((post, index) => (
                            <PostCard key={index} post={post} />
                          ))
                        ) : (
                          <div className="text-center text-sm text-gray-500 py-4">
                            No posts scheduled
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!weeklyPlan && !generatePlanMutation.isPending && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Calendar className="w-16 h-16 text-gray-400" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">No Plan Generated Yet</h3>
                <p className="text-gray-500">
                  Select a brand brief and click "Generate Weekly Plan" to create your content calendar
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

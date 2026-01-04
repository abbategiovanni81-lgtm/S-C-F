import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Send, Loader2, ExternalLink, Link2, MessageSquare, Coins, AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface RedditSubreddit {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  subscribers?: number;
  isActive: string;
  lastPostedAt?: string;
}

interface RedditPost {
  id: string;
  subredditName: string;
  title: string;
  body: string;
  postUrl?: string;
  status: string;
  creditsEarned?: number;
  postedAt?: string;
  errorMessage?: string;
}

interface TodayStats {
  posts: RedditPost[];
  count: number;
  remaining: number;
}

const SUGGESTED_SUBREDDITS = [
  "Entrepreneur", "smallbusiness", "startups", "SideProject", "marketing",
  "socialmedia", "content_marketing", "AI_Tools", "artificial", "MachineLearning",
  "deeplearning", "VideoEditing", "Filmmakers", "videography", "YouTubers",
  "NewTubers", "youtube", "ContentCreators", "TikTokCreators", "Instagram",
  "DigitalMarketing", "Affiliatemarketing", "growthhacking", "productivity",
  "SaaS", "webdev", "webdesign", "freelance", "remotework", "passiveincome",
  "EntrepreneurRideAlong", "imadethis", "InternetIsBeautiful", "technology", "gadgets"
];

const A2E_REFERRAL_LINK = "https://video.a2e.ai/?coupon=sQ1S";

export default function RedditManager() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [newSubreddit, setNewSubreddit] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [selectedSubreddit, setSelectedSubreddit] = useState<RedditSubreddit | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: subreddits = [], isLoading: loadingSubreddits } = useQuery<RedditSubreddit[]>({
    queryKey: ["/api/reddit/subreddits"],
  });

  const { data: todayStats } = useQuery<TodayStats>({
    queryKey: ["/api/reddit/posts/today"],
  });

  const { data: allPosts = [] } = useQuery<RedditPost[]>({
    queryKey: ["/api/reddit/posts"],
  });

  const { data: redditStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/reddit/status"],
  });

  const addSubredditMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/reddit/subreddits", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reddit/subreddits"] });
      setNewSubreddit("");
      setShowAddDialog(false);
      toast({ title: "Subreddit added!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add subreddit", description: error.message, variant: "destructive" });
    },
  });

  const bulkAddMutation = useMutation({
    mutationFn: async (subreddits: string[]) => {
      return await apiRequest("POST", "/api/reddit/subreddits/bulk", { subreddits });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reddit/subreddits"] });
      toast({ title: `Added ${data.count} subreddits!` });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add subreddits", description: error.message, variant: "destructive" });
    },
  });

  const deleteSubredditMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/reddit/subreddits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reddit/subreddits"] });
      toast({ title: "Subreddit removed" });
    },
  });

  const postMutation = useMutation({
    mutationFn: async (data: { subredditName: string; title: string; body: string; referralLink: string }) => {
      return await apiRequest("POST", "/api/reddit/post", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reddit/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reddit/posts/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reddit/subreddits"] });
      setShowPostDialog(false);
      setPostTitle("");
      setPostBody("");
      setSelectedSubreddit(null);
      toast({ title: "Posted to Reddit!", description: "+200 instant credits from A2E" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to post", description: error.message, variant: "destructive" });
    },
  });

  const handleAddSuggested = () => {
    const notAdded = SUGGESTED_SUBREDDITS.filter(
      s => !subreddits.some(sub => sub.name.toLowerCase() === s.toLowerCase())
    );
    if (notAdded.length > 0) {
      bulkAddMutation.mutate(notAdded);
    } else {
      toast({ title: "All suggested subreddits already added" });
    }
  };

  const handlePost = () => {
    if (!selectedSubreddit || !postTitle.trim() || !postBody.trim()) return;
    
    const bodyWithLink = postBody.includes(A2E_REFERRAL_LINK) 
      ? postBody 
      : `${postBody}\n\nCheck it out: ${A2E_REFERRAL_LINK}`;

    postMutation.mutate({
      subredditName: selectedSubreddit.name,
      title: postTitle.trim(),
      body: bodyWithLink,
      referralLink: A2E_REFERRAL_LINK,
    });
  };

  const openPostDialog = (sub: RedditSubreddit) => {
    setSelectedSubreddit(sub);
    setPostTitle("");
    setPostBody(`I just discovered this amazing AI video generation tool that lets you create professional videos with AI avatars and text-to-video features. It's been a game-changer for my content creation workflow!\n\n${A2E_REFERRAL_LINK}`);
    setShowPostDialog(true);
  };

  const totalCreditsEarned = allPosts.reduce((sum, p) => sum + (p.creditsEarned || 0), 0);
  const potentialMonthlyCredits = 5 * 30 * 620; // 5 posts/day * 30 days * 620 credits

  if (!redditStatus?.configured) {
    return (
      <Layout title="Reddit Manager">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Reddit API Not Configured</h3>
            <p className="text-muted-foreground mb-4">
              To use Reddit posting for A2E credits, you need to add Reddit API credentials.
            </p>
            <p className="text-sm text-muted-foreground">
              Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to your environment variables.
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Reddit Manager">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold" data-testid="text-page-title">
              Reddit A2E Promotion
            </h2>
            <p className="text-muted-foreground">
              Post to subreddits to earn A2E credits (620 credits per post)
            </p>
          </div>
          <Button onClick={() => window.location.href = "/api/reddit/auth"} data-testid="button-connect-reddit">
            <Link2 className="w-4 h-4 mr-2" />
            Connect Reddit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCreditsEarned.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Credits Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayStats?.remaining ?? 5}/5</p>
                  <p className="text-sm text-muted-foreground">Posts Left Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{subreddits.length}</p>
                  <p className="text-sm text-muted-foreground">Target Subreddits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-orange-500" />
              A2E SEO Bonus Program
            </CardTitle>
            <CardDescription>
              Earn up to {potentialMonthlyCredits.toLocaleString()} credits per month!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">How it works:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Post about A2E to Reddit subreddits</li>
                  <li>• Include your referral link in the post body</li>
                  <li>• Earn 200 credits instantly per post</li>
                  <li>• Earn 30 credits daily for 14 days (if post stays up)</li>
                  <li>• Maximum 5 posts per 24 hours</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Rules:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Post must promote a2e.ai</li>
                  <li>• Referral link in body, NOT in title</li>
                  <li>• Posts must remain publicly visible</li>
                  <li>• Irrelevant content will be rejected</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Target Subreddits</CardTitle>
              <CardDescription>Manage the subreddits you want to post to</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAddSuggested} disabled={bulkAddMutation.isPending}>
                {bulkAddMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Suggested (35)"}
              </Button>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Subreddit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSubreddits ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : subreddits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No subreddits added yet</p>
                <p className="text-sm">Click "Add Suggested" to get started with popular subreddits</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {subreddits.map((sub) => (
                  <div 
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">r/{sub.name}</span>
                      {sub.lastPostedAt && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openPostDialog(sub)}
                        disabled={(todayStats?.remaining ?? 5) <= 0}
                        data-testid={`button-post-${sub.name}`}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSubredditMutation.mutate(sub.id)}
                        data-testid={`button-delete-${sub.name}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Track your Reddit posts and earned credits</CardDescription>
          </CardHeader>
          <CardContent>
            {allPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No posts yet. Start posting to earn credits!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allPosts.slice(0, 10).map((post) => (
                  <div 
                    key={post.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={post.status === "posted" ? "default" : "destructive"}>
                          {post.status}
                        </Badge>
                        <span className="font-medium truncate">r/{post.subredditName}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{post.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {post.creditsEarned && post.creditsEarned > 0 && (
                        <Badge variant="outline" className="text-orange-500 border-orange-500/50">
                          +{post.creditsEarned} credits
                        </Badge>
                      )}
                      {post.postUrl && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subreddit</DialogTitle>
            <DialogDescription>Enter the subreddit name (without r/)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subreddit Name</Label>
              <Input
                placeholder="e.g., Entrepreneur"
                value={newSubreddit}
                onChange={(e) => setNewSubreddit(e.target.value)}
                data-testid="input-subreddit-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => addSubredditMutation.mutate(newSubreddit)}
              disabled={!newSubreddit.trim() || addSubredditMutation.isPending}
              data-testid="button-confirm-add-subreddit"
            >
              {addSubredditMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post to r/{selectedSubreddit?.name}</DialogTitle>
            <DialogDescription>
              Create a post promoting A2E. Remember: No URLs in the title!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Post Title</Label>
              <Input
                placeholder="Amazing AI Video Tool That Changed My Content Game"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                data-testid="input-post-title"
              />
              <p className="text-xs text-muted-foreground">Do not include URLs in the title</p>
            </div>
            <div className="space-y-2">
              <Label>Post Body</Label>
              <Textarea
                placeholder="Share your experience with A2E..."
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                rows={6}
                data-testid="input-post-body"
              />
              <p className="text-xs text-muted-foreground">
                Your referral link: {A2E_REFERRAL_LINK}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostDialog(false)}>Cancel</Button>
            <Button 
              onClick={handlePost}
              disabled={!postTitle.trim() || !postBody.trim() || postMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-submit-post"
            >
              {postMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Post to Reddit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

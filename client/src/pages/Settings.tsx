import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { Settings as SettingsIcon, Key, Youtube, User, LogOut, Check, X, Loader2, Crown, BarChart3, FileText, Mic, Video, Image, MessageSquare, CreditCard } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const { user, logout, hasFullAccess, tier } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [elevenlabsKey, setElevenlabsKey] = useState("");
  const [a2eKey, setA2eKey] = useState("");
  const [falKey, setFalKey] = useState("");
  const [pexelsKey, setPexelsKey] = useState("");

  const { data: aiStatus } = useQuery({
    queryKey: ["/api/ai-engines/status"],
    queryFn: async () => {
      const res = await fetch("/api/ai-engines/status", { credentials: "include" });
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: userApiKeys, isLoading: loadingKeys } = useQuery({
    queryKey: ["/api/user/api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/user/api-keys", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch API keys");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const saveKeysMutation = useMutation({
    mutationFn: async (keys: { openaiKey?: string; anthropicKey?: string; elevenlabsKey?: string; a2eKey?: string; falKey?: string; pexelsKey?: string }) => {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(keys),
      });
      if (!res.ok) throw new Error("Failed to save API keys");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/api-keys"] });
      toast({ title: "API keys saved!", description: "Your keys have been securely stored." });
      setOpenaiKey("");
      setAnthropicKey("");
      setElevenlabsKey("");
      setA2eKey("");
      setFalKey("");
      setPexelsKey("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    },
  });

  const { data: youtubeAccounts } = useQuery({
    queryKey: ["/api/social-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/social-accounts", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id,
  });

  const youtubeConnected = youtubeAccounts?.some((acc: any) => acc.platform === "youtube" && acc.isConnected === "connected");

  const { data: usageStats, isLoading: loadingUsage } = useQuery({
    queryKey: ["/api/usage/stats"],
    queryFn: async () => {
      const res = await fetch("/api/usage/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch usage stats");
      return res.json();
    },
    enabled: !!user?.id && hasFullAccess,
  });

  const topupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/topup", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create top-up session");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({ title: "Top-up failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveKeys = () => {
    const keysToSave: any = {};
    if (openaiKey) keysToSave.openaiKey = openaiKey;
    if (anthropicKey) keysToSave.anthropicKey = anthropicKey;
    if (elevenlabsKey) keysToSave.elevenlabsKey = elevenlabsKey;
    if (a2eKey) keysToSave.a2eKey = a2eKey;
    if (falKey) keysToSave.falKey = falKey;
    if (pexelsKey) keysToSave.pexelsKey = pexelsKey;
    
    if (Object.keys(keysToSave).length === 0) {
      toast({ title: "No changes", description: "Enter at least one API key to save", variant: "destructive" });
      return;
    }
    
    saveKeysMutation.mutate(keysToSave);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and API connections</p>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList>
            <TabsTrigger value="account" data-testid="tab-account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="subscription" data-testid="tab-subscription">
              <Crown className="h-4 w-4 mr-2" />
              Subscription
            </TabsTrigger>
            {hasFullAccess && (
              <TabsTrigger value="usage" data-testid="tab-usage">
                <BarChart3 className="h-4 w-4 mr-2" />
                Usage
              </TabsTrigger>
            )}
            <TabsTrigger value="api-keys" data-testid="tab-api-keys">
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="youtube" data-testid="tab-youtube">
              <Youtube className="h-4 w-4 mr-2" />
              YouTube
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your profile details from your login provider</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {user?.profileImageUrl && (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full"
                      data-testid="img-profile"
                    />
                  )}
                  <div>
                    <p className="font-medium text-lg" data-testid="text-user-name">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-muted-foreground" data-testid="text-user-email">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => logout()}
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionTab 
              tier={tier} 
              hasFullAccess={hasFullAccess} 
              usageStats={usageStats} 
              loadingUsage={loadingUsage}
            />
          </TabsContent>

          {hasFullAccess && (
            <TabsContent value="usage">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Monthly Usage</CardTitle>
                      <CardDescription>
                        Your usage resets on the 1st of each month
                      </CardDescription>
                    </div>
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                      <Crown className="h-3 w-3 mr-1" />
                      {tier === "pro" ? "Pro" : "Premium"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingUsage ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : usageStats ? (
                    <div className="space-y-6">
                      <div className="text-sm text-muted-foreground mb-4">
                        Period: {new Date(usageStats.period?.start).toLocaleDateString()} - {new Date(usageStats.period?.end).toLocaleDateString()}
                        {usageStats.topupMultiplier > 0 && (
                          <Badge variant="outline" className="ml-2 text-green-600">
                            +{Math.round(usageStats.topupMultiplier * 100)}% bonus
                          </Badge>
                        )}
                      </div>
                      <UsageBar 
                        icon={<FileText className="h-4 w-4" />}
                        label="Brand Briefs"
                        used={usageStats.usage?.brandBriefs?.used || 0}
                        limit={usageStats.usage?.brandBriefs?.limit || 0}
                      />
                      <UsageBar 
                        icon={<Mic className="h-4 w-4" />}
                        label="Voiceovers (min)"
                        used={usageStats.usage?.voiceovers?.used || 0}
                        limit={usageStats.usage?.voiceovers?.limit || 0}
                      />
                      <UsageBar 
                        icon={<Video className="h-4 w-4" />}
                        label="A2E Videos"
                        used={usageStats.usage?.a2eVideos?.used || 0}
                        limit={usageStats.usage?.a2eVideos?.limit || 0}
                      />
                      <UsageBar 
                        icon={<Video className="h-4 w-4" />}
                        label="Lipsync"
                        used={usageStats.usage?.lipsync?.used || 0}
                        limit={usageStats.usage?.lipsync?.limit || 0}
                      />
                      <UsageBar 
                        icon={<Video className="h-4 w-4" />}
                        label="Avatars"
                        used={usageStats.usage?.avatars?.used || 0}
                        limit={usageStats.usage?.avatars?.limit || 0}
                      />
                      <UsageBar 
                        icon={<Image className="h-4 w-4" />}
                        label="DALL-E Images"
                        used={usageStats.usage?.dalleImages?.used || 0}
                        limit={usageStats.usage?.dalleImages?.limit || 0}
                      />
                      <UsageBar 
                        icon={<Video className="h-4 w-4" />}
                        label="Sora Videos"
                        used={usageStats.usage?.soraVideos?.used || 0}
                        limit={usageStats.usage?.soraVideos?.limit || 0}
                      />
                      <UsageBar 
                        icon={<MessageSquare className="h-4 w-4" />}
                        label="Social Listening Keywords"
                        used={usageStats.usage?.socialListening?.used || 0}
                        limit={usageStats.usage?.socialListening?.limit || 0}
                      />

                      <div className="pt-6 border-t mt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Need more quota?</h3>
                            <p className="text-sm text-muted-foreground">
                              Top up for £10 and get {usageStats.tier === "pro" ? "20%" : "40%"} extra on all limits this month
                            </p>
                          </div>
                          <Button
                            onClick={() => topupMutation.mutate()}
                            disabled={topupMutation.isPending}
                            data-testid="button-topup"
                          >
                            {topupMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CreditCard className="h-4 w-4 mr-2" />
                            )}
                            Top Up £10
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Unable to load usage stats</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="api-keys">
            <Card>
              <CardHeader>
                <CardTitle>AI Service Status</CardTitle>
                <CardDescription>
                  These API keys are configured at the platform level. Contact the administrator to update them.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiStatus && Object.entries(aiStatus).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{value.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{key}</p>
                      </div>
                      <Badge variant={value.configured ? "default" : "secondary"}>
                        {value.configured ? (
                          <><Check className="h-3 w-3 mr-1" /> Connected</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" /> Not Configured</>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your API Keys</CardTitle>
                    <CardDescription>
                      {hasFullAccess 
                        ? "As a premium user, you can use platform keys or add your own."
                        : "Add your own API keys to use AI features on the free plan."
                      }
                    </CardDescription>
                  </div>
                  {hasFullAccess && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                      <Crown className="h-3 w-3 mr-1" />
                      {tier === "pro" ? "Pro" : "Premium"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingKeys ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>OpenAI API Key</Label>
                        {userApiKeys?.hasOpenai && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="h-3 w-3 mr-1" /> Saved
                          </Badge>
                        )}
                      </div>
                      <Input 
                        type="password" 
                        placeholder={userApiKeys?.hasOpenai ? "••••••••••••" : "sk-..."} 
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        data-testid="input-openai-key" 
                      />
                      <p className="text-xs text-muted-foreground">For content generation and DALL-E images</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Anthropic API Key (Claude)</Label>
                        {userApiKeys?.hasAnthropic && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="h-3 w-3 mr-1" /> Saved
                          </Badge>
                        )}
                      </div>
                      <Input 
                        type="password" 
                        placeholder={userApiKeys?.hasAnthropic ? "••••••••••••" : "sk-ant-..."} 
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        data-testid="input-anthropic-key" 
                      />
                      <p className="text-xs text-muted-foreground">Alternative to OpenAI - for content generation with Claude</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>ElevenLabs API Key</Label>
                        {userApiKeys?.hasElevenlabs && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="h-3 w-3 mr-1" /> Saved
                          </Badge>
                        )}
                      </div>
                      <Input 
                        type="password" 
                        placeholder={userApiKeys?.hasElevenlabs ? "••••••••••••" : "Your ElevenLabs key"} 
                        value={elevenlabsKey}
                        onChange={(e) => setElevenlabsKey(e.target.value)}
                        data-testid="input-elevenlabs-key" 
                      />
                      <p className="text-xs text-muted-foreground">For AI voice generation</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>A2E API Key</Label>
                        {userApiKeys?.hasA2e && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="h-3 w-3 mr-1" /> Saved
                          </Badge>
                        )}
                      </div>
                      <Input 
                        type="password" 
                        placeholder={userApiKeys?.hasA2e ? "••••••••••••" : "Your A2E key"}
                        value={a2eKey}
                        onChange={(e) => setA2eKey(e.target.value)}
                        data-testid="input-a2e-key" 
                      />
                      <p className="text-xs text-muted-foreground">For avatar video generation</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Fal.ai API Key</Label>
                        {userApiKeys?.hasFal && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="h-3 w-3 mr-1" /> Saved
                          </Badge>
                        )}
                      </div>
                      <Input 
                        type="password" 
                        placeholder={userApiKeys?.hasFal ? "••••••••••••" : "Your Fal.ai key"}
                        value={falKey}
                        onChange={(e) => setFalKey(e.target.value)}
                        data-testid="input-fal-key" 
                      />
                      <p className="text-xs text-muted-foreground">For AI video and image generation</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Pexels API Key</Label>
                        {userApiKeys?.hasPexels && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="h-3 w-3 mr-1" /> Saved
                          </Badge>
                        )}
                      </div>
                      <Input 
                        type="password" 
                        placeholder={userApiKeys?.hasPexels ? "••••••••••••" : "Your Pexels key"}
                        value={pexelsKey}
                        onChange={(e) => setPexelsKey(e.target.value)}
                        data-testid="input-pexels-key" 
                      />
                      <p className="text-xs text-muted-foreground">For B-Roll stock footage</p>
                    </div>
                    <Button 
                      onClick={handleSaveKeys}
                      disabled={saveKeysMutation.isPending}
                      data-testid="button-save-keys"
                    >
                      {saveKeysMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save API Keys"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="youtube">
            <Card>
              <CardHeader>
                <CardTitle>YouTube Connection</CardTitle>
                <CardDescription>
                  Connect your YouTube channel to enable video uploads and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {youtubeConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">YouTube is connected</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You can manage your connected accounts in the Accounts page.
                    </p>
                    <Button variant="outline" asChild>
                      <a href="/accounts" data-testid="link-manage-accounts">Manage Accounts</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Connect your YouTube channel to upload videos directly and view analytics.
                    </p>
                    <Button asChild>
                      <a href="/accounts" data-testid="link-connect-youtube">
                        <Youtube className="h-4 w-4 mr-2" />
                        Connect YouTube
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function UsageBar({ icon, label, used, limit }: { icon: React.ReactNode; label: string; used: number; limit: number }) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="font-medium">{label}</span>
        </div>
        <span className={`text-sm ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-muted-foreground'}`}>
          {used} / {limit}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2 ${isAtLimit ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
      />
    </div>
  );
}

function SubscriptionTab({ tier, hasFullAccess, usageStats, loadingUsage }: { 
  tier: string; 
  hasFullAccess: boolean; 
  usageStats: any; 
  loadingUsage: boolean;
}) {
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (priceType: string) => {
    setSubscribing(true);
    try {
      const res = await fetch("/api/stripe/products");
      const data = await res.json();
      const product = data.products?.find((p: any) => 
        priceType === "premium" 
          ? p.unit_amount === 2999 
          : p.unit_amount === 4999
      );
      
      if (product?.price_id) {
        const checkoutRes = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ priceId: product.price_id }),
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
    setSubscribing(false);
  };

  const getUsageSummary = () => {
    if (!usageStats?.usage) return null;
    const u = usageStats.usage;
    const items = [
      { label: "Voiceovers", used: u.voiceovers?.used || 0, limit: u.voiceovers?.limit || 0, unit: "min" },
      { label: "Videos", used: u.a2eVideos?.used || 0, limit: u.a2eVideos?.limit || 0 },
      { label: "Images", used: u.dalleImages?.used || 0, limit: u.dalleImages?.limit || 0 },
    ];
    return items;
  };

  const summary = getUsageSummary();

  if (!hasFullAccess) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>You're on the Free plan</CardDescription>
              </div>
              <Badge variant="secondary">Free</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Add your own API keys in Settings to use AI features, or upgrade to a paid plan for full access with no setup required.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-purple-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-500" />
                  Premium
                </CardTitle>
                <Badge className="bg-purple-500">£29.99/mo</Badge>
              </div>
              <CardDescription>Great for creators getting started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 5 Brand Briefs</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 25 min voiceovers</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 16 A2E videos</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 150 DALL-E images</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 3 listening keywords</li>
              </ul>
              <Button 
                className="w-full mt-4" 
                onClick={() => handleSubscribe("premium")}
                disabled={subscribing}
                data-testid="button-subscribe-premium"
              >
                {subscribing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Upgrade to Premium
              </Button>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Pro
                </CardTitle>
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">£49.99/mo</Badge>
              </div>
              <CardDescription>For serious content creators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 10 Brand Briefs</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 60 min voiceovers</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 32 A2E videos</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 400 DALL-E images</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 6 listening keywords</li>
              </ul>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" 
                onClick={() => handleSubscribe("pro")}
                disabled={subscribing}
                data-testid="button-subscribe-pro"
              >
                {subscribing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </div>
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
              <Crown className="h-3 w-3 mr-1" />
              {tier === "pro" ? "Pro" : "Premium"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingUsage ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {summary.map((item) => {
                  const percent = item.limit > 0 ? Math.round((item.used / item.limit) * 100) : 0;
                  const remaining = item.limit - item.used;
                  return (
                    <div key={item.label} className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{percent}%</div>
                      <div className="text-xs text-muted-foreground mb-2">{item.label} used</div>
                      <div className="text-sm font-medium text-green-600">
                        {remaining} {item.unit || ""} left
                      </div>
                      <Progress value={percent} className="h-1 mt-2" />
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 border-t">
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    const usageTab = document.querySelector('[data-testid="tab-usage"]') as HTMLButtonElement;
                    if (usageTab) usageTab.click();
                  }}
                  className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                  data-testid="link-detailed-usage"
                >
                  <BarChart3 className="h-4 w-4" />
                  View detailed usage breakdown
                </a>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Usage data will appear here</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

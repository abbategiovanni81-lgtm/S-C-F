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
import { Settings as SettingsIcon, Key, Youtube, User, LogOut, Check, X, Loader2, Crown } from "lucide-react";

export default function Settings() {
  const { user, logout, hasFullAccess, tier } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [openaiKey, setOpenaiKey] = useState("");
  const [elevenlabsKey, setElevenlabsKey] = useState("");
  const [a2eKey, setA2eKey] = useState("");
  const [falKey, setFalKey] = useState("");
  const [pexelsKey, setPexelsKey] = useState("");

  const { data: aiStatus } = useQuery({
    queryKey: ["/api/ai-engines/status"],
    queryFn: async () => {
      const res = await fetch("/api/ai-engines/status");
      return res.json();
    },
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
    mutationFn: async (keys: { openaiKey?: string; elevenlabsKey?: string; a2eKey?: string; falKey?: string; pexelsKey?: string }) => {
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
      const res = await fetch("/api/social-accounts?userId=" + user?.id);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const youtubeConnected = youtubeAccounts?.some((acc: any) => acc.platform === "youtube" && acc.isConnected === "connected");

  const handleSaveKeys = () => {
    const keysToSave: any = {};
    if (openaiKey) keysToSave.openaiKey = openaiKey;
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

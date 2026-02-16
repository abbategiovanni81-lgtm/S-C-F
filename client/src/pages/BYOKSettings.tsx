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
import { Key, Check, Loader2, ExternalLink } from "lucide-react";

interface APIKey {
  name: string;
  key: string;
  placeholder: string;
  description: string;
  dashboardUrl: string;
  hasSaved?: boolean;
}

export default function BYOKSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initial empty state for API keys
  const initialApiKeys: Record<string, string> = {
    // Existing providers
    didKey: "",
    creatifyKey: "",
    openrouterKey: "",
    togetheraiKey: "",
    // LLM providers
    anthropicKey: "",
    geminiKey: "",
    xaiKey: "",
    perplexityKey: "",
    // Image providers
    stabilityaiKey: "",
    replicateKey: "",
    ideogramKey: "",
    // Video providers
    runwayKey: "",
    pikaKey: "",
    klingKey: "",
  };

  // State for all API keys
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(initialApiKeys);

  const { data: userApiKeys, isLoading: loadingKeys } = useQuery({
    queryKey: ["/api/settings/api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/settings/api-keys", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch API keys");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const saveKeysMutation = useMutation({
    mutationFn: async (keys: Array<{ name: string; value: string }>) => {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ keys }),
      });
      if (!res.ok) throw new Error("Failed to save API keys");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/api-keys"] });
      toast({ title: "API keys saved!", description: "Your keys have been securely stored." });
      // Clear all input fields
      setApiKeys(initialApiKeys);
    },
    onError: (error: any) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveKeys = () => {
    const keysToSave = Object.entries(apiKeys)
      .filter(([_, value]) => value.trim() !== "")
      .map(([name, value]) => ({ name, value }));
    
    if (keysToSave.length === 0) {
      toast({ title: "No changes", description: "Enter at least one API key to save", variant: "destructive" });
      return;
    }
    
    saveKeysMutation.mutate(keysToSave);
  };

  const handleKeyChange = (keyName: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [keyName]: value }));
  };

  // Existing providers configuration
  const existingProviders: APIKey[] = [
    {
      name: "didKey",
      key: "D-ID",
      placeholder: userApiKeys?.didKey ? "••••••••••••" : "Your D-ID API key",
      description: "For AI avatar and video generation",
      dashboardUrl: "https://studio.d-id.com/account-settings",
      hasSaved: userApiKeys?.didKey,
    },
    {
      name: "creatifyKey",
      key: "Creatify",
      placeholder: userApiKeys?.creatifyKey ? "••••••••••••" : "Your Creatify API key",
      description: "For video ad creation and editing",
      dashboardUrl: "https://creatify.ai/dashboard",
      hasSaved: userApiKeys?.creatifyKey,
    },
    {
      name: "openrouterKey",
      key: "OpenRouter",
      placeholder: userApiKeys?.openrouterKey ? "••••••••••••" : "sk-or-...",
      description: "For unified LLM access across multiple providers",
      dashboardUrl: "https://openrouter.ai/keys",
      hasSaved: userApiKeys?.openrouterKey,
    },
    {
      name: "togetheraiKey",
      key: "Together AI",
      placeholder: userApiKeys?.togetheraiKey ? "••••••••••••" : "Your Together AI key",
      description: "For open-source LLM inference",
      dashboardUrl: "https://api.together.xyz/settings/api-keys",
      hasSaved: userApiKeys?.togetheraiKey,
    },
  ];

  // LLM providers configuration
  const llmProviders: APIKey[] = [
    {
      name: "anthropicKey",
      key: "Anthropic (Claude)",
      placeholder: userApiKeys?.anthropicKey ? "••••••••••••" : "sk-ant-...",
      description: "For Claude AI language models",
      dashboardUrl: "https://console.anthropic.com/settings/keys",
      hasSaved: userApiKeys?.anthropicKey,
    },
    {
      name: "geminiKey",
      key: "Google (Gemini)",
      placeholder: userApiKeys?.geminiKey ? "••••••••••••" : "Your Gemini API key",
      description: "For Google Gemini AI models",
      dashboardUrl: "https://makersuite.google.com/app/apikey",
      hasSaved: userApiKeys?.geminiKey,
    },
    {
      name: "xaiKey",
      key: "xAI (Grok)",
      placeholder: userApiKeys?.xaiKey ? "••••••••••••" : "Your xAI API key",
      description: "For Grok AI language models",
      dashboardUrl: "https://console.x.ai/",
      hasSaved: userApiKeys?.xaiKey,
    },
    {
      name: "perplexityKey",
      key: "Perplexity",
      placeholder: userApiKeys?.perplexityKey ? "••••••••••••" : "pplx-...",
      description: "For Perplexity AI search and language models",
      dashboardUrl: "https://www.perplexity.ai/settings/api",
      hasSaved: userApiKeys?.perplexityKey,
    },
  ];

  // Image providers configuration
  const imageProviders: APIKey[] = [
    {
      name: "stabilityaiKey",
      key: "Stability AI",
      placeholder: userApiKeys?.stabilityaiKey ? "••••••••••••" : "sk-...",
      description: "For Stable Diffusion image generation",
      dashboardUrl: "https://platform.stability.ai/account/keys",
      hasSaved: userApiKeys?.stabilityaiKey,
    },
    {
      name: "replicateKey",
      key: "Replicate",
      placeholder: userApiKeys?.replicateKey ? "••••••••••••" : "r8_...",
      description: "For various AI image and video models",
      dashboardUrl: "https://replicate.com/account/api-tokens",
      hasSaved: userApiKeys?.replicateKey,
    },
    {
      name: "ideogramKey",
      key: "Ideogram",
      placeholder: userApiKeys?.ideogramKey ? "••••••••••••" : "Your Ideogram API key",
      description: "For AI-powered image generation with text",
      dashboardUrl: "https://ideogram.ai/api",
      hasSaved: userApiKeys?.ideogramKey,
    },
  ];

  // Video providers configuration
  const videoProviders: APIKey[] = [
    {
      name: "runwayKey",
      key: "Runway",
      placeholder: userApiKeys?.runwayKey ? "••••••••••••" : "Your Runway API key",
      description: "For AI video generation and editing",
      dashboardUrl: "https://app.runwayml.com/settings",
      hasSaved: userApiKeys?.runwayKey,
    },
    {
      name: "pikaKey",
      key: "Pika",
      placeholder: userApiKeys?.pikaKey ? "••••••••••••" : "Your Pika API key",
      description: "For text-to-video and image-to-video generation",
      dashboardUrl: "https://pika.art/settings",
      hasSaved: userApiKeys?.pikaKey,
    },
    {
      name: "klingKey",
      key: "Kling",
      placeholder: userApiKeys?.klingKey ? "••••••••••••" : "Your Kling API key",
      description: "For advanced AI video generation",
      dashboardUrl: "https://klingai.com/api",
      hasSaved: userApiKeys?.klingKey,
    },
  ];

  const renderAPIKeyField = (provider: APIKey) => (
    <div key={provider.name} className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>{provider.key}</Label>
          <a
            href={provider.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {provider.hasSaved && (
          <Badge variant="outline" className="text-xs">
            <Check className="h-3 w-3 mr-1" /> Saved
          </Badge>
        )}
      </div>
      <Input
        type="password"
        placeholder={provider.placeholder}
        value={apiKeys[provider.name]}
        onChange={(e) => handleKeyChange(provider.name, e.target.value)}
      />
      <p className="text-xs text-muted-foreground">{provider.description}</p>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Key className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">BYOK Settings</h1>
            <p className="text-muted-foreground">Bring Your Own Keys - Manage API keys for external services</p>
          </div>
        </div>

        <Tabs defaultValue="existing" className="space-y-6">
          <TabsList>
            <TabsTrigger value="existing">Existing</TabsTrigger>
            <TabsTrigger value="llm">LLM</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
          </TabsList>

          <TabsContent value="existing">
            <Card>
              <CardHeader>
                <CardTitle>Existing API Keys</CardTitle>
                <CardDescription>
                  Configure API keys for D-ID, Creatify, OpenRouter, and Together AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingKeys ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {existingProviders.map(renderAPIKeyField)}
                    <Button 
                      onClick={handleSaveKeys}
                      disabled={saveKeysMutation.isPending}
                      className="mt-4"
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

          <TabsContent value="llm">
            <Card>
              <CardHeader>
                <CardTitle>LLM Provider API Keys</CardTitle>
                <CardDescription>
                  Configure API keys for language model providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingKeys ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {llmProviders.map(renderAPIKeyField)}
                    <Button 
                      onClick={handleSaveKeys}
                      disabled={saveKeysMutation.isPending}
                      className="mt-4"
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

          <TabsContent value="image">
            <Card>
              <CardHeader>
                <CardTitle>Image Provider API Keys</CardTitle>
                <CardDescription>
                  Configure API keys for AI image generation services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingKeys ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {imageProviders.map(renderAPIKeyField)}
                    <Button 
                      onClick={handleSaveKeys}
                      disabled={saveKeysMutation.isPending}
                      className="mt-4"
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

          <TabsContent value="video">
            <Card>
              <CardHeader>
                <CardTitle>Video Provider API Keys</CardTitle>
                <CardDescription>
                  Configure API keys for AI video generation services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingKeys ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {videoProviders.map(renderAPIKeyField)}
                    <Button 
                      onClick={handleSaveKeys}
                      disabled={saveKeysMutation.isPending}
                      className="mt-4"
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
        </Tabs>
      </div>
    </Layout>
  );
}

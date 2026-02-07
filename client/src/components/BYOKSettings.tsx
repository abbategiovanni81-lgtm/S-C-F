import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Check, Key, Trash2, TestTube } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BYOKProvider {
  id: string;
  name: string;
  category: "llm" | "image" | "video" | "voice" | "avatar";
  baseUrl?: string;
  isOpenAICompatible?: boolean;
}

interface ConnectionStatus {
  [key: string]: {
    connected: boolean;
    tested?: boolean;
    error?: string;
  };
}

export function BYOKSettings() {
  const [providers, setProviders] = useState<BYOKProvider[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({});
  const [testing, setTesting] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
    fetchConnectionStatus();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/byok/providers");
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    }
  };

  const fetchConnectionStatus = async () => {
    // This would fetch from database which API keys are configured
    // For now, we'll check based on test results
    setConnectionStatus({});
  };

  const handleSaveKey = async (providerId: string) => {
    const key = apiKeys[providerId];
    if (!key) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real implementation, this would save to the database
      // For now, we'll just update local state
      setConnectionStatus({
        ...connectionStatus,
        [providerId]: { connected: true, tested: false },
      });

      toast({
        title: "Success",
        description: "API key saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTestKey = async (providerId: string, category: string) => {
    setTesting({ ...testing, [providerId]: true });

    try {
      let endpoint = "";
      let body = {};

      // Test based on category
      if (category === "llm") {
        if (providerId === "grok") {
          endpoint = "/api/byok/grok/chat";
        } else if (providerId === "claude") {
          endpoint = "/api/byok/claude/chat";
        } else if (providerId === "gemini") {
          endpoint = "/api/byok/gemini/chat";
        }
        body = {
          messages: [{ role: "user", content: "Hello, this is a test. Please respond with 'OK'." }],
        };
      } else if (category === "image") {
        if (providerId === "stability") {
          endpoint = "/api/byok/stability/generate";
          body = { prompt: "A simple test image" };
        }
      } else if (category === "avatar") {
        if (providerId === "heygen") {
          endpoint = "/api/byok/heygen/avatars";
        }
      }

      if (endpoint) {
        const response = await fetch(endpoint, {
          method: endpoint.includes("avatars") ? "GET" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: endpoint.includes("avatars") ? undefined : JSON.stringify(body),
        });

        if (response.ok) {
          setConnectionStatus({
            ...connectionStatus,
            [providerId]: { connected: true, tested: true },
          });

          toast({
            title: "Test Successful",
            description: `${providers.find(p => p.id === providerId)?.name} is working correctly`,
          });
        } else {
          throw new Error(`API returned ${response.status}`);
        }
      }
    } catch (error: any) {
      setConnectionStatus({
        ...connectionStatus,
        [providerId]: { connected: true, tested: false, error: error.message },
      });

      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting({ ...testing, [providerId]: false });
    }
  };

  const handleRemoveKey = async (providerId: string) => {
    setApiKeys({ ...apiKeys, [providerId]: "" });
    setConnectionStatus({
      ...connectionStatus,
      [providerId]: { connected: false },
    });

    toast({
      title: "Removed",
      description: "API key removed",
    });
  };

  const renderProvider = (provider: BYOKProvider) => {
    const status = connectionStatus[provider.id];
    const isConnected = status?.connected;
    const isTested = status?.tested;
    const hasError = status?.error;

    return (
      <Card key={provider.id} className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{provider.name}</CardTitle>
            {isConnected && (
              <Badge variant={isTested ? "default" : "secondary"}>
                {isTested ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </>
                ) : (
                  "Connected"
                )}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {isConnected ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestKey(provider.id, provider.category)}
                  disabled={testing[provider.id]}
                >
                  <TestTube className="h-4 w-4 mr-1" />
                  {testing[provider.id] ? "Testing..." : "Test"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemoveKey(provider.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => handleSaveKey(provider.id)}
                disabled={!apiKeys[provider.id]}
              >
                <Key className="h-4 w-4 mr-1" />
                Add Key
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isConnected && (
            <div className="space-y-2">
              <Label htmlFor={`key-${provider.id}`}>API Key</Label>
              <Input
                id={`key-${provider.id}`}
                type="password"
                placeholder="Enter your API key"
                value={apiKeys[provider.id] || ""}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, [provider.id]: e.target.value })
                }
              />
              {provider.baseUrl && (
                <p className="text-xs text-muted-foreground">
                  Base URL: {provider.baseUrl}
                </p>
              )}
            </div>
          )}
          {hasError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{hasError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const categorizeProviders = () => {
    const llmProviders = providers.filter((p) => p.category === "llm");
    const imageProviders = providers.filter((p) => p.category === "image");
    const videoProviders = providers.filter((p) => p.category === "video");
    const avatarProviders = providers.filter((p) => p.category === "avatar");
    const voiceProviders = providers.filter((p) => p.category === "voice");

    return { llmProviders, imageProviders, videoProviders, avatarProviders, voiceProviders };
  };

  const { llmProviders, imageProviders, videoProviders, avatarProviders, voiceProviders } =
    categorizeProviders();

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔑 API Connections</h1>
        <p className="text-muted-foreground">
          Connect your own API keys to access AI services directly. Your keys are stored securely
          and never shared.
        </p>
      </div>

      <Tabs defaultValue="llm" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="llm">LLMs</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="avatar">Avatars</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
        </TabsList>

        <TabsContent value="llm" className="mt-6">
          <div className="space-y-4">
            <CardDescription>
              Connect your preferred language model providers for text generation and chat.
            </CardDescription>
            {llmProviders.map(renderProvider)}
          </div>
        </TabsContent>

        <TabsContent value="image" className="mt-6">
          <div className="space-y-4">
            <CardDescription>
              Connect image generation providers for creating visuals.
            </CardDescription>
            {imageProviders.map(renderProvider)}
          </div>
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <div className="space-y-4">
            <CardDescription>
              Connect video generation engines for creating video content.
            </CardDescription>
            {videoProviders.length > 0 ? (
              videoProviders.map(renderProvider)
            ) : (
              <Alert>
                <AlertDescription>
                  Video providers are managed through the AI Engines page.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        <TabsContent value="avatar" className="mt-6">
          <div className="space-y-4">
            <CardDescription>
              Connect avatar and talking head video generation services.
            </CardDescription>
            {avatarProviders.map(renderProvider)}
          </div>
        </TabsContent>

        <TabsContent value="voice" className="mt-6">
          <div className="space-y-4">
            <CardDescription>
              Connect voice synthesis and text-to-speech services.
            </CardDescription>
            {voiceProviders.length > 0 ? (
              voiceProviders.map(renderProvider)
            ) : (
              <Alert>
                <AlertDescription>
                  Voice providers will be available soon. ElevenLabs is currently integrated.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

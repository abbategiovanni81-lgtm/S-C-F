import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle } from "lucide-react";

interface APIKey {
  name: string;
  key: string;
  field: string;
  description: string;
  category: string;
}

const API_KEYS: APIKey[] = [
  // Text Generation
  { name: "OpenAI", key: "openaiKey", field: "openaiKey", description: "GPT-4, DALL-E, Sora", category: "Text Generation" },
  { name: "Claude (Anthropic)", key: "anthropicKey", field: "anthropicKey", description: "Claude 3 models", category: "Text Generation" },
  { name: "Gemini (Google)", key: "geminiKey", field: "geminiKey", description: "Gemini Pro", category: "Text Generation" },
  { name: "Grok (xAI)", key: "grokKey", field: "grokKey", description: "Grok AI", category: "Text Generation" },
  
  // Image Generation
  { name: "Stability AI", key: "stabilityAiKey", field: "stabilityAiKey", description: "Stable Diffusion XL", category: "Image Generation" },
  { name: "Ideogram", key: "ideogramKey", field: "ideogramKey", description: "Text-in-image generation", category: "Image Generation" },
  { name: "Replicate", key: "replicateKey", field: "replicateKey", description: "Multi-model access", category: "Image Generation" },
  
  // Video Generation
  { name: "A2E", key: "a2eKey", field: "a2eKey", description: "Avatar videos & images", category: "Video Generation" },
  { name: "Fal.ai", key: "falKey", field: "falKey", description: "Video & image models", category: "Video Generation" },
  { name: "HeyGen", key: "heygenKey", field: "heygenKey", description: "100+ avatars (FREE tier available!)", category: "Video Generation" },
  { name: "Runway", key: "runwayKey", field: "runwayKey", description: "Gen-3 video", category: "Video Generation" },
  { name: "Kling", key: "klingKey", field: "klingKey", description: "High-quality video", category: "Video Generation" },
  { name: "Luma", key: "lumaKey", field: "lumaKey", description: "Dream Machine", category: "Video Generation" },
  
  // Voice
  { name: "ElevenLabs", key: "elevenlabsKey", field: "elevenlabsKey", description: "Voice synthesis & cloning", category: "Voice" },
  { name: "Play.ht", key: "playhtKey", field: "playhtKey", description: "900+ voices", category: "Voice" },
  
  // Aggregators
  { name: "OpenRouter", key: "openrouterKey", field: "openrouterKey", description: "Access 100+ LLMs", category: "Aggregators" },
  { name: "Together AI", key: "togetherKey", field: "togetherKey", description: "Fast inference", category: "Aggregators" },
  
  // Stock Media
  { name: "Pexels", key: "pexelsKey", field: "pexelsKey", description: "Stock photos & videos", category: "Stock Media" },
  { name: "Steve AI", key: "steveaiKey", field: "steveaiKey", description: "AI video creation", category: "Stock Media" },
];

export function BYOKSettings() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/api-keys", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveAPIKeys = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(apiKeys),
      });
      
      if (response.ok) {
        toast({
          title: "API Keys Saved",
          description: "Your API keys have been securely saved.",
        });
      } else {
        throw new Error("Failed to save API keys");
      }
    } catch (error) {
      console.error("Failed to save API keys:", error);
      toast({
        title: "Error",
        description: "Failed to save API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyChange = (field: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [field]: value }));
  };

  const groupedKeys = API_KEYS.reduce((acc, key) => {
    if (!acc[key.category]) {
      acc[key.category] = [];
    }
    acc[key.category].push(key);
    return acc;
  }, {} as Record<string, APIKey[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API Connections (BYOK)</h2>
        <p className="text-muted-foreground mt-2">
          Connect your own API keys to use AI services. Platform-provided keys are included in Premium+ tiers.
        </p>
      </div>

      {Object.entries(groupedKeys).map(([category, keys]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
            <CardDescription>
              Connect your {category.toLowerCase()} API keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {keys.map((apiKey) => (
              <div key={apiKey.field} className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={apiKey.field} className="font-semibold">
                    {apiKey.name}
                  </Label>
                  {apiKeys[apiKey.field] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{apiKey.description}</p>
                <Input
                  id={apiKey.field}
                  type="password"
                  placeholder={`Enter ${apiKey.name} API key`}
                  value={apiKeys[apiKey.field] || ""}
                  onChange={(e) => handleKeyChange(apiKey.field, e.target.value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={saveAPIKeys} disabled={saving} size="lg">
          {saving ? "Saving..." : "Save API Keys"}
        </Button>
      </div>
    </div>
  );
}

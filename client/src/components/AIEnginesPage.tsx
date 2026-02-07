import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Video, 
  Image as ImageIcon, 
  MessageSquare, 
  Check, 
  X, 
  Sparkles,
  Zap,
  Globe,
  Users
} from "lucide-react";

interface AIEngine {
  id: string;
  name: string;
  category: "video" | "image" | "text";
  provider: string;
  configured: boolean;
  capabilities?: string[];
  speed?: "fast" | "medium" | "slow";
  quality?: "standard" | "high" | "ultra";
  pricing?: string;
}

export function AIEnginesPage() {
  const [engines, setEngines] = useState<AIEngine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEngines();
  }, []);

  const fetchEngines = async () => {
    try {
      const response = await fetch("/api/ai-engines");
      const data = await response.json();
      
      // Add mock capabilities for display
      const enginesWithCapabilities = data.engines.map((engine: AIEngine) => ({
        ...engine,
        capabilities: getCapabilities(engine.id),
        speed: getSpeed(engine.id),
        quality: getQuality(engine.id),
        pricing: getPricing(engine.id),
      }));
      
      setEngines(enginesWithCapabilities);
    } catch (error) {
      console.error("Failed to fetch engines:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCapabilities = (engineId: string): string[] => {
    const capabilitiesMap: Record<string, string[]> = {
      "wan": ["Text-to-Video", "Image-to-Video", "720p/1080p", "5-10s clips"],
      "skyreels": ["Talking Avatars", "Multi-Actor", "Video Extension", "Lip-sync"],
      "runway": ["Text-to-Video", "Image-to-Video", "Video Extension", "Gen-3 Alpha"],
      "kling": ["Text-to-Video", "Image-to-Video", "Pro Mode", "High Quality"],
      "veo": ["Text-to-Video", "Google AI", "Multi-shot", "High Fidelity"],
      "luma": ["Text-to-Video", "Keyframe Control", "Loop Videos", "Dream Machine"],
      "hailuo": ["Text-to-Video", "Fast Generation", "Minimax AI"],
      "pixverse": ["Text-to-Video", "Style Control", "Quick Generation"],
      "sora": ["Text-to-Video", "Image-to-Video", "Remix", "OpenAI"],
    };
    return capabilitiesMap[engineId] || [];
  };

  const getSpeed = (engineId: string): "fast" | "medium" | "slow" => {
    const speedMap: Record<string, "fast" | "medium" | "slow"> = {
      "wan": "fast",
      "skyreels": "medium",
      "runway": "slow",
      "kling": "medium",
      "veo": "medium",
      "luma": "medium",
      "hailuo": "fast",
      "pixverse": "fast",
      "sora": "slow",
    };
    return speedMap[engineId] || "medium";
  };

  const getQuality = (engineId: string): "standard" | "high" | "ultra" => {
    const qualityMap: Record<string, "standard" | "high" | "ultra"> = {
      "wan": "high",
      "skyreels": "high",
      "runway": "ultra",
      "kling": "high",
      "veo": "ultra",
      "luma": "high",
      "hailuo": "standard",
      "pixverse": "standard",
      "sora": "ultra",
    };
    return qualityMap[engineId] || "standard";
  };

  const getPricing = (engineId: string): string => {
    const pricingMap: Record<string, string> = {
      "wan": "$0.08-0.15 per 5s",
      "skyreels": "$28/mo",
      "runway": "Enterprise",
      "kling": "$0.20 per video",
      "veo": "Pay per use",
      "luma": "$0.30 per video",
      "hailuo": "$0.15 per video",
      "pixverse": "$0.10 per video",
      "sora": "Premium",
    };
    return pricingMap[engineId] || "Contact for pricing";
  };

  const renderEngine = (engine: AIEngine) => {
    return (
      <Card key={engine.id} className={`transition-all hover:shadow-lg ${!engine.configured ? 'opacity-60' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {engine.category === "video" && <Video className="h-5 w-5" />}
                {engine.category === "image" && <ImageIcon className="h-5 w-5" />}
                {engine.category === "text" && <MessageSquare className="h-5 w-5" />}
                {engine.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                {engine.provider}
              </CardDescription>
            </div>
            <Badge variant={engine.configured ? "default" : "secondary"}>
              {engine.configured ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Ready
                </>
              ) : (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Setup Required
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Capabilities */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Capabilities
              </h4>
              <div className="flex flex-wrap gap-1">
                {engine.capabilities?.map((cap) => (
                  <Badge key={cap} variant="outline" className="text-xs">
                    {cap}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Speed
                </div>
                <Badge 
                  variant={engine.speed === "fast" ? "default" : "secondary"}
                  className="w-full justify-center"
                >
                  {engine.speed}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Quality
                </div>
                <Badge 
                  variant={engine.quality === "ultra" ? "default" : "secondary"}
                  className="w-full justify-center"
                >
                  {engine.quality}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Pricing
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {engine.pricing}
                </div>
              </div>
            </div>

            {/* Action Button */}
            {!engine.configured && (
              <Button variant="outline" className="w-full" size="sm">
                Configure API Key
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const videoEngines = engines.filter((e) => e.category === "video");

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading engines...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🎬 AI Engines</h1>
        <p className="text-muted-foreground">
          Choose from multiple AI video generation engines. Each engine has unique capabilities and
          strengths.
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Engines ({engines.length})</TabsTrigger>
          <TabsTrigger value="configured">Configured ({engines.filter(e => e.configured).length})</TabsTrigger>
          <TabsTrigger value="available">Available ({engines.filter(e => !e.configured).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {videoEngines.length === 0 ? (
            <Alert>
              <AlertDescription>No engines available at the moment.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {videoEngines.map(renderEngine)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="configured" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videoEngines.filter(e => e.configured).map(renderEngine)}
          </div>
        </TabsContent>

        <TabsContent value="available" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videoEngines.filter(e => !e.configured).map(renderEngine)}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-2">💡 Smart Engine Routing</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Our platform automatically selects the best engine for your needs based on:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Content type (talking head, landscape, motion-heavy)</li>
          <li>Duration requirements</li>
          <li>Quality vs speed tradeoffs</li>
          <li>Available API quota</li>
          <li>Cost optimization</li>
        </ul>
      </div>
    </div>
  );
}

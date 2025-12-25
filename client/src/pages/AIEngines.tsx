import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Zap, Settings, RefreshCw, Loader2, Key, Save, Trash2 } from "lucide-react";

interface AIEngineStatus {
  configured: boolean;
  name: string;
}

interface AIEnginesResponse {
  openai: AIEngineStatus;
  anthropic: AIEngineStatus;
  dalle: AIEngineStatus;
  a2e: AIEngineStatus;
  elevenlabs: AIEngineStatus;
  fal: AIEngineStatus;
  pexels: AIEngineStatus;
  steveai: AIEngineStatus;
  getty: AIEngineStatus;
}

const ENGINE_INFO: Record<string, { type: string; description: string; logo: string; badge: { bg: string; text: string }; keyName: string; apiKeyField: string; placeholder: string }> = {
  openai: {
    type: "Strategy & Copy",
    description: "Writes captions, hashtags, scripts, and content strategy using GPT-4.",
    logo: "https://images.unsplash.com/photo-1692312349581-8a5316db048c?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-emerald-500", text: "GPT" },
    keyName: "OpenAI API Key",
    apiKeyField: "openaiKey",
    placeholder: "sk-..."
  },
  anthropic: {
    type: "Strategy & Copy (Alternative)",
    description: "Claude AI for advanced reasoning, writing, and content strategy. Use as alternative to GPT-4.",
    logo: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-orange-500", text: "CL" },
    keyName: "Anthropic API Key",
    apiKeyField: "anthropicKey",
    placeholder: "sk-ant-..."
  },
  dalle: {
    type: "AI Images",
    description: "Generate stunning images from text prompts using OpenAI DALL-E 3.",
    logo: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-pink-600", text: "DE" },
    keyName: "OpenAI API Key (for DALL-E)",
    apiKeyField: "openaiKey",
    placeholder: "sk-..."
  },
  a2e: {
    type: "Avatar Videos & Images",
    description: "Create realistic avatar videos with lip-sync and AI-generated images.",
    logo: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-purple-600", text: "A2E" },
    keyName: "A2E API Key",
    apiKeyField: "a2eKey",
    placeholder: "a2e_..."
  },
  elevenlabs: {
    type: "Voice & Audio",
    description: "Generates natural voiceovers and audio from text using AI voices.",
    logo: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-zinc-900", text: "11" },
    keyName: "ElevenLabs API Key",
    apiKeyField: "elevenlabsKey",
    placeholder: "xi-..."
  },
  fal: {
    type: "Video/Image Generation",
    description: "Alternative AI video and image generation engine.",
    logo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-indigo-600", text: "FAL" },
    keyName: "Fal.ai API Key",
    apiKeyField: "falKey",
    placeholder: "fal_..."
  },
  pexels: {
    type: "B-Roll Footage",
    description: "Provides high-quality stock videos and images for B-Roll content.",
    logo: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-teal-600", text: "PX" },
    keyName: "Pexels API Key",
    apiKeyField: "pexelsKey",
    placeholder: "pexels_..."
  },
  steveai: {
    type: "Long-Form Video",
    description: "Create polished, professional videos up to 3 minutes for YouTube and educational content. Studio tier only.",
    logo: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-blue-600", text: "ST" },
    keyName: "Steve AI API Key",
    apiKeyField: "steveaiKey",
    placeholder: "steve_..."
  },
  getty: {
    type: "Premium Stock Images",
    description: "Access Getty Images' premium stock photo library. Studio tier only.",
    logo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-red-600", text: "GT" },
    keyName: "Getty Images API Key",
    apiKeyField: "gettyKey",
    placeholder: "getty_..."
  }
};

export default function AIEngines() {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  
  const { user, hasFullAccess, tier } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isPremiumOrPro = tier === "premium" || tier === "pro";

  const { data: status, isLoading, refetch, isRefetching } = useQuery<AIEnginesResponse>({
    queryKey: ["/api/ai-engines/status"],
    queryFn: async () => {
      const res = await fetch("/api/ai-engines/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch AI engines status");
      return res.json();
    },
  });

  const { data: userApiKeys } = useQuery({
    queryKey: ["/api/user/api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/user/api-keys", { credentials: "include" });
      if (!res.ok) return {};
      return res.json();
    },
    enabled: !!user?.id,
  });

  const saveKeyMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: string | null }) => {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to save API key");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-engines/status"] });
      refetch();
      toast({ title: "API key saved!", description: "Your key has been securely stored." });
      setApiKeyInput("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    },
  });

  const removeKeyMutation = useMutation({
    mutationFn: async (field: string) => {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [field]: null }),
      });
      if (!res.ok) throw new Error("Failed to remove API key");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-engines/status"] });
      refetch();
      toast({ title: "API key removed", description: "Your key has been deleted." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
    },
  });

  const engines = status ? Object.entries(status)
    .filter(([key]) => ENGINE_INFO[key]) // Only include engines that have ENGINE_INFO entries
    .map(([key, value]) => ({
      id: key,
      name: value.name,
      configured: value.configured,
      ...ENGINE_INFO[key]
    })) : [];

  const handleConfigureClick = (engineId: string) => {
    setSelectedEngine(engineId);
    setApiKeyInput("");
    setConfigDialogOpen(true);
  };

  const handleSaveKey = () => {
    if (!selectedEngine || !apiKeyInput.trim()) {
      toast({ title: "Enter API key", description: "Please enter your API key to save", variant: "destructive" });
      return;
    }
    const field = ENGINE_INFO[selectedEngine].apiKeyField;
    saveKeyMutation.mutate({ field, value: apiKeyInput.trim() });
  };

  const handleRemoveKey = () => {
    if (!selectedEngine) return;
    const field = ENGINE_INFO[selectedEngine].apiKeyField;
    removeKeyMutation.mutate(field);
  };

  const isEngineConfigured = (engineId: string) => {
    return engines.find(e => e.id === engineId)?.configured || false;
  };

  return (
    <Layout title="AI Engines">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-display font-bold mb-2" data-testid="text-page-title">Connected Intelligence</h2>
          <p className="text-muted-foreground">Manage your AI content generation pipelines and API connections.</p>
          {isPremiumOrPro && (
            <p className="text-sm text-emerald-600 mt-2">Premium/Pro: You have access to platform API keys</p>
          )}
        </div>
        <button 
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
          data-testid="button-refresh-status"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {engines.map((engine) => (
            <Card key={engine.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden" data-testid={`card-engine-${engine.id}`}>
              <div className="h-32 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                <img src={engine.logo} alt={engine.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <CardContent className="p-6 relative">
                <div className="absolute -top-10 left-6 w-16 h-16 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center z-20 overflow-hidden p-2">
                  <div className={`w-full h-full ${engine.badge.bg} rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
                    {engine.badge.text}
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl" data-testid={`text-engine-name-${engine.id}`}>{engine.name}</h3>
                    <p className="text-sm font-medium text-primary mt-1">{engine.type}</p>
                  </div>
                  {engine.configured ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-wider" data-testid={`status-engine-${engine.id}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-wider" data-testid={`status-engine-${engine.id}`}>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Not Configured</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                  {engine.description}
                </p>

                {!engine.configured && !isPremiumOrPro && (
                  <p className="text-xs text-amber-600 mt-2">
                    API key required. Click Configure to add your key.
                  </p>
                )}

                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border/50">
                  <button 
                    onClick={() => handleConfigureClick(engine.id)}
                    className="flex-1 h-9 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                    data-testid={`button-configure-${engine.id}`}
                  >
                    <Settings className="w-4 h-4" />
                    Configure
                  </button>
                  <button 
                    onClick={() => refetch()}
                    className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors" 
                    title="Test Connection"
                    data-testid={`button-test-${engine.id}`}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          <button 
            onClick={() => setAddDialogOpen(true)}
            className="h-full min-h-[300px] rounded-xl border-2 border-dashed border-border bg-secondary/20 hover:bg-secondary/50 hover:border-primary/50 flex flex-col items-center justify-center gap-4 transition-all group"
            data-testid="button-add-engine"
          >
            <div className="w-16 h-16 rounded-full bg-background shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
              <Zap className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className="font-bold text-lg text-foreground block">Add New Engine</span>
              <span className="text-sm text-muted-foreground">Connect more AI tools</span>
            </div>
          </button>
        </div>
      )}

      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure {selectedEngine && ENGINE_INFO[selectedEngine]?.badge.text}</DialogTitle>
            <DialogDescription>
              {selectedEngine && `Manage ${engines.find(e => e.id === selectedEngine)?.name} settings`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEngine && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{ENGINE_INFO[selectedEngine].keyName}</span>
                </div>
                
                {isEngineConfigured(selectedEngine) ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>API key is configured</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 text-sm mb-3">
                    <XCircle className="w-4 h-4" />
                    <span>API key not configured</span>
                  </div>
                )}

                {isPremiumOrPro && isEngineConfigured(selectedEngine) && (
                  <p className="text-xs text-muted-foreground">
                    Using platform API key (included with your subscription)
                  </p>
                )}
              </div>

              {!isPremiumOrPro && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey" className="text-sm font-medium">
                      {isEngineConfigured(selectedEngine) ? "Update API Key" : "Enter API Key"}
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder={ENGINE_INFO[selectedEngine].placeholder}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="mt-2"
                      data-testid="input-api-key"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Your API key is stored securely and never shared.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveKey}
                      disabled={!apiKeyInput.trim() || saveKeyMutation.isPending}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      data-testid="button-save-key"
                    >
                      {saveKeyMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Key
                    </button>
                    
                    {isEngineConfigured(selectedEngine) && (
                      <button
                        onClick={handleRemoveKey}
                        disabled={removeKeyMutation.isPending}
                        className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        data-testid="button-remove-key"
                      >
                        {removeKeyMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isPremiumOrPro && (
                <p className="text-sm text-muted-foreground">
                  As a {tier} subscriber, you have access to platform API keys. No configuration needed.
                </p>
              )}

              <button
                onClick={() => setConfigDialogOpen(false)}
                className="w-full mt-4 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
                data-testid="button-done"
              >
                Done
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New AI Engine</DialogTitle>
            <DialogDescription>
              Connect additional AI services
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
              <Zap className="w-8 h-8" />
            </div>
            <p className="font-medium text-lg mb-2">More Engines Coming Soon</p>
            <p className="text-sm text-muted-foreground mb-6">
              We're working on adding support for more AI services. Currently supported: OpenAI, Claude, DALL-E, A2E, ElevenLabs, Fal.ai, and Pexels.
            </p>
            <button
              onClick={() => setAddDialogOpen(false)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              data-testid="button-close-add-dialog"
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

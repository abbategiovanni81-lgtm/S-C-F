import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Zap, Settings, RefreshCw, Loader2, Key } from "lucide-react";

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
}

const ENGINE_INFO: Record<string, { type: string; description: string; logo: string; badge: { bg: string; text: string }; keyName: string }> = {
  openai: {
    type: "Strategy & Copy",
    description: "Writes captions, hashtags, scripts, and content strategy using GPT-4.",
    logo: "https://images.unsplash.com/photo-1692312349581-8a5316db048c?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-emerald-500", text: "GPT" },
    keyName: "Configured via Replit AI Integration"
  },
  anthropic: {
    type: "Strategy & Copy (Alternative)",
    description: "Claude AI for advanced reasoning, writing, and content strategy. Use as alternative to GPT-4.",
    logo: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-orange-500", text: "CL" },
    keyName: "ANTHROPIC_API_KEY (or Replit AI Integration)"
  },
  dalle: {
    type: "AI Images",
    description: "Generate stunning images from text prompts using OpenAI DALL-E 3.",
    logo: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-pink-600", text: "DE" },
    keyName: "OPENAI_DALLE_API_KEY"
  },
  a2e: {
    type: "Avatar Videos & Images",
    description: "Create realistic avatar videos with lip-sync and AI-generated images.",
    logo: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-purple-600", text: "A2E" },
    keyName: "A2E_API_KEY"
  },
  elevenlabs: {
    type: "Voice & Audio",
    description: "Generates natural voiceovers and audio from text using AI voices.",
    logo: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-zinc-900", text: "11" },
    keyName: "ELEVENLABS_API_KEY"
  },
  fal: {
    type: "Video/Image Generation",
    description: "Alternative AI video and image generation engine.",
    logo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-indigo-600", text: "FAL" },
    keyName: "FAL_API_KEY"
  },
  pexels: {
    type: "B-Roll Footage",
    description: "Provides high-quality stock videos and images for B-Roll content.",
    logo: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-teal-600", text: "PX" },
    keyName: "PEXELS_API_KEY"
  }
};

export default function AIEngines() {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: status, isLoading, refetch, isRefetching } = useQuery<AIEnginesResponse>({
    queryKey: ["/api/ai-engines/status"],
    queryFn: async () => {
      const res = await fetch("/api/ai-engines/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch AI engines status");
      return res.json();
    },
  });

  const engines = status ? Object.entries(status).map(([key, value]) => ({
    id: key,
    name: value.name,
    configured: value.configured,
    ...ENGINE_INFO[key]
  })) : [];

  const handleConfigureClick = (engineId: string) => {
    setSelectedEngine(engineId);
    setConfigDialogOpen(true);
  };

  return (
    <Layout title="AI Engines">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-display font-bold mb-2" data-testid="text-page-title">Connected Intelligence</h2>
          <p className="text-muted-foreground">Manage your AI content generation pipelines and API connections.</p>
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

                {!engine.configured && (
                  <p className="text-xs text-amber-600 mt-2">
                    API key required. Add the secret to configure this engine.
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
                  <span className="font-medium">API Key</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {ENGINE_INFO[selectedEngine].keyName}
                </p>
                {engines.find(e => e.id === selectedEngine)?.configured ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>API key is configured</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>API key not found</span>
                  </div>
                )}
              </div>
              
              {!engines.find(e => e.id === selectedEngine)?.configured && (
                <p className="text-sm text-muted-foreground">
                  To add an API key, go to the Secrets tab in your Replit project and add <code className="px-1 py-0.5 bg-secondary rounded text-xs">{ENGINE_INFO[selectedEngine].keyName}</code>
                </p>
              )}

              <button
                onClick={() => setConfigDialogOpen(false)}
                className="w-full mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
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

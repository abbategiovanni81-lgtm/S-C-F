import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Zap, Settings, RefreshCw, Loader2 } from "lucide-react";

interface AIEngineStatus {
  configured: boolean;
  name: string;
}

interface AIEnginesResponse {
  openai: AIEngineStatus;
  elevenlabs: AIEngineStatus;
  fal: AIEngineStatus;
}

const ENGINE_INFO: Record<string, { type: string; description: string; logo: string; badge: { bg: string; text: string } }> = {
  openai: {
    type: "Strategy & Copy",
    description: "Writes captions, hashtags, scripts, and content strategy using GPT-4.",
    logo: "https://images.unsplash.com/photo-1692312349581-8a5316db048c?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-emerald-500", text: "GPT" }
  },
  elevenlabs: {
    type: "Voice & Audio",
    description: "Generates natural voiceovers and audio from text using AI voices.",
    logo: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-zinc-900", text: "11" }
  },
  fal: {
    type: "Avatar Pipeline",
    description: "Handles lip-sync processing to match audio with avatar videos.",
    logo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=150&q=80",
    badge: { bg: "bg-indigo-600", text: "FAL" }
  }
};

export default function AIEngines() {
  const { data: status, isLoading, refetch, isRefetching } = useQuery<AIEnginesResponse>({
    queryKey: ["/api/ai-engines/status"],
    queryFn: async () => {
      const res = await fetch("/api/ai-engines/status");
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
                    className="flex-1 h-9 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                    data-testid={`button-configure-${engine.id}`}
                  >
                    <Settings className="w-4 h-4" />
                    Configure
                  </button>
                  <button 
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
    </Layout>
  );
}

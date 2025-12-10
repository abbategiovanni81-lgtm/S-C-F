import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_AI_ENGINES } from "@/lib/mockData";
import { CheckCircle2, Zap, Settings, RefreshCw } from "lucide-react";

export default function AIEngines() {
  return (
    <Layout title="AI Engines">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold mb-2">Connected Intelligence</h2>
        <p className="text-muted-foreground">Manage your AI content generation pipelines and API connections.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_AI_ENGINES.map((engine) => (
          <Card key={engine.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <div className="h-32 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
              <img src={engine.logo} alt={engine.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <CardContent className="p-6 relative">
              <div className="absolute -top-10 left-6 w-16 h-16 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center z-20 overflow-hidden p-2">
                {engine.name === 'OpenAI GPT-4' ? (
                  <div className="w-full h-full bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">GPT</div>
                ) : engine.name === 'ElevenLabs Studio' ? (
                  <div className="w-full h-full bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">11</div>
                ) : (
                  <div className="w-full h-full bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">S.AI</div>
                )}
              </div>
              
              <div className="mt-8 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl">{engine.name}</h3>
                  <p className="text-sm font-medium text-primary mt-1">{engine.type}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                {engine.description}
              </p>

              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border/50">
                <button className="flex-1 h-9 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configure
                </button>
                <button className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors" title="Test Connection">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        <button className="h-full min-h-[300px] rounded-xl border-2 border-dashed border-border bg-secondary/20 hover:bg-secondary/50 hover:border-primary/50 flex flex-col items-center justify-center gap-4 transition-all group">
          <div className="w-16 h-16 rounded-full bg-background shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
            <Zap className="w-8 h-8" />
          </div>
          <div className="text-center">
            <span className="font-bold text-lg text-foreground block">Add New Engine</span>
            <span className="text-sm text-muted-foreground">Connect more AI tools</span>
          </div>
        </button>
      </div>
    </Layout>
  );
}
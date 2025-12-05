import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_CHANNELS } from "@/lib/mockData";
import { Plus, CheckCircle2, AlertCircle, Twitter, Linkedin, Instagram, Facebook, Youtube } from "lucide-react";

const ICONS: Record<string, any> = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
};

export default function Accounts() {
  return (
    <Layout title="Accounts">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Add New Card */}
        <button className="h-full min-h-[200px] rounded-xl border-2 border-dashed border-border bg-secondary/20 hover:bg-secondary/50 hover:border-primary/50 flex flex-col items-center justify-center gap-4 transition-all group">
          <div className="w-12 h-12 rounded-full bg-background shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-medium text-muted-foreground group-hover:text-primary">Connect Account</span>
        </button>

        {MOCK_CHANNELS.map((channel) => {
          const Icon = ICONS[channel.platform] || Twitter;
          
          return (
            <Card key={channel.id} className="border-none shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${channel.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <CardContent className="p-6 pt-8 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-foreground">
                  <Icon className="w-8 h-8" />
                </div>
                
                <div>
                  <h3 className="font-bold text-lg">{channel.name}</h3>
                  <p className="text-sm text-muted-foreground">{channel.handle}</p>
                </div>

                <div className="flex items-center gap-6 w-full pt-4 border-t border-border/50 mt-2">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Followers</p>
                    <p className="font-bold text-lg">{channel.followers}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</p>
                    <div className={`flex items-center justify-center gap-1.5 mt-1 text-sm font-medium ${
                      channel.status === 'connected' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {channel.status === 'connected' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span className="capitalize">{channel.status}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}
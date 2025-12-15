import { Layout } from "@/components/layout/Layout";
import { Plus, Twitter, Linkedin, Instagram, Facebook, Youtube } from "lucide-react";

export default function Accounts() {
  return (
    <Layout title="Accounts">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold mb-2" data-testid="text-page-title">Connected Accounts</h2>
        <p className="text-muted-foreground">Connect your social media accounts to schedule and publish content.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <button 
          className="h-full min-h-[200px] rounded-xl border-2 border-dashed border-border bg-secondary/20 hover:bg-secondary/50 hover:border-primary/50 flex flex-col items-center justify-center gap-4 transition-all group"
          data-testid="button-connect-account"
        >
          <div className="w-12 h-12 rounded-full bg-background shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-medium text-muted-foreground group-hover:text-primary">Connect Account</span>
        </button>

        <div className="min-h-[200px] rounded-xl border border-border/50 bg-secondary/10 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500">
              <Twitter className="w-5 h-5" />
            </div>
            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
              <Instagram className="w-5 h-5" />
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-700/10 flex items-center justify-center text-blue-700">
              <Linkedin className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="font-medium text-foreground">No accounts connected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your social accounts to start posting
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-display font-bold mb-4">Supported Platforms</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: "Twitter/X", icon: Twitter, color: "bg-sky-500" },
            { name: "Instagram", icon: Instagram, color: "bg-pink-500" },
            { name: "LinkedIn", icon: Linkedin, color: "bg-blue-700" },
            { name: "Facebook", icon: Facebook, color: "bg-blue-600" },
            { name: "YouTube", icon: Youtube, color: "bg-red-500" },
          ].map((platform) => (
            <div 
              key={platform.name}
              className="p-4 rounded-lg bg-secondary/30 border border-border/50 flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center text-white`}>
                <platform.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">{platform.name}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Account connections coming soon. For now, you can generate content and copy it to your platforms.
        </p>
      </div>
    </Layout>
  );
}

import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Twitter, Linkedin, Instagram, Facebook, Youtube, ExternalLink } from "lucide-react";

const PLATFORMS = [
  { name: "Twitter/X", icon: Twitter, color: "bg-sky-500", hoverColor: "hover:bg-sky-600" },
  { name: "Instagram", icon: Instagram, color: "bg-pink-500", hoverColor: "hover:bg-pink-600" },
  { name: "LinkedIn", icon: Linkedin, color: "bg-blue-700", hoverColor: "hover:bg-blue-800" },
  { name: "Facebook", icon: Facebook, color: "bg-blue-600", hoverColor: "hover:bg-blue-700" },
  { name: "YouTube", icon: Youtube, color: "bg-red-500", hoverColor: "hover:bg-red-600" },
];

export default function Accounts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const handlePlatformSelect = (platformName: string) => {
    setSelectedPlatform(platformName);
  };

  return (
    <Layout title="Accounts">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold mb-2" data-testid="text-page-title">Connected Accounts</h2>
        <p className="text-muted-foreground">Connect your social media accounts to schedule and publish content.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <button 
          onClick={() => setDialogOpen(true)}
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
              Click "Connect Account" to get started
            </p>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Social Account</DialogTitle>
            <DialogDescription>
              {selectedPlatform 
                ? `Connect your ${selectedPlatform} account`
                : "Choose a platform to connect"
              }
            </DialogDescription>
          </DialogHeader>
          
          {!selectedPlatform ? (
            <div className="grid grid-cols-1 gap-3 py-4">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handlePlatformSelect(platform.name)}
                  className={`flex items-center gap-4 p-4 rounded-lg ${platform.color} ${platform.hoverColor} text-white transition-colors`}
                  data-testid={`button-connect-${platform.name.toLowerCase().replace('/', '-')}`}
                >
                  <platform.icon className="w-6 h-6" />
                  <span className="font-medium">Connect {platform.name}</span>
                  <ExternalLink className="w-4 h-4 ml-auto opacity-70" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-4">
                <ExternalLink className="w-8 h-8" />
              </div>
              <p className="font-medium text-lg mb-2">Coming Soon</p>
              <p className="text-sm text-muted-foreground mb-6">
                {selectedPlatform} integration is under development. For now, you can generate content and manually post it to your accounts.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
                  data-testid="button-back"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setDialogOpen(false);
                    setSelectedPlatform(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  data-testid="button-close-dialog"
                >
                  Got it
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

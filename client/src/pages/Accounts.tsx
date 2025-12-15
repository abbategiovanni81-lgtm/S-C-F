import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Twitter, Linkedin, Instagram, Facebook, Youtube, Trash2, Loader2 } from "lucide-react";
import type { SocialAccount } from "@shared/schema";

const DEMO_USER_ID = "demo-user";

const PLATFORMS = [
  { name: "YouTube", icon: Youtube, color: "bg-red-500", hoverColor: "hover:bg-red-600", textColor: "text-red-500", bgLight: "bg-red-500/10", oauth: true },
  { name: "Twitter/X", icon: Twitter, color: "bg-sky-500", hoverColor: "hover:bg-sky-600", textColor: "text-sky-500", bgLight: "bg-sky-500/10", oauth: false },
  { name: "Instagram", icon: Instagram, color: "bg-pink-500", hoverColor: "hover:bg-pink-600", textColor: "text-pink-500", bgLight: "bg-pink-500/10", oauth: false },
  { name: "LinkedIn", icon: Linkedin, color: "bg-blue-700", hoverColor: "hover:bg-blue-800", textColor: "text-blue-700", bgLight: "bg-blue-700/10", oauth: false },
  { name: "Facebook", icon: Facebook, color: "bg-blue-600", hoverColor: "hover:bg-blue-700", textColor: "text-blue-600", bgLight: "bg-blue-600/10", oauth: false },
  { name: "TikTok", icon: null, color: "bg-black", hoverColor: "hover:bg-gray-800", textColor: "text-black", bgLight: "bg-black/10", oauth: false },
];

export default function Accounts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountHandle, setAccountHandle] = useState("");
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery<SocialAccount[]>({
    queryKey: [`/api/social-accounts?userId=${DEMO_USER_ID}`],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { platform: string; accountName: string; accountHandle: string }) => {
      return await apiRequest("POST", "/api/social-accounts", {
        userId: DEMO_USER_ID,
        platform: data.platform,
        accountName: data.accountName,
        accountHandle: data.accountHandle || null,
        profileUrl: null,
        isConnected: "added",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/social-accounts?userId=${DEMO_USER_ID}`] });
      setDialogOpen(false);
      setSelectedPlatform(null);
      setAccountName("");
      setAccountHandle("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/social-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/social-accounts?userId=${DEMO_USER_ID}`] });
    },
  });

  const handlePlatformSelect = (platformName: string) => {
    const platform = PLATFORMS.find(p => p.name === platformName);
    if (platform?.oauth) {
      // Redirect to OAuth flow
      window.location.href = "/api/auth/google";
    } else {
      setSelectedPlatform(platformName);
    }
  };

  const handleAddAccount = () => {
    if (!selectedPlatform || !accountName.trim()) return;
    createMutation.mutate({
      platform: selectedPlatform,
      accountName: accountName.trim(),
      accountHandle: accountHandle.trim(),
    });
  };

  const getPlatformInfo = (platformName: string) => {
    return PLATFORMS.find(p => p.name === platformName) || PLATFORMS[0];
  };

  return (
    <Layout title="Accounts">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold mb-2" data-testid="text-page-title">Social Channels</h2>
        <p className="text-muted-foreground">Add your social media channels to manage content across platforms.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <button 
            onClick={() => setDialogOpen(true)}
            className="h-full min-h-[200px] rounded-xl border-2 border-dashed border-border bg-secondary/20 hover:bg-secondary/50 hover:border-primary/50 flex flex-col items-center justify-center gap-4 transition-all group"
            data-testid="button-add-channel"
          >
            <div className="w-12 h-12 rounded-full bg-background shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium text-muted-foreground group-hover:text-primary">Add Channel</span>
          </button>

          {accounts.map((account) => {
            const platformInfo = getPlatformInfo(account.platform);
            const IconComponent = platformInfo.icon;
            
            return (
              <Card key={account.id} className="min-h-[200px] relative group" data-testid={`card-account-${account.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-full ${platformInfo.bgLight} flex items-center justify-center ${platformInfo.textColor}`}>
                      {IconComponent ? (
                        <IconComponent className="w-6 h-6" />
                      ) : (
                        <span className="font-bold text-lg">T</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(account.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${account.id}`}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1" data-testid={`text-account-name-${account.id}`}>
                    {account.accountName}
                  </CardTitle>
                  {account.accountHandle && (
                    <p className="text-sm text-muted-foreground" data-testid={`text-account-handle-${account.id}`}>
                      @{account.accountHandle}
                    </p>
                  )}
                  <p className={`text-sm font-medium mt-3 ${platformInfo.textColor}`}>
                    {account.platform}
                  </p>
                  <div className="mt-2">
                    {account.isConnected === "connected" ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">
                        Connected
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600">
                        Manual posting
                      </span>
                    )}
                  </div>
                  {account.platform === "YouTube" && account.isConnected === "connected" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 text-xs"
                      onClick={() => window.location.href = "/api/auth/google"}
                      data-testid={`button-add-another-youtube-${account.id}`}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Another Channel
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {accounts.length === 0 && (
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
                <p className="font-medium text-foreground">No channels added</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Add Channel" to get started
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setSelectedPlatform(null);
          setAccountName("");
          setAccountHandle("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPlatform ? `Add ${selectedPlatform} Channel` : "Add Social Channel"}</DialogTitle>
            <DialogDescription>
              {selectedPlatform 
                ? "Enter your account details"
                : "Choose a platform to add"
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
                  data-testid={`button-select-${platform.name.toLowerCase().replace('/', '-')}`}
                >
                  {platform.icon ? (
                    <platform.icon className="w-6 h-6" />
                  ) : (
                    <span className="w-6 h-6 flex items-center justify-center font-bold">T</span>
                  )}
                  <span className="font-medium">{platform.name}</span>
                  {platform.oauth && (
                    <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded">Connect with Google</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  placeholder="My Business Account"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  data-testid="input-account-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHandle">Handle (optional)</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    @
                  </span>
                  <Input
                    id="accountHandle"
                    className="rounded-l-none"
                    placeholder="username"
                    value={accountHandle}
                    onChange={(e) => setAccountHandle(e.target.value)}
                    data-testid="input-account-handle"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedPlatform(null)}
                  data-testid="button-back"
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddAccount}
                  disabled={!accountName.trim() || createMutation.isPending}
                  data-testid="button-save-account"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Add Channel"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

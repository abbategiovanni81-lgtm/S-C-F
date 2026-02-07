import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Link as LinkIcon
} from "lucide-react";

interface PlatformConnection {
  id: string;
  name: string;
  icon: React.ElementType;
  connected: boolean;
  account?: string;
  gradient: string;
}

export default function OAuthConnections() {
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([
    {
      id: "tiktok",
      name: "TikTok",
      icon: () => <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center text-white text-xs font-bold">TT</div>,
      connected: false,
      gradient: "from-black to-cyan-500",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      connected: true,
      account: "@mybrand",
      gradient: "from-purple-600 via-pink-500 to-orange-400",
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: Youtube,
      connected: false,
      gradient: "from-red-600 to-red-700",
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: Twitter,
      connected: false,
      gradient: "from-black to-slate-700",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      connected: false,
      gradient: "from-blue-600 to-blue-700",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      connected: false,
      gradient: "from-blue-700 to-blue-800",
    },
  ]);

  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnect = (platformId: string) => {
    setIsConnecting(platformId);
    
    // Simulate OAuth flow
    setTimeout(() => {
      setPlatforms(platforms.map(p => 
        p.id === platformId 
          ? { ...p, connected: true, account: `@user_${platformId}` }
          : p
      ));
      setIsConnecting(null);
    }, 2000);
  };

  const handleDisconnect = (platformId: string) => {
    setPlatforms(platforms.map(p => 
      p.id === platformId 
        ? { ...p, connected: false, account: undefined }
        : p
    ));
  };

  const connectedCount = platforms.filter(p => p.connected).length;
  const totalCount = platforms.length;

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-blue-700/50">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <LinkIcon className="w-8 h-8 text-blue-400" />
                Connect Your Accounts
              </CardTitle>
              <CardDescription className="text-lg">
                Link your social media accounts to schedule and publish content directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
                    style={{ width: `${(connectedCount / totalCount) * 100}%` }}
                  />
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  {connectedCount}/{totalCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Alert className="bg-blue-900/20 border-blue-700/50">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertTitle className="text-blue-400">Secure OAuth 2.0</AlertTitle>
            <AlertDescription className="text-slate-300">
              We use industry-standard OAuth 2.0 for secure authentication. Your credentials are never stored on our servers.
            </AlertDescription>
          </Alert>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isLoading = isConnecting === platform.id;

              return (
                <Card 
                  key={platform.id}
                  className={`relative overflow-hidden transition-all ${
                    platform.connected 
                      ? "border-green-600 shadow-lg shadow-green-500/20" 
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  {/* Gradient Background */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${platform.gradient}`} />

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${platform.gradient} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{platform.name}</CardTitle>
                          {platform.connected && platform.account && (
                            <CardDescription className="text-green-400">
                              {platform.account}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      
                      {platform.connected ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {platform.connected ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>Connected and ready to post</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            size="sm"
                            onClick={() => handleConnect(platform.id)}
                            disabled={isLoading}
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="flex-1"
                            size="sm"
                            onClick={() => handleDisconnect(platform.id)}
                          >
                            Disconnect
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-400">
                          Connect your {platform.name} account to start posting
                        </p>
                        <Button 
                          className="w-full"
                          onClick={() => handleConnect(platform.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <LinkIcon className="w-4 h-4 mr-2" />
                              Connect {platform.name}
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Features List */}
          <Card className="bg-slate-800/50">
            <CardHeader>
              <CardTitle>What You Can Do After Connecting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Direct Publishing</h4>
                    <p className="text-sm text-slate-400">
                      Post content directly from SocialCommand to your accounts
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Schedule Posts</h4>
                    <p className="text-sm text-slate-400">
                      Plan and schedule your content in advance
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Cross-Platform Posting</h4>
                    <p className="text-sm text-slate-400">
                      Publish the same content to multiple platforms at once
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Analytics & Insights</h4>
                    <p className="text-sm text-slate-400">
                      Track performance across all your connected accounts
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

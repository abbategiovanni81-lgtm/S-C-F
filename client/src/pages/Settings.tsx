import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { Settings as SettingsIcon, Key, Youtube, User, LogOut, Check, X } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: aiStatus } = useQuery({
    queryKey: ["/api/ai-engines/status"],
    queryFn: async () => {
      const res = await fetch("/api/ai-engines/status");
      return res.json();
    },
  });

  const { data: youtubeAccounts } = useQuery({
    queryKey: ["/api/social-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/social-accounts?userId=" + user?.id);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const youtubeConnected = youtubeAccounts?.some((acc: any) => acc.platform === "youtube" && acc.isConnected === "connected");

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and API connections</p>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList>
            <TabsTrigger value="account" data-testid="tab-account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="api-keys" data-testid="tab-api-keys">
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="youtube" data-testid="tab-youtube">
              <Youtube className="h-4 w-4 mr-2" />
              YouTube
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your profile details from your login provider</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {user?.profileImageUrl && (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full"
                      data-testid="img-profile"
                    />
                  )}
                  <div>
                    <p className="font-medium text-lg" data-testid="text-user-name">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-muted-foreground" data-testid="text-user-email">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => logout()}
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys">
            <Card>
              <CardHeader>
                <CardTitle>AI Service Status</CardTitle>
                <CardDescription>
                  These API keys are configured at the platform level. Contact the administrator to update them.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiStatus && Object.entries(aiStatus).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{value.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{key}</p>
                      </div>
                      <Badge variant={value.configured ? "default" : "secondary"}>
                        {value.configured ? (
                          <><Check className="h-3 w-3 mr-1" /> Connected</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" /> Not Configured</>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Your API Keys (Coming Soon)</CardTitle>
                <CardDescription>
                  In the future, you'll be able to add your own API keys here to use your own quotas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 opacity-50">
                  <div className="space-y-2">
                    <Label>OpenAI API Key</Label>
                    <Input type="password" placeholder="sk-..." disabled data-testid="input-openai-key" />
                  </div>
                  <div className="space-y-2">
                    <Label>ElevenLabs API Key</Label>
                    <Input type="password" placeholder="Your ElevenLabs key" disabled data-testid="input-elevenlabs-key" />
                  </div>
                  <div className="space-y-2">
                    <Label>A2E API Key</Label>
                    <Input type="password" placeholder="Your A2E key" disabled data-testid="input-a2e-key" />
                  </div>
                  <Button disabled>Save API Keys</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="youtube">
            <Card>
              <CardHeader>
                <CardTitle>YouTube Connection</CardTitle>
                <CardDescription>
                  Connect your YouTube channel to enable video uploads and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {youtubeConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">YouTube is connected</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You can manage your connected accounts in the Accounts page.
                    </p>
                    <Button variant="outline" asChild>
                      <a href="/accounts" data-testid="link-manage-accounts">Manage Accounts</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Connect your YouTube channel to upload videos directly and view analytics.
                    </p>
                    <Button asChild>
                      <a href="/accounts" data-testid="link-connect-youtube">
                        <Youtube className="h-4 w-4 mr-2" />
                        Connect YouTube
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Users, Crown, User, Loader2, FileText, Video, Image, Mic, Calendar, Link2, DollarSign } from "lucide-react";
import { Redirect } from "wouter";

interface UserStats {
  brandBriefs: number;
  scripts: number;
  voiceovers: number;
  videos: number;
  images: number;
  connectedAccounts: number;
  scheduledPosts: number;
  estimatedCost: number;
}

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  tier: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  lastLogin: string | null;
  createdAt: string;
  stats: UserStats;
}

export default function Admin() {
  const { tier, user, isOwner } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  
  const { data, isLoading, error } = useQuery<{ users: AdminUser[] }>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 403) throw new Error("Access denied");
        throw new Error("Failed to fetch users");
      }
      return res.json();
    },
    retry: false,
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/tier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tier }),
      });
      if (!res.ok) throw new Error("Failed to update tier");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Tier updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update tier", description: error.message, variant: "destructive" });
    },
  });

  if (!isOwner) {
    return <Redirect to="/dashboard" />;
  }

  const getTierBadge = (userTier: string) => {
    switch (userTier) {
      case "pro":
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500"><Crown className="h-3 w-3 mr-1" /> Pro</Badge>;
      case "premium":
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500"><Crown className="h-3 w-3 mr-1" /> Premium</Badge>;
      default:
        return <Badge variant="secondary"><User className="h-3 w-3 mr-1" /> Free</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalCost = data?.users?.reduce((sum, u) => sum + (u.stats?.estimatedCost || 0), 0) || 0;

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage users and monitor usage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{data?.users?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{data?.users?.filter(u => u.tier === "premium").length || 0}</p>
                  <p className="text-sm text-muted-foreground">Premium Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">{data?.users?.filter(u => u.tier === "free").length || 0}</p>
                  <p className="text-sm text-muted-foreground">Free Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Est. AI Costs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>
              Click on a user to see detailed stats
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                {(error as Error).message}
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {data?.users?.map((u) => (
                  <div key={u.id} data-testid={`user-row-${u.id}`}>
                    <div 
                      className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          {getTierBadge(u.tier)}
                          {u.stats?.estimatedCost > 0 && (
                            <Badge variant="outline" className="text-green-600">
                              ${u.stats.estimatedCost.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                          <span>Last login: {formatDate(u.lastLogin)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.email !== "gio.abbate@hotmail.com" && (
                          <Select
                            value={u.tier}
                            onValueChange={(value) => {
                              updateTierMutation.mutate({ userId: u.id, tier: value });
                            }}
                            disabled={updateTierMutation.isPending}
                          >
                            <SelectTrigger 
                              className="w-32" 
                              data-testid={`select-tier-${u.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                    
                    {expandedUser === u.id && u.stats && (
                      <div className="px-4 pb-4 pt-2 bg-muted/30 border-t">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <StatItem icon={<FileText className="h-4 w-4" />} label="Brand Briefs" value={u.stats.brandBriefs} />
                          <StatItem icon={<FileText className="h-4 w-4" />} label="Scripts" value={u.stats.scripts} />
                          <StatItem icon={<Mic className="h-4 w-4" />} label="Voiceovers" value={u.stats.voiceovers} />
                          <StatItem icon={<Video className="h-4 w-4" />} label="Videos" value={u.stats.videos} />
                          <StatItem icon={<Image className="h-4 w-4" />} label="Images" value={u.stats.images} />
                          <StatItem icon={<Link2 className="h-4 w-4" />} label="Accounts" value={u.stats.connectedAccounts} />
                          <StatItem icon={<Calendar className="h-4 w-4" />} label="Scheduled" value={u.stats.scheduledPosts} />
                          <StatItem 
                            icon={<DollarSign className="h-4 w-4" />} 
                            label="Est. Cost" 
                            value={`$${u.stats.estimatedCost.toFixed(2)}`}
                            highlight={u.stats.estimatedCost > 0}
                          />
                        </div>
                        {u.stripeSubscriptionId && (
                          <p className="text-xs text-muted-foreground mt-3">
                            Stripe Subscription: {u.stripeSubscriptionId}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function StatItem({ 
  icon, 
  label, 
  value, 
  highlight 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${highlight ? 'bg-green-50 dark:bg-green-950' : 'bg-background'}`}>
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className={`font-semibold ${highlight ? 'text-green-600' : ''}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

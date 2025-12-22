import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Users, Crown, User, Loader2 } from "lucide-react";
import { Redirect } from "wouter";

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  tier: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
}

export default function Admin() {
  const { tier, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  if (tier !== "owner") {
    return <Redirect to="/dashboard" />;
  }

  const getTierBadge = (userTier: string) => {
    switch (userTier) {
      case "owner":
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500"><Crown className="h-3 w-3 mr-1" /> Owner</Badge>;
      case "premium":
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500"><Crown className="h-3 w-3 mr-1" /> Premium</Badge>;
      default:
        return <Badge variant="secondary"><User className="h-3 w-3 mr-1" /> Free</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage users and subscriptions</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>
              View all users and manage their subscription tiers
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
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Total users: {data?.users?.length || 0}
                </div>
                <div className="border rounded-lg divide-y">
                  {data?.users?.map((u) => (
                    <div key={u.id} className="p-4 flex items-center justify-between gap-4" data-testid={`user-row-${u.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          {getTierBadge(u.tier)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(u.createdAt).toLocaleDateString()}
                          {u.stripeSubscriptionId && " • Has Stripe subscription"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.tier !== "owner" && (
                          <Select
                            value={u.tier}
                            onValueChange={(value) => updateTierMutation.mutate({ userId: u.id, tier: value })}
                            disabled={updateTierMutation.isPending}
                          >
                            <SelectTrigger className="w-32" data-testid={`select-tier-${u.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

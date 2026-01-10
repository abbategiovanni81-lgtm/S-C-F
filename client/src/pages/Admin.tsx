import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Users, Crown, User, Loader2, FileText, Video, Image, Mic, Calendar, Link2, DollarSign, Plus, Pencil, Trash2, Eye, Globe } from "lucide-react";
import { Redirect } from "wouter";

interface Blog {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  heroImageUrl: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  authorName: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

interface UserStats {
  brandBriefs: number;
  scripts: number;
  voiceovers: number;
  a2eVideos: number;
  lipsync: number;
  avatars: number;
  dalleImages: number;
  soraVideos: number;
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
  const [blogDialogOpen, setBlogDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [blogForm, setBlogForm] = useState({
    title: "",
    slug: "",
    summary: "",
    body: "",
    heroImageUrl: "",
    metaDescription: "",
    metaKeywords: "",
    authorName: "",
    status: "draft"
  });

  const resetBlogForm = () => {
    setBlogForm({
      title: "",
      slug: "",
      summary: "",
      body: "",
      heroImageUrl: "",
      metaDescription: "",
      metaKeywords: "",
      authorName: "",
      status: "draft"
    });
    setEditingBlog(null);
  };
  
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

  const { data: blogsData, isLoading: blogsLoading } = useQuery<{ blogs: Blog[] }>({
    queryKey: ["/api/admin/blogs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blogs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch blogs");
      return res.json();
    },
  });

  const saveBlogMutation = useMutation({
    mutationFn: async (data: typeof blogForm & { id?: string }) => {
      const url = data.id ? `/api/admin/blogs/${data.id}` : "/api/admin/blogs";
      const method = data.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save blog");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blogs"] });
      toast({ title: editingBlog ? "Blog updated" : "Blog created" });
      setBlogDialogOpen(false);
      resetBlogForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to save blog", description: error.message, variant: "destructive" });
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete blog");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blogs"] });
      toast({ title: "Blog deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete blog", description: error.message, variant: "destructive" });
    },
  });

  const openEditBlog = (blog: Blog) => {
    setEditingBlog(blog);
    setBlogForm({
      title: blog.title,
      slug: blog.slug,
      summary: blog.summary || "",
      body: blog.body,
      heroImageUrl: blog.heroImageUrl || "",
      metaDescription: blog.metaDescription || "",
      metaKeywords: blog.metaKeywords || "",
      authorName: blog.authorName || "",
      status: blog.status
    });
    setBlogDialogOpen(true);
  };

  const handleSaveBlog = () => {
    saveBlogMutation.mutate(editingBlog ? { ...blogForm, id: editingBlog.id } : blogForm);
  };

  if (!isOwner) {
    return <Redirect to="/dashboard" />;
  }

  const getTierBadge = (userTier: string) => {
    switch (userTier) {
      case "studio":
        return <Badge className="bg-gradient-to-r from-pink-600 to-red-600"><Crown className="h-3 w-3 mr-1" /> Studio</Badge>;
      case "pro":
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500"><Crown className="h-3 w-3 mr-1" /> Pro</Badge>;
      case "premium":
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500"><Crown className="h-3 w-3 mr-1" /> Premium</Badge>;
      case "core":
        return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500"><User className="h-3 w-3 mr-1" /> Core</Badge>;
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

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{data?.users?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-pink-600" />
                <div>
                  <p className="text-2xl font-bold">{data?.users?.filter(u => u.tier === "studio").length || 0}</p>
                  <p className="text-sm text-muted-foreground">Studio</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{data?.users?.filter(u => u.tier === "pro").length || 0}</p>
                  <p className="text-sm text-muted-foreground">Pro</p>
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
                  <p className="text-sm text-muted-foreground">Premium</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-500" />
                <div>
                  <p className="text-2xl font-bold">{data?.users?.filter(u => u.tier === "core").length || 0}</p>
                  <p className="text-sm text-muted-foreground">Core</p>
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
                  <p className="text-sm text-muted-foreground">AI Costs</p>
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
                              <SelectItem value="core">Core (£9.99)</SelectItem>
                              <SelectItem value="premium">Premium (£29.99)</SelectItem>
                              <SelectItem value="pro">Pro (£49.99)</SelectItem>
                              <SelectItem value="studio">Studio (£99.99) - Early Adopter</SelectItem>
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
                          <StatItem icon={<Video className="h-4 w-4" />} label="A2E Videos" value={u.stats.a2eVideos} />
                          <StatItem icon={<Video className="h-4 w-4" />} label="Lipsync" value={u.stats.lipsync} />
                          <StatItem icon={<Video className="h-4 w-4" />} label="Avatars" value={u.stats.avatars} />
                          <StatItem icon={<Image className="h-4 w-4" />} label="DALL-E Images" value={u.stats.dalleImages} />
                          <StatItem icon={<Video className="h-4 w-4" />} label="Sora Videos" value={u.stats.soraVideos} />
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

        {/* SEO Blog Manager */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-500" />
                <CardTitle>SEO Blog Manager</CardTitle>
              </div>
              <Dialog open={blogDialogOpen} onOpenChange={(open) => {
                setBlogDialogOpen(open);
                if (!open) resetBlogForm();
              }}>
                <DialogTrigger asChild>
                  <ResponsiveTooltip content="Create new blog">
                    <Button size="sm" data-testid="button-new-blog">
                      <Plus className="h-4 w-4 mr-2" /> New Blog
                    </Button>
                  </ResponsiveTooltip>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingBlog ? "Edit Blog" : "Create New Blog"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={blogForm.title}
                          onChange={(e) => {
                            setBlogForm(prev => ({
                              ...prev,
                              title: e.target.value,
                              slug: prev.slug || slugify(e.target.value)
                            }));
                          }}
                          placeholder="Blog post title"
                          data-testid="input-blog-title"
                        />
                      </div>
                      <div>
                        <Label>URL Slug *</Label>
                        <Input
                          value={blogForm.slug}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, slug: e.target.value }))}
                          placeholder="url-friendly-slug"
                          data-testid="input-blog-slug"
                        />
                        <p className="text-xs text-muted-foreground mt-1">/blog/{blogForm.slug || "your-slug"}</p>
                      </div>
                    </div>

                    <div>
                      <Label>Summary</Label>
                      <Textarea
                        value={blogForm.summary}
                        onChange={(e) => setBlogForm(prev => ({ ...prev, summary: e.target.value }))}
                        placeholder="Brief description for blog listings..."
                        rows={2}
                        data-testid="input-blog-summary"
                      />
                    </div>

                    <div>
                      <Label>Content (Markdown) *</Label>
                      <Textarea
                        value={blogForm.body}
                        onChange={(e) => setBlogForm(prev => ({ ...prev, body: e.target.value }))}
                        placeholder="Write your blog content in Markdown..."
                        rows={10}
                        className="font-mono text-sm"
                        data-testid="input-blog-body"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Hero Image URL</Label>
                        <Input
                          value={blogForm.heroImageUrl}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                          placeholder="https://example.com/image.jpg"
                          data-testid="input-blog-hero"
                        />
                      </div>
                      <div>
                        <Label>Author Name</Label>
                        <Input
                          value={blogForm.authorName}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, authorName: e.target.value }))}
                          placeholder="Author name"
                          data-testid="input-blog-author"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground">SEO Meta Tags</h4>
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea
                          value={blogForm.metaDescription}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                          placeholder="SEO description for search results (150-160 chars)"
                          rows={2}
                          maxLength={160}
                          data-testid="input-blog-meta-desc"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                          {blogForm.metaDescription.length}/160 characters
                        </p>
                      </div>
                      <div>
                        <Label>Meta Keywords</Label>
                        <Input
                          value={blogForm.metaKeywords}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, metaKeywords: e.target.value }))}
                          placeholder="keyword1, keyword2, keyword3"
                          data-testid="input-blog-keywords"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t">
                      <div className="flex-1">
                        <Label>Status</Label>
                        <Select value={blogForm.status} onValueChange={(value) => setBlogForm(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger data-testid="select-blog-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 pt-6">
                        <ResponsiveTooltip content="Discard changes">
                          <Button variant="outline" onClick={() => setBlogDialogOpen(false)}>Cancel</Button>
                        </ResponsiveTooltip>
                        <ResponsiveTooltip content="Save blog post">
                          <Button 
                            onClick={handleSaveBlog}
                            disabled={!blogForm.title || !blogForm.slug || !blogForm.body || saveBlogMutation.isPending}
                            data-testid="button-save-blog"
                          >
                            {saveBlogMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {editingBlog ? "Update Blog" : "Create Blog"}
                          </Button>
                        </ResponsiveTooltip>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>Create and manage SEO blog posts for the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {blogsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !blogsData?.blogs?.length ? (
              <p className="text-center text-muted-foreground py-8">No blogs yet. Create your first blog post!</p>
            ) : (
              <div className="border rounded-lg divide-y">
                {blogsData.blogs.map((blog) => (
                  <div key={blog.id} className="p-4 flex items-center justify-between gap-4" data-testid={`blog-row-${blog.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{blog.title}</p>
                        <Badge variant={blog.status === "published" ? "default" : "secondary"}>
                          {blog.status === "published" ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">/blog/{blog.slug}</p>
                      <p className="text-xs text-muted-foreground">
                        {blog.status === "published" && blog.publishedAt 
                          ? `Published: ${new Date(blog.publishedAt).toLocaleDateString()}`
                          : `Created: ${new Date(blog.createdAt).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {blog.status === "published" && (
                        <ResponsiveTooltip content="View blog post">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/blog/${blog.slug}`, "_blank")}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ResponsiveTooltip>
                      )}
                      <ResponsiveTooltip content="Edit blog post">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditBlog(blog)}
                          title="Edit"
                          data-testid={`button-edit-blog-${blog.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </ResponsiveTooltip>
                      <ResponsiveTooltip content="Delete blog post">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this blog?")) {
                              deleteBlogMutation.mutate(blog.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Delete"
                          data-testid={`button-delete-blog-${blog.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </ResponsiveTooltip>
                    </div>
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

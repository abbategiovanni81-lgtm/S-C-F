import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, RefreshCw, FileText, Video, Hash, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedContent } from "@shared/schema";

export default function ContentQueue() {
  const queryClient = useQueryClient();

  const { data: pendingContent = [], isLoading: loadingPending } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=pending"],
  });

  const { data: approvedContent = [], isLoading: loadingApproved } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=approved"],
  });

  const { data: rejectedContent = [], isLoading: loadingRejected } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content?status=rejected"],
  });

  const invalidateContentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=pending"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=approved"] });
    queryClient.invalidateQueries({ queryKey: ["/api/content?status=rejected"] });
  };

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/content/${id}/approve`);
    },
    onSuccess: invalidateContentQueries,
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/content/${id}/reject`);
    },
    onSuccess: invalidateContentQueries,
  });

  const ContentCard = ({ content, showActions = true }: { content: GeneratedContent; showActions?: boolean }) => (
    <Card key={content.id} className="border shadow-sm hover:shadow-md transition-shadow" data-testid={`card-content-${content.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize" data-testid={`badge-type-${content.id}`}>
              {content.contentType}
            </Badge>
            <Badge 
              variant={content.status === "approved" ? "default" : content.status === "rejected" ? "destructive" : "secondary"}
              data-testid={`badge-status-${content.id}`}
            >
              {content.status}
            </Badge>
          </div>
          <div className="flex gap-1">
            {content.platforms.map((platform) => (
              <span
                key={platform}
                className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                data-testid={`text-platform-${content.id}-${platform}`}
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {content.script && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Video className="w-4 h-4" />
              Script
            </div>
            <p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap" data-testid={`text-script-${content.id}`}>
              {content.script}
            </p>
          </div>
        )}
        
        {content.caption && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="w-4 h-4" />
              Caption
            </div>
            <p className="text-sm bg-muted/50 rounded-lg p-3" data-testid={`text-caption-${content.id}`}>
              {content.caption}
            </p>
          </div>
        )}

        {content.hashtags && content.hashtags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Hash className="w-4 h-4" />
              Hashtags
            </div>
            <div className="flex flex-wrap gap-1" data-testid={`text-hashtags-${content.id}`}>
              {content.hashtags.map((tag) => (
                <span key={tag} className="text-xs text-primary">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {showActions && content.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => approveMutation.mutate(content.id)}
              disabled={approveMutation.isPending}
              data-testid={`button-approve-${content.id}`}
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => rejectMutation.mutate(content.id)}
              disabled={rejectMutation.isPending}
              data-testid={`button-reject-${content.id}`}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12 text-muted-foreground" data-testid="empty-state">
      <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-30" />
      <p>{message}</p>
    </div>
  );

  return (
    <Layout title="Content Queue">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6" data-testid="tabs-content-status">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Review ({pendingContent.length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved ({approvedContent.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rejected ({rejectedContent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loadingPending ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : pendingContent.length === 0 ? (
            <EmptyState message="No content pending review. Generate new content from Brand Briefs." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingContent.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {loadingApproved ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : approvedContent.length === 0 ? (
            <EmptyState message="No approved content yet." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approvedContent.map((content) => (
                <ContentCard key={content.id} content={content} showActions={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {loadingRejected ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : rejectedContent.length === 0 ? (
            <EmptyState message="No rejected content." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rejectedContent.map((content) => (
                <ContentCard key={content.id} content={content} showActions={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
}

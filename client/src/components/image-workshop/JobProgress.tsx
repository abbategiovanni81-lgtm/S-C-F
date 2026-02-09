import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, RefreshCw, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { BatchImageJob, StylePackJob, ImageJobItem, FaceSwapItem } from "@shared/schema";

interface JobProgressProps {
  jobId: string;
  jobType: "batch" | "style";
  onBack: () => void;
}

export function JobProgress({ jobId, jobType, onBack }: JobProgressProps) {
  const queryClient = useQueryClient();

  const { data: batchData, isLoading: isBatchLoading } = useQuery<{
    job: BatchImageJob;
    items: ImageJobItem[];
  }>({
    queryKey: [`/api/image-workshop/batch-job/${jobId}`],
    enabled: jobType === "batch",
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const { data: styleData, isLoading: isStyleLoading } = useQuery<{
    job: StylePackJob;
    items: FaceSwapItem[];
  }>({
    queryKey: [`/api/image-workshop/style-pack-job/${jobId}`],
    enabled: jobType === "style",
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const retryMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/image-workshop/retry-image/${itemId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to retry");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Retrying failed image...");
      queryClient.invalidateQueries({ queryKey: [`/api/image-workshop/batch-job/${jobId}`] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBatchDownload = () => {
    const items = jobType === "batch" ? batchData?.items : styleData?.items;
    const completed = items?.filter((i) => i.status === "completed") || [];

    if (completed.length === 0) {
      toast.error("No completed images to download");
      return;
    }

    completed.forEach((item, index) => {
      const url = jobType === "batch" 
        ? (item as ImageJobItem).resultImageUrl 
        : (item as FaceSwapItem).resultImageUrl;
      
      if (url) {
        setTimeout(() => {
          handleDownload(url, `image-${index + 1}.png`);
        }, index * 200); // Stagger downloads
      }
    });

    toast.success(`Downloading ${completed.length} image(s)...`);
  };

  if (isBatchLoading || isStyleLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const job = jobType === "batch" ? batchData?.job : styleData?.job;
  const items = jobType === "batch" ? batchData?.items : styleData?.items;

  if (!job || !items) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Job not found</p>
        <Button className="mt-4" onClick={onBack}>
          Back to Gallery
        </Button>
      </div>
    );
  }

  const completedCount = jobType === "batch" 
    ? (job as BatchImageJob).completedImages 
    : (job as StylePackJob).completedSwaps;
    
  const failedCount = jobType === "batch" 
    ? (job as BatchImageJob).failedImages 
    : (job as StylePackJob).failedSwaps;
    
  const totalCount = jobType === "batch" 
    ? (job as BatchImageJob).totalImages 
    : (job as StylePackJob).totalSwaps;

  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">
            {jobType === "batch" ? "Master Prompt Batch" : "Style Pack"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {new Date(job.createdAt).toLocaleDateString()} at{" "}
            {new Date(job.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={handleBatchDownload} disabled={completedCount === 0}>
          <Download className="w-4 h-4 mr-2" />
          Download All
        </Button>
      </div>

      {/* Progress overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>Processing Status</CardTitle>
            <Badge variant={job.status === "completed" ? "outline" : "default"}>
              {job.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">
                {completedCount}/{totalCount} ({Math.round(progress)}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{failedCount}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount - completedCount - failedCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image grid */}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item, index) => {
              const resultUrl = jobType === "batch" 
                ? (item as ImageJobItem).resultImageUrl 
                : (item as FaceSwapItem).resultImageUrl;
              
              const sourceUrl = jobType === "batch" 
                ? (item as ImageJobItem).sourceImageUrl 
                : null;

              return (
                <div key={item.id} className="space-y-2">
                  <div className="relative aspect-square rounded-md overflow-hidden bg-muted">
                    {item.status === "completed" && resultUrl ? (
                      <>
                        <img
                          src={resultUrl}
                          alt={`Result ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleDownload(resultUrl, `image-${index + 1}.png`)}
                          className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    ) : item.status === "failed" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <XCircle className="w-8 h-8 text-destructive mb-2" />
                        <p className="text-xs text-muted-foreground text-center px-2">
                          {item.errorMessage || "Failed"}
                        </p>
                        {jobType === "batch" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => retryMutation.mutate(item.id)}
                            disabled={retryMutation.isPending}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Retry
                          </Button>
                        )}
                      </div>
                    ) : item.status === "processing" ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">Queued</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">#{index + 1}</span>
                    {item.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    {item.status === "failed" && <XCircle className="w-4 h-4 text-destructive" />}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

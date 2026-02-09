import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, CheckCircle2, XCircle, Clock, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { JobProgress } from "./JobProgress";
import type { BatchImageJob, StylePackJob, ImageJobItem, FaceSwapItem } from "@shared/schema";

export function ImageGallery() {
  const [selectedBatchJob, setSelectedBatchJob] = useState<string | null>(null);
  const [selectedStyleJob, setSelectedStyleJob] = useState<string | null>(null);

  const { data: jobs, isLoading } = useQuery<{
    batchJobs: BatchImageJob[];
    styleJobs: StylePackJob[];
  }>({
    queryKey: ["/api/image-workshop/jobs"],
    refetchInterval: 5000, // Refresh every 5 seconds for progress updates
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      queued: { variant: "secondary", icon: Clock },
      processing: { variant: "default", icon: Loader2 },
      completed: { variant: "outline", icon: CheckCircle2 },
      failed: { variant: "destructive", icon: XCircle },
      partial: { variant: "outline", icon: CheckCircle2 },
    };

    const config = variants[status] || variants.queued;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className={`w-3 h-3 mr-1 ${status === "processing" ? "animate-spin" : ""}`} />
        {status}
      </Badge>
    );
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const batchJobs = jobs?.batchJobs || [];
  const styleJobs = jobs?.styleJobs || [];

  const activeJobs = [
    ...batchJobs.filter(j => j.status === "queued" || j.status === "processing"),
    ...styleJobs.filter(j => j.status === "queued" || j.status === "processing"),
  ];

  const completedBatchJobs = batchJobs.filter(j => 
    j.status === "completed" || j.status === "partial"
  );

  const completedStyleJobs = styleJobs.filter(j => 
    j.status === "completed" || j.status === "partial"
  );

  // Show job progress detail if selected
  if (selectedBatchJob) {
    return (
      <JobProgress
        jobId={selectedBatchJob}
        jobType="batch"
        onBack={() => setSelectedBatchJob(null)}
      />
    );
  }

  if (selectedStyleJob) {
    return (
      <JobProgress
        jobId={selectedStyleJob}
        jobType="style"
        onBack={() => setSelectedStyleJob(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gallery</h2>
        <p className="text-muted-foreground text-sm">
          View your processed images and active jobs
        </p>
      </div>

      {/* Active jobs banner */}
      {activeJobs.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {activeJobs.length} Active Job{activeJobs.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your images are being processed. This page will update automatically.
            </p>
            <div className="space-y-2">
              {batchJobs.filter(j => j.status === "queued" || j.status === "processing").map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                  onClick={() => setSelectedBatchJob(job.id)}
                >
                  <div>
                    <p className="font-medium">Master Prompt Batch</p>
                    <p className="text-xs text-muted-foreground">
                      {job.completedImages}/{job.totalImages} images processed
                    </p>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              ))}
              {styleJobs.filter(j => j.status === "queued" || j.status === "processing").map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                  onClick={() => setSelectedStyleJob(job.id)}
                >
                  <div>
                    <p className="font-medium">Style Pack</p>
                    <p className="text-xs text-muted-foreground">
                      {job.completedSwaps}/{job.totalSwaps} swaps processed
                    </p>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed jobs tabs */}
      <Tabs defaultValue="batch" className="w-full">
        <TabsList>
          <TabsTrigger value="batch">
            Master Prompts ({completedBatchJobs.length})
          </TabsTrigger>
          <TabsTrigger value="style">
            Style Packs ({completedStyleJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batch" className="mt-6">
          {completedBatchJobs.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No completed batches</h3>
              <p className="text-muted-foreground">
                Start processing images with Master Prompts to see results here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {completedBatchJobs.map((job) => (
                <Card
                  key={job.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedBatchJob(job.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">Master Prompt Batch</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(job.createdAt).toLocaleDateString()} at{" "}
                          {new Date(job.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600">
                        ✓ {job.completedImages} completed
                      </span>
                      {job.failedImages > 0 && (
                        <span className="text-destructive">
                          ✗ {job.failedImages} failed
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        Total: {job.totalImages}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="style" className="mt-6">
          {completedStyleJobs.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No completed packs</h3>
              <p className="text-muted-foreground">
                Get style packs to see face-swapped results here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {completedStyleJobs.map((job) => (
                <Card
                  key={job.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedStyleJob(job.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">Style Pack</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(job.createdAt).toLocaleDateString()} at{" "}
                          {new Date(job.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600">
                        ✓ {job.completedSwaps} completed
                      </span>
                      {job.failedSwaps > 0 && (
                        <span className="text-destructive">
                          ✗ {job.failedSwaps} failed
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        Total: {job.totalSwaps}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

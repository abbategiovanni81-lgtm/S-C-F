import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BatchUploader } from "./BatchUploader";
import type { MasterPrompt } from "@shared/schema";

export function MasterPromptGrid() {
  const [selectedPrompt, setSelectedPrompt] = useState<MasterPrompt | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: prompts = [], isLoading } = useQuery<{ prompts: MasterPrompt[] }>({
    queryKey: ["/api/image-workshop/master-prompts"],
  });

  const categories = ["all", ...Array.from(new Set(prompts?.prompts?.map((p) => p.category) || []))];

  const filteredPrompts = categoryFilter === "all"
    ? prompts?.prompts || []
    : prompts?.prompts?.filter((p) => p.category === categoryFilter) || [];

  const handleSelectPrompt = (prompt: MasterPrompt) => {
    setSelectedPrompt(prompt);
    setShowUploader(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showUploader && selectedPrompt) {
    return (
      <BatchUploader
        prompt={selectedPrompt}
        onBack={() => {
          setShowUploader(false);
          setSelectedPrompt(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Master Prompts</h2>
          <p className="text-muted-foreground text-sm">
            Upload multiple images and apply AI transformations in batch
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category: string) => (
          <Button
            key={category}
            variant={categoryFilter === category ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Prompt grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrompts.map((prompt: MasterPrompt) => (
          <Card
            key={prompt.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleSelectPrompt(prompt)}
          >
            <CardHeader>
              {prompt.thumbnailUrl && (
                <div className="w-full h-32 rounded-md overflow-hidden mb-3">
                  <img
                    src={prompt.thumbnailUrl}
                    alt={prompt.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{prompt.name}</CardTitle>
                {prompt.requiredTier !== "free" && (
                  <Badge variant="secondary" className="ml-2">
                    {prompt.requiredTier}
                  </Badge>
                )}
              </div>
              <CardDescription>{prompt.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload Images
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrompts.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No prompts available</h3>
          <p className="text-muted-foreground">
            {categoryFilter !== "all"
              ? "Try selecting a different category"
              : "Check back later for new master prompts"}
          </p>
        </div>
      )}
    </div>
  );
}

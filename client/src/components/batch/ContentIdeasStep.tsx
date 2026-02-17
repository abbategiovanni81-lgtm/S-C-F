import { useState, useEffect } from "react";
import { BatchState } from "./BatchWizard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Edit2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContentPlanStepProps {
  batchState: BatchState;
  onUpdateState: (updates: Partial<BatchState>) => void;
}

export default function ContentIdeasStep({
  batchState,
  onUpdateState,
}: ContentPlanStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!hasGenerated && !batchState.generatedIdeas) {
      handleGenerateIdeas();
    }
  }, []);

  const handleGenerateIdeas = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/batch/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: batchState.platforms,
          timeframe: batchState.timeframe,
          pinnedTopics: batchState.pinnedTopics || [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate ideas");
      }

      const data = await response.json();
      
      onUpdateState({
        generatedIdeas: (data.ideas || []).map((idea: any) => ({
          ...idea,
          selected: true, // Default all to selected
        })),
      });
      
      setHasGenerated(true);
      
      toast({
        title: "Ideas Generated",
        description: `Created ${data.ideas?.length || 0} content ideas`,
      });
    } catch (error) {
      console.error("Error generating ideas:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate content ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleIdea = (ideaId: string) => {
    if (!batchState.generatedIdeas) return;

    const updatedIdeas = batchState.generatedIdeas.map(idea =>
      idea.id === ideaId ? { ...idea, selected: !idea.selected } : idea
    );

    onUpdateState({ generatedIdeas: updatedIdeas });
  };

  const handleEditIdea = (ideaId: string) => {
    const idea = batchState.generatedIdeas?.find(i => i.id === ideaId);
    if (idea) {
      setEditingId(ideaId);
      setEditedTitle(idea.title);
    }
  };

  const handleSaveEdit = (ideaId: string) => {
    if (!batchState.generatedIdeas) return;

    const updatedIdeas = batchState.generatedIdeas.map(idea =>
      idea.id === ideaId ? { ...idea, title: editedTitle } : idea
    );

    onUpdateState({ generatedIdeas: updatedIdeas });
    setEditingId(null);
    setEditedTitle("");
  };

  const handleSelectAll = () => {
    if (!batchState.generatedIdeas) return;

    const allSelected = batchState.generatedIdeas.every(idea => idea.selected);
    const updatedIdeas = batchState.generatedIdeas.map(idea => ({
      ...idea,
      selected: !allSelected,
    }));

    onUpdateState({ generatedIdeas: updatedIdeas });
  };

  const selectedCount = batchState.generatedIdeas?.filter(i => i.selected).length || 0;
  const totalCount = batchState.generatedIdeas?.length || 0;

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Content Ideas</h3>
        <p className="text-muted-foreground">
          Review and select the content ideas you want to create
        </p>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Generating content ideas...</p>
        </div>
      )}

      {/* Ideas List */}
      {!isGenerating && batchState.generatedIdeas && batchState.generatedIdeas.length > 0 && (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedCount === totalCount ? "Deselect All" : "Select All"}
            </Button>
            <Badge variant="secondary">
              {selectedCount} of {totalCount} selected
            </Badge>
          </div>

          {/* Scrollable List */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 pb-4">
              {batchState.generatedIdeas.map((idea) => (
                <Card
                  key={idea.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    idea.selected && "border-primary ring-2 ring-primary/20"
                  )}
                  onClick={() => handleToggleIdea(idea.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail placeholder */}
                      <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-md flex items-center justify-center">
                        {idea.thumbnail ? (
                          <img
                            src={idea.thumbnail}
                            alt={idea.title}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <Wand2 className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          {editingId === idea.id ? (
                            <Textarea
                              value={editedTitle}
                              onChange={(e) => setEditedTitle(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="min-h-[60px]"
                              autoFocus
                            />
                          ) : (
                            <h4 className="font-medium line-clamp-2">{idea.title}</h4>
                          )}
                          <Badge variant="outline" className="flex-shrink-0">
                            {idea.format}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          {editingId === idea.id ? (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit(idea.id);
                              }}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditIdea(idea.id);
                              }}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Checkbox */}
                      <Checkbox
                        checked={idea.selected}
                        onCheckedChange={() => handleToggleIdea(idea.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {/* Empty State */}
      {!isGenerating && (!batchState.generatedIdeas || batchState.generatedIdeas.length === 0) && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              No ideas generated yet.
            </p>
            <Button onClick={handleGenerateIdeas}>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Ideas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sticky Bottom Bar */}
      {!isGenerating && batchState.generatedIdeas && batchState.generatedIdeas.length > 0 && (
        <div className="sticky bottom-0 -mx-6 -mb-6 p-4 bg-muted/50 backdrop-blur-sm border-t">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                {selectedCount} Idea{selectedCount !== 1 ? 's' : ''} Selected
              </div>
              <div className="text-sm text-muted-foreground">
                Ready to generate content
              </div>
            </div>
            {selectedCount === 0 && (
              <div className="text-sm text-amber-600 dark:text-amber-400">
                Select at least one idea to continue
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

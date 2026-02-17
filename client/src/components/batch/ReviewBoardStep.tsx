import { useState } from "react";
import { BatchState } from "./BatchWizard";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import {
  RefreshCw,
  Edit2,
  CheckCircle,
  Clock,
  Calendar as CalendarIcon,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ReviewBoardStepProps {
  batchState: BatchState;
  onUpdateState: (updates: Partial<BatchState>) => void;
}

type ItemStatus = "generated" | "approved" | "scheduled";

interface ContentItem {
  id: string;
  title: string;
  format: string;
  status: ItemStatus;
  script?: string;
  caption?: string;
  scheduledDate?: Date;
}

export default function ReviewBoardStep({
  batchState,
  onUpdateState,
}: ReviewBoardStepProps) {
  const [activeTab, setActiveTab] = useState<ItemStatus>("generated");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [schedulingItem, setSchedulingItem] = useState<string | null>(null);
  const { toast } = useToast();

  // Transform batch items to review items
  const items: ContentItem[] = (batchState.generatedItems || []).map(item => ({
    ...item,
    status: item.status || "generated",
  }));

  const generatedItems = items.filter(i => i.status === "generated");
  const approvedItems = items.filter(i => i.status === "approved");
  const scheduledItems = items.filter(i => i.status === "scheduled");

  const handleRegenerate = async (itemId: string) => {
    try {
      const response = await fetch(`/api/batch/items/${itemId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate");
      }

      const data = await response.json();
      
      // Update item in state
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, ...data.item } : item
      );
      onUpdateState({ generatedItems: updatedItems });

      toast({
        title: "Content Regenerated",
        description: "The content has been regenerated with new variations",
      });
    } catch (error) {
      console.error("Error regenerating:", error);
      toast({
        title: "Regeneration Failed",
        description: "Could not regenerate content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: ContentItem) => {
    setSelectedItem(item);
    // In a real implementation, this would open an edit modal
    toast({
      title: "Edit Mode",
      description: "Edit functionality would open here in full implementation",
    });
  };

  const handleApprove = (itemId: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, status: "approved" as ItemStatus } : item
    );
    onUpdateState({ generatedItems: updatedItems });

    toast({
      title: "Content Approved",
      description: "Content moved to approved items",
    });
  };

  const handleSchedule = (itemId: string, date: Date) => {
    const updatedItems = items.map(item =>
      item.id === itemId
        ? { ...item, status: "scheduled" as ItemStatus, scheduledDate: date }
        : item
    );
    onUpdateState({ generatedItems: updatedItems });
    setSchedulingItem(null);

    toast({
      title: "Content Scheduled",
      description: `Scheduled for ${date.toLocaleDateString()}`,
    });
  };

  const handleDelete = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    onUpdateState({ generatedItems: updatedItems });

    toast({
      title: "Content Deleted",
      description: "Item removed from batch",
    });
  };

  const renderItemCard = (item: ContentItem) => (
    <Card key={item.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Content Preview */}
          <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-md flex items-center justify-center">
            <div className="text-xs text-center px-2">{item.format}</div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium line-clamp-2">{item.title}</h4>
              <Badge variant="outline">{item.format}</Badge>
            </div>

            {item.caption && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {item.caption}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {item.status === "generated" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRegenerate(item.id)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(item.id)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                </>
              )}

              {item.status === "approved" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setSchedulingItem(item.id)}
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Schedule
                  </Button>
                </>
              )}

              {item.status === "scheduled" && item.scheduledDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {item.scheduledDate.toLocaleDateString()}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(item.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Review Board</h3>
        <p className="text-muted-foreground">
          Review, edit, and schedule your generated content
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ItemStatus)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generated" className="flex items-center gap-2">
            Generated
            <Badge variant="secondary" className="ml-1">
              {generatedItems.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            Approved
            <Badge variant="secondary" className="ml-1">
              {approvedItems.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            Scheduled
            <Badge variant="secondary" className="ml-1">
              {scheduledItems.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generated" className="flex-1 mt-6">
          <ScrollArea className="h-[400px] pr-4">
            {generatedItems.length > 0 ? (
              generatedItems.map(renderItemCard)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No generated items yet
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="approved" className="flex-1 mt-6">
          <ScrollArea className="h-[400px] pr-4">
            {approvedItems.length > 0 ? (
              approvedItems.map(renderItemCard)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No approved items yet. Approve items from the Generated tab.
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="scheduled" className="flex-1 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scheduled Items List */}
            <ScrollArea className="h-[400px] pr-4">
              {scheduledItems.length > 0 ? (
                scheduledItems.map(renderItemCard)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No scheduled items yet. Schedule items from the Approved tab.
                </div>
              )}
            </ScrollArea>

            {/* Calendar View */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-4">Content Calendar</h4>
              <Calendar
                mode="single"
                className="rounded-md border"
              />
              <p className="text-xs text-muted-foreground mt-4">
                Drag and drop functionality would be integrated here in full implementation
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Scheduling Modal Placeholder */}
      {schedulingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6">
              <h4 className="font-medium mb-4">Select Schedule Date</h4>
              <Calendar
                mode="single"
                onSelect={(date) => {
                  if (date) {
                    handleSchedule(schedulingItem, date);
                  }
                }}
                className="rounded-md border"
              />
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setSchedulingItem(null)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary */}
      <div className="sticky bottom-0 -mx-6 -mb-6 p-4 bg-muted/50 backdrop-blur-sm border-t">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">
              {items.length} Total Items
            </div>
            <div className="text-sm text-muted-foreground">
              {generatedItems.length} generated • {approvedItems.length} approved • {scheduledItems.length} scheduled
            </div>
          </div>
          <Button variant="outline">
            Export All
          </Button>
        </div>
      </div>
    </div>
  );
}

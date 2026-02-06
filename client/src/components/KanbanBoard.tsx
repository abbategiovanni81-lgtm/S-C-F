import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Video, 
  Image as ImageIcon, 
  LayoutGrid, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Calendar,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedContent } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface KanbanBoardProps {
  content: GeneratedContent[];
  onStatusChange: (contentId: string, newStatus: string) => void;
  onViewContent: (content: GeneratedContent) => void;
  onEditContent: (content: GeneratedContent) => void;
  onDeleteContent: (content: GeneratedContent) => void;
  onScheduleContent: (content: GeneratedContent) => void;
}

const STATUS_COLUMNS = [
  { id: "draft", label: "Draft", icon: FileText, color: "text-gray-500" },
  { id: "pending", label: "Pending Review", icon: Clock, color: "text-amber-500" },
  { id: "approved", label: "Approved", icon: CheckCircle2, color: "text-emerald-500" },
  { id: "ready", label: "Ready to Post", icon: Calendar, color: "text-blue-500" },
  { id: "scheduled", label: "Scheduled", icon: Clock, color: "text-purple-500" },
  { id: "posted", label: "Posted", icon: CheckCircle2, color: "text-green-600" },
];

export function KanbanBoard({
  content,
  onStatusChange,
  onViewContent,
  onEditContent,
  onDeleteContent,
  onScheduleContent,
}: KanbanBoardProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const getContentIcon = (contentType: string, metadata: any) => {
    const format = metadata?.contentFormat || contentType;
    
    if (format.includes("video") || format === "reels") {
      return <Video className="w-4 h-4" />;
    }
    if (format === "carousel") {
      return <LayoutGrid className="w-4 h-4" />;
    }
    if (format === "image" || format === "thumbnail") {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getContentByStatus = (status: string) => {
    return content.filter(c => {
      // Map internal status to display status
      if (status === "ready") {
        return c.status === "approved" && !c.scheduledFor;
      }
      if (status === "scheduled") {
        return c.scheduledFor && !c.archivedAt && !c.deletedAt;
      }
      return c.status === status && !c.archivedAt && !c.deletedAt;
    });
  };

  const handleDragStart = (e: React.DragEvent, contentId: string) => {
    setDraggedItem(contentId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedItem) {
      onStatusChange(draggedItem, newStatus);
      setDraggedItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_COLUMNS.map((column) => {
        const columnContent = getContentByStatus(column.id);
        const Icon = column.icon;

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", column.color)} />
                    <span>{column.label}</span>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {columnContent.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {columnContent.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No content</p>
                  </div>
                ) : (
                  columnContent.map((item) => {
                    const metadata = item.generationMetadata as any;
                    const contentFormat = metadata?.contentFormat || item.contentType;

                    return (
                      <Card
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "cursor-move transition-all hover:shadow-md",
                          draggedItem === item.id && "opacity-50"
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getContentIcon(item.contentType, metadata)}
                              <span className="text-xs font-medium text-muted-foreground truncate">
                                {contentFormat}
                              </span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onViewContent(item)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEditContent(item)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {column.id === "approved" && (
                                  <DropdownMenuItem onClick={() => onScheduleContent(item)}>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Schedule
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => onDeleteContent(item)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {item.caption && (
                            <p className="text-xs line-clamp-2 mb-2">
                              {item.caption}
                            </p>
                          )}

                          {item.script && !item.caption && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {item.script.substring(0, 100)}...
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.platforms?.map((platform) => (
                              <Badge key={platform} variant="outline" className="text-xs px-2 py-0">
                                {platform}
                              </Badge>
                            ))}
                          </div>

                          {item.scheduledFor && (
                            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(item.scheduledFor), "MMM d, h:mm a")}
                            </div>
                          )}

                          {metadata?.videoUrl && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              Has Video
                            </Badge>
                          )}

                          {metadata?.generatedImageUrl && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              Has Image
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Video,
  Image as ImageIcon,
  LayoutGrid,
  FileText,
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import type { GeneratedContent } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CalendarViewProps {
  content: GeneratedContent[];
  onDateClick: (date: Date) => void;
  onViewContent: (content: GeneratedContent) => void;
  onEditContent: (content: GeneratedContent) => void;
  onDeleteContent: (content: GeneratedContent) => void;
  onRescheduleContent: (content: GeneratedContent, newDate: Date) => void;
}

export function CalendarView({
  content,
  onDateClick,
  onViewContent,
  onEditContent,
  onDeleteContent,
  onRescheduleContent,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggedContent, setDraggedContent] = useState<GeneratedContent | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getContentForDay = (day: Date) => {
    return content.filter(c => 
      c.scheduledFor && 
      isSameDay(new Date(c.scheduledFor), day) &&
      !c.archivedAt &&
      !c.deletedAt
    );
  };

  const getContentIcon = (contentType: string, metadata: any) => {
    const format = metadata?.contentFormat || contentType;
    
    if (format.includes("video") || format === "reels") {
      return <Video className="w-3 h-3" />;
    }
    if (format === "carousel") {
      return <LayoutGrid className="w-3 h-3" />;
    }
    if (format === "image" || format === "thumbnail") {
      return <ImageIcon className="w-3 h-3" />;
    }
    return <FileText className="w-3 h-3" />;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDragStart = (e: React.DragEvent, content: GeneratedContent) => {
    setDraggedContent(content);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (draggedContent) {
      onRescheduleContent(draggedContent, date);
      setDraggedContent(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedContent(null);
  };

  const today = new Date();

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-display">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const dayContent = getContentForDay(day);
              const isToday = isSameDay(day, today);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isPast = day < today && !isToday;

              return (
                <div
                  key={index}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                  className={cn(
                    "min-h-[120px] p-2 rounded-lg border-2 transition-colors",
                    isToday && "border-primary bg-primary/5",
                    !isToday && "border-border hover:border-primary/50",
                    !isCurrentMonth && "opacity-50",
                    isPast && "bg-muted/30"
                  )}
                  onClick={() => onDateClick(day)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-sm font-medium",
                      isToday && "text-primary font-bold"
                    )}>
                      {format(day, "d")}
                    </span>
                    {dayContent.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-5 px-2">
                        {dayContent.length}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayContent.slice(0, 3).map((item) => {
                      const metadata = item.generationMetadata as any;
                      const contentFormat = metadata?.contentFormat || item.contentType;

                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "p-2 rounded bg-secondary hover:bg-secondary/80 cursor-move transition-all text-xs group",
                            draggedContent?.id === item.id && "opacity-50"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              {getContentIcon(item.contentType, metadata)}
                              <span className="truncate">{contentFormat}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  onViewContent(item);
                                }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  onEditContent(item);
                                }}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteContent(item);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {item.scheduledFor && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {format(new Date(item.scheduledFor), "h:mm a")}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {dayContent.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        +{dayContent.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-primary bg-primary/5"></div>
              <span className="text-muted-foreground">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-border"></div>
              <span className="text-muted-foreground">Future</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-border bg-muted/30"></div>
              <span className="text-muted-foreground">Past</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, startOfToday, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Plus, Clock, Youtube, Instagram, Video, Twitter, Linkedin, Facebook, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ScheduledPost } from "@shared/schema";

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  youtube: <Youtube className="w-3 h-3" />,
  instagram: <Instagram className="w-3 h-3" />,
  tiktok: <Video className="w-3 h-3" />,
  twitter: <Twitter className="w-3 h-3" />,
  linkedin: <Linkedin className="w-3 h-3" />,
  facebook: <Facebook className="w-3 h-3" />,
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "bg-red-100 text-red-700 border-red-200",
  instagram: "bg-pink-100 text-pink-700 border-pink-200",
  tiktok: "bg-slate-100 text-slate-700 border-slate-200",
  twitter: "bg-blue-100 text-blue-700 border-blue-200",
  linkedin: "bg-sky-100 text-sky-700 border-sky-200",
  facebook: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const DEMO_USER_ID = "demo-user-id";

interface SchedulePostCardProps {
  post: ScheduledPost;
  onDelete: (id: string) => void;
}

function SchedulePostCard({ post, onDelete }: SchedulePostCardProps) {
  const platformColor = PLATFORM_COLORS[post.platform] || "bg-gray-100 text-gray-700 border-gray-200";
  const icon = PLATFORM_ICONS[post.platform];
  
  return (
    <div 
      className={`p-2 rounded-lg border text-xs ${platformColor} relative group`}
      data-testid={`scheduled-post-${post.id}`}
    >
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <span className="font-medium capitalize">{post.platform}</span>
        {post.postType === "auto" && (
          <span className="ml-auto text-[10px] bg-green-500 text-white px-1 rounded">Auto</span>
        )}
      </div>
      {post.title && (
        <p className="font-medium truncate">{post.title}</p>
      )}
      <p className="text-[10px] opacity-70">
        {post.scheduledFor && format(new Date(post.scheduledFor), 'h:mm a')}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(post.id);
        }}
        className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-200 transition-opacity"
        data-testid={`delete-post-${post.id}`}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function Schedule() {
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const today = startOfToday();
  const weekStart = addDays(startOfWeek(today, { weekStartsOn: 0 }), weekOffset * 7);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    platform: "instagram",
    title: "",
    description: "",
    time: "12:00",
    notes: "",
  });

  const { data: scheduledPosts = [], isLoading } = useQuery<ScheduledPost[]>({
    queryKey: ["/api/scheduled-posts", DEMO_USER_ID, weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/scheduled-posts?userId=${DEMO_USER_ID}&startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`);
      if (!res.ok) throw new Error("Failed to fetch scheduled posts");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/scheduled-posts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-posts"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/scheduled-posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-posts"] });
    },
  });

  const resetForm = () => {
    setFormData({
      platform: "instagram",
      title: "",
      description: "",
      time: "12:00",
      notes: "",
    });
  };

  const handleAddClick = (day: Date) => {
    setSelectedDate(day);
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    
    const [hours, minutes] = formData.time.split(":").map(Number);
    const scheduledFor = new Date(selectedDate);
    scheduledFor.setHours(hours, minutes, 0, 0);

    createMutation.mutate({
      userId: DEMO_USER_ID,
      platform: formData.platform,
      scheduledFor: scheduledFor.toISOString(),
      title: formData.title || null,
      description: formData.description || null,
      notes: formData.notes || null,
      postType: "manual",
      status: "planned",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const postsByDay = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {};
    scheduledPosts.forEach((post) => {
      const dateKey = format(new Date(post.scheduledFor), 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(post);
    });
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
    });
    return map;
  }, [scheduledPosts]);

  return (
    <Layout title="Schedule">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold mb-2" data-testid="text-page-title">Content Schedule</h2>
        <p className="text-muted-foreground">Plan and schedule your posts across platforms. YouTube posts auto-publish, others are for tracking.</p>
      </div>

      <div className="flex flex-col h-[calc(100vh-14rem)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(w => w - 1)}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(0)}
              data-testid="button-today"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(w => w + 1)}
              data-testid="button-next-week"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="w-4 h-4" />
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-7 gap-3 min-h-0">
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayPosts = postsByDay[dateKey] || [];

            return (
              <div key={i} className="flex flex-col gap-2 h-full min-w-0">
                <div className={`text-center pb-2 border-b ${isToday ? 'border-primary' : 'border-transparent'}`}>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-2xl font-display font-bold mt-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                </div>

                <div className="flex-1 bg-secondary/30 rounded-xl p-2 space-y-2 overflow-y-auto">
                  {dayPosts.length === 0 && !isLoading && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-[10px]">No posts</p>
                    </div>
                  )}
                  
                  {dayPosts.map((post) => (
                    <SchedulePostCard
                      key={post.id}
                      post={post}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
                  
                  <button 
                    onClick={() => handleAddClick(day)}
                    className="w-full py-2 rounded-lg border border-dashed border-border text-muted-foreground text-xs font-medium hover:bg-background hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
                    data-testid={`button-add-post-${i}`}
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plan a Post</DialogTitle>
            <DialogDescription>
              {selectedDate && `For ${format(selectedDate, 'EEEE, MMMM d, yyyy')}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData(f => ({ ...f, platform: value }))}
              >
                <SelectTrigger data-testid="select-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="twitter">X / Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(f => ({ ...f, time: e.target.value }))}
                data-testid="input-time"
              />
            </div>

            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                placeholder="Post title or topic"
                value={formData.title}
                onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Remind yourself what to post..."
                value={formData.notes}
                onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                data-testid="input-notes"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">How this works:</p>
              <ul className="space-y-1">
                <li>• <span className="font-medium">YouTube</span> - Use Content Queue to auto-schedule with upload</li>
                <li>• <span className="font-medium">Other platforms</span> - Track your posting plan here</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending}
              data-testid="button-save-post"
            >
              {createMutation.isPending ? "Saving..." : "Add to Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="mt-6 border-none shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{scheduledPosts.filter(p => p.status === "planned").length}</div>
              <div className="text-xs text-muted-foreground">Planned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{scheduledPosts.filter(p => p.status === "scheduled").length}</div>
              <div className="text-xs text-muted-foreground">Scheduled (Auto)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{scheduledPosts.filter(p => p.status === "published").length}</div>
              <div className="text-xs text-muted-foreground">Published</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}

import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, addDays, startOfToday } from "date-fns";
import { Calendar as CalendarIcon, Plus, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Schedule() {
  const today = startOfToday();
  const days = Array.from({ length: 7 }).map((_, i) => addDays(today, i));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleAddClick = (day: Date) => {
    setSelectedDate(day);
    setDialogOpen(true);
  };

  return (
    <Layout title="Schedule">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold mb-2" data-testid="text-page-title">Content Schedule</h2>
        <p className="text-muted-foreground">Plan and schedule your posts across platforms.</p>
      </div>

      <div className="flex flex-col h-[calc(100vh-14rem)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white rounded-lg text-sm font-medium shadow-sm border border-border" data-testid="button-week-view">Week</button>
            <button className="px-4 py-2 bg-transparent rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary/50" data-testid="button-month-view">Month</button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="w-4 h-4" />
            {format(today, 'MMMM yyyy')}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-7 gap-4 min-h-0">
          {days.map((day, i) => {
            const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

            return (
              <div key={i} className="flex flex-col gap-3 h-full">
                <div className={`text-center pb-2 border-b ${isToday ? 'border-primary' : 'border-transparent'}`}>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-2xl font-display font-bold mt-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                </div>

                <div className="flex-1 bg-secondary/30 rounded-xl p-2 space-y-3 overflow-y-auto">
                  {i === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-xs">No posts scheduled</p>
                    </div>
                  )}
                  
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a Post</DialogTitle>
            <DialogDescription>
              {selectedDate && `For ${format(selectedDate, 'EEEE, MMMM d, yyyy')}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <p className="font-medium text-lg mb-2">Coming Soon</p>
            <p className="text-sm text-muted-foreground mb-6">
              Post scheduling is under development. For now, create content using Brand Briefs and post manually.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/brand-briefs">
                <a 
                  onClick={() => setDialogOpen(false)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  data-testid="link-create-content"
                >
                  Create Content
                </a>
              </Link>
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
                data-testid="button-close-dialog"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="mt-6 border-none shadow-sm">
        <CardContent className="p-6 text-center">
          <CalendarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">Scheduling coming soon</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            For now, generate content and copy it to post on your platforms.
          </p>
          <Link href="/brand-briefs">
            <a className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors" data-testid="link-create-content-bottom">
              Create Content
            </a>
          </Link>
        </CardContent>
      </Card>
    </Layout>
  );
}

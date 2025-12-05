import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { SCHEDULED_POSTS } from "@/lib/mockData";
import { format, addDays, startOfToday } from "date-fns";
import { Calendar as CalendarIcon, Clock, MoreVertical, Image as ImageIcon } from "lucide-react";

export default function Schedule() {
  const today = startOfToday();
  const days = Array.from({ length: 7 }).map((_, i) => addDays(today, i));

  return (
    <Layout title="Schedule">
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white rounded-lg text-sm font-medium shadow-sm border border-border">Week</button>
            <button className="px-4 py-2 bg-transparent rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary/50">Month</button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-7 gap-4 min-h-0">
          {days.map((day, i) => {
            const dayPosts = SCHEDULED_POSTS.filter(post => 
              format(post.scheduledFor, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
            );
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
                  {dayPosts.map(post => (
                    <Card key={post.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group">
                      <CardContent className="p-3 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex gap-1 flex-wrap">
                            {post.platforms.map(p => (
                              <div key={p} className={`w-2 h-2 rounded-full ${
                                p === 'twitter' ? 'bg-sky-500' :
                                p === 'instagram' ? 'bg-pink-500' :
                                p === 'linkedin' ? 'bg-blue-700' :
                                'bg-blue-600'
                              }`} />
                            ))}
                          </div>
                          <MoreVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        
                        <p className="text-xs font-medium line-clamp-3 text-foreground/90">
                          {post.content}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                            <Clock className="w-3 h-3" />
                            {format(post.scheduledFor, 'h:mm a')}
                          </div>
                          {post.image && <ImageIcon className="w-3 h-3 text-muted-foreground" />}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <button className="w-full py-2 rounded-lg border border-dashed border-border text-muted-foreground text-xs font-medium hover:bg-background hover:text-primary hover:border-primary/50 transition-colors">
                    + Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_STATS, RECENT_ACTIVITY, SCHEDULED_POSTS } from "@/lib/mockData";
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Dashboard() {
  return (
    <Layout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {MOCK_STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                {stat.trend === 'up' ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                ) : stat.trend === 'down' ? (
                  <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-500/10 flex items-center justify-center text-gray-500">
                    <MoreHorizontal className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <h2 className="text-3xl font-bold font-display tracking-tight">{stat.value}</h2>
                <span className={cn(
                  "text-xs font-medium",
                  stat.trend === 'up' ? "text-emerald-600" : 
                  stat.trend === 'down' ? "text-rose-600" : "text-muted-foreground"
                )}>
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Schedule */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">Upcoming Posts</CardTitle>
            <button className="text-sm text-primary hover:underline font-medium">View all</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {SCHEDULED_POSTS.map((post) => (
                <div key={post.id} className="flex gap-4 group">
                  <div className="w-16 h-16 rounded-lg bg-secondary flex-shrink-0 overflow-hidden border border-border/50">
                    {post.image ? (
                      <img src={post.image} alt="Post" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-xs">No Img</div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <p className="font-medium text-foreground truncate">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex gap-1">
                        {post.platforms.map(p => (
                          <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground">
                            {p}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarIcon className="w-3 h-3" />
                        {format(post.scheduledFor, "MMM d, h:mm a")}
                      </div>
                    </div>
                  </div>
                  <button className="self-center px-3 py-1.5 text-xs font-medium rounded-md hover:bg-secondary transition-colors">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-display">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-4 border-l border-border space-y-8">
              {RECENT_ACTIVITY.map((activity) => (
                <div key={activity.id} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.target} • {activity.time}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
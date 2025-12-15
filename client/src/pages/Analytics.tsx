import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Eye } from "lucide-react";

export default function Analytics() {
  return (
    <Layout title="Analytics">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold mb-2" data-testid="text-page-title">Analytics</h2>
        <p className="text-muted-foreground">Track your content performance across platforms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Views", icon: Eye, value: "-", color: "bg-blue-500/10 text-blue-500" },
          { label: "Engagement", icon: TrendingUp, value: "-", color: "bg-emerald-500/10 text-emerald-500" },
          { label: "Followers", icon: Users, value: "-", color: "bg-purple-500/10 text-purple-500" },
          { label: "Posts", icon: BarChart3, value: "-", color: "bg-amber-500/10 text-amber-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between pb-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <div className={`w-8 h-8 rounded-full ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-3xl font-bold font-display tracking-tight mt-2">{stat.value}</h2>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Engagement Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-center">
              <div>
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium text-foreground">No data yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect accounts and publish content to see analytics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Audience Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-center">
              <div>
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium text-foreground">No data yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Follower growth will appear here once accounts are connected
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 rounded-xl bg-secondary/30 border border-border/50 text-center">
        <p className="text-muted-foreground">
          Analytics will be available once you connect your social media accounts and start publishing content.
        </p>
      </div>
    </Layout>
  );
}

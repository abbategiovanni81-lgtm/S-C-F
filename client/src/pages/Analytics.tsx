import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ANALYTICS_DATA } from "@/lib/mockData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  return (
    <Layout title="Analytics">
      <div className="space-y-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Engagement Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYTICS_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTwitter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInsta" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="twitter" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTwitter)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="instagram" 
                  stroke="#ec4899" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorInsta)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Audience Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Twitter', 'Instagram', 'LinkedIn'].map((platform, i) => (
                  <div key={platform} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium">{platform}</div>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-sky-500' : i === 1 ? 'bg-pink-500' : 'bg-blue-700'
                        }`} 
                        style={{ width: `${65 + (i * 10)}%` }} 
                      />
                    </div>
                    <div className="w-12 text-right text-sm text-muted-foreground">
                      +{12 - i}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Best Time to Post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 h-48">
                {Array.from({ length: 7 * 5 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="rounded bg-primary" 
                    style={{ 
                      opacity: Math.random() * 0.8 + 0.1 
                    }} 
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
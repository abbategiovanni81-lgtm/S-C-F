import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Wand2, RefreshCw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

interface ContentPlan {
  date: Date;
  platform: string;
  contentType: string;
  topic: string;
  status: "planned" | "generated" | "scheduled";
}

export default function ContentCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentPlans, setContentPlans] = useState<ContentPlan[]>([
    {
      date: new Date(),
      platform: "TikTok",
      contentType: "Short Video",
      topic: "5 Quick Weight Loss Tips",
      status: "planned",
    },
    {
      date: new Date(Date.now() + 86400000),
      platform: "Instagram",
      contentType: "Carousel",
      topic: "Healthy Meal Prep Ideas",
      status: "generated",
    },
  ]);

  const generateWeeklyPlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-700/50">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-green-400" />
                Content Calendar
              </CardTitle>
              <CardDescription className="text-lg">
                AI-powered weekly content planning based on your brand briefs
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Calendar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Auto-Generate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-400">
                    Let AI create a full week of content ideas based on your brand brief
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={generateWeeklyPlan}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Week
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Content Plans */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">This Week's Plan</h2>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manual Post
                </Button>
              </div>

              {contentPlans.map((plan, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.topic}</CardTitle>
                        <CardDescription>
                          {plan.date.toLocaleDateString("en-US", { 
                            weekday: "long",
                            month: "long",
                            day: "numeric"
                          })}
                        </CardDescription>
                      </div>
                      <Badge>
                        {plan.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-4">
                      <Badge variant="secondary">{plan.platform}</Badge>
                      <Badge variant="outline">{plan.contentType}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Edit
                      </Button>
                      <Button size="sm" className="flex-1">
                        Create Content
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

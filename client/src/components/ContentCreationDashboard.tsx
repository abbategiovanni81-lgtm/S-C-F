import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Image as ImageIcon,
  FileText,
  Sparkles,
  TrendingUp,
  Calendar,
  Zap,
  Brain,
  Target,
  BarChart3,
} from "lucide-react";

interface ContentCard {
  id: string;
  type: "reel" | "story" | "post" | "carousel";
  title: string;
  thumbnail?: string;
  platform: string[];
  status: "draft" | "generating" | "ready" | "scheduled";
  score?: number;
  createdAt: Date;
}

export function ContentCreationDashboard() {
  const [view, setView] = useState<"cards" | "calendar">("cards");
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  // Sample content cards
  const contentCards: ContentCard[] = [
    {
      id: "1",
      type: "reel",
      title: "Product Launch Teaser",
      platform: ["Instagram", "TikTok"],
      status: "ready",
      score: 8.5,
      createdAt: new Date(),
    },
    {
      id: "2",
      type: "story",
      title: "Behind the Scenes",
      platform: ["Instagram"],
      status: "generating",
      createdAt: new Date(),
    },
    {
      id: "3",
      type: "post",
      title: "Customer Testimonial",
      platform: ["Facebook", "LinkedIn"],
      status: "ready",
      score: 9.2,
      createdAt: new Date(),
    },
  ];

  const formatCards = [
    {
      type: "reel",
      icon: Video,
      title: "Instagram Reel",
      description: "15-90s vertical video",
      duration: "15-90s",
      ratio: "9:16",
      trending: true,
    },
    {
      type: "story",
      icon: ImageIcon,
      title: "Story",
      description: "24h disappearing content",
      duration: "Static or 15s",
      ratio: "9:16",
    },
    {
      type: "post",
      icon: FileText,
      title: "Feed Post",
      description: "Static image with caption",
      duration: "Static",
      ratio: "1:1 or 4:5",
    },
    {
      type: "carousel",
      icon: FileText,
      title: "Carousel",
      description: "Up to 10 slides",
      duration: "Multi-image",
      ratio: "1:1",
    },
  ];

  const quickActions = [
    {
      icon: Sparkles,
      title: "AI Content Plan",
      description: "Generate a week's content automatically",
      color: "bg-purple-500",
    },
    {
      icon: TrendingUp,
      title: "Trending Now",
      description: "Create content from viral trends",
      color: "bg-blue-500",
    },
    {
      icon: Brain,
      title: "Magic Clips",
      description: "Turn long videos into clips",
      color: "bg-green-500",
    },
    {
      icon: Target,
      title: "Brand Voice",
      description: "Match your brand style",
      color: "bg-orange-500",
    },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-500",
      generating: "bg-blue-500 animate-pulse",
      ready: "bg-green-500",
      scheduled: "bg-purple-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">📱 Content Studio</h1>
        <p className="text-muted-foreground">
          Create engaging social media content with AI-powered tools
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.title}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Format Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Choose Format</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {formatCards.map((format) => {
            const Icon = format.icon;
            const isSelected = selectedFormat === format.type;
            return (
              <Card
                key={format.type}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedFormat(format.type)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{format.title}</CardTitle>
                        {format.trending && (
                          <Badge className="mt-1" variant="secondary">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {format.description}
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{format.duration}</Badge>
                    <Badge variant="outline">{format.ratio}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Your Content</h2>
        <div className="flex gap-2">
          <Button
            variant={view === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("cards")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Cards
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Content Cards */}
      {view === "cards" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contentCards.map((content) => (
            <Card key={content.id} className="overflow-hidden hover:shadow-lg transition-all">
              {/* Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-purple-500 to-pink-500">
                {content.thumbnail ? (
                  <img
                    src={content.thumbnail}
                    alt={content.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Video className="h-16 w-16 text-white/50" />
                  </div>
                )}
                {/* Score Badge */}
                {content.score && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-black/70 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {content.score}/10
                    </Badge>
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute bottom-3 left-3">
                  <Badge className={getStatusColor(content.status)}>
                    {content.status}
                  </Badge>
                </div>
              </div>

              <CardContent className="pt-4">
                <h3 className="font-semibold mb-2">{content.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  {content.platform.map((platform) => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Edit
                  </Button>
                  <Button size="sm" className="flex-1">
                    <Zap className="h-3 w-3 mr-1" />
                    Publish
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New Card */}
          <Card className="border-dashed border-2 hover:border-primary transition-all cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Create New Content</h3>
              <p className="text-sm text-muted-foreground text-center">
                Start with AI or choose a template
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar View Placeholder */}
      {view === "calendar" && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
            <p>Schedule and manage your content across the week</p>
          </div>
        </Card>
      )}
    </div>
  );
}

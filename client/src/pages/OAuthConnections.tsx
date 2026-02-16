import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Twitter, Linkedin, Instagram, Facebook, Youtube, MessageCircle, CloudSun, Pin, MessageSquare } from "lucide-react";

interface PlatformConnection {
  name: string;
  icon: any;
  gradient: string;
  note?: string;
}

const platforms: PlatformConnection[] = [
  {
    name: "TikTok",
    icon: null, // TikTok uses custom icon
    gradient: "from-black to-gray-800",
  },
  {
    name: "Instagram",
    icon: Instagram,
    gradient: "from-pink-500 to-purple-600",
  },
  {
    name: "YouTube",
    icon: Youtube,
    gradient: "from-red-500 to-red-600",
  },
  {
    name: "Twitter/X",
    icon: Twitter,
    gradient: "from-sky-400 to-sky-600",
  },
  {
    name: "Facebook",
    icon: Facebook,
    gradient: "from-blue-600 to-blue-700",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    gradient: "from-blue-700 to-blue-800",
  },
  {
    name: "Threads",
    icon: MessageCircle,
    gradient: "from-black to-gray-600",
  },
  {
    name: "Bluesky",
    icon: CloudSun,
    gradient: "from-blue-400 to-blue-500",
    note: "App Password",
  },
  {
    name: "Pinterest",
    icon: Pin,
    gradient: "from-red-500 to-red-600",
  },
  {
    name: "Reddit",
    icon: MessageSquare,
    gradient: "from-orange-500 to-orange-600",
  },
];

export default function OAuthConnections() {
  return (
    <Layout title="OAuth Connections">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold mb-2">Platform Connections</h2>
        <p className="text-muted-foreground">
          Connect your social media accounts to enable seamless content publishing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {platforms.map((platform) => {
          const IconComponent = platform.icon;

          return (
            <Card
              key={platform.name}
              className="min-h-[180px] overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardHeader
                className={`bg-gradient-to-br ${platform.gradient} text-white p-6`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {IconComponent ? (
                      <IconComponent className="w-8 h-8" />
                    ) : (
                      <span className="w-8 h-8 flex items-center justify-center font-bold text-xl">
                        T
                      </span>
                    )}
                    <h3 className="text-lg font-semibold">{platform.name}</h3>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => console.log(`Connect to ${platform.name}`)}
                  >
                    Connect
                  </Button>
                  {platform.note && (
                    <Badge variant="secondary" className="w-fit text-xs">
                      {platform.note}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}

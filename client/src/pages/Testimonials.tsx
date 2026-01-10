import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";
import { ArrowLeft, Quote } from "lucide-react";
import { Link } from "wouter";

const testimonials = [
  {
    company: "PointsBot",
    logo: "/attached_assets/pointsbot-logo.png",
    logoColor: "bg-gradient-to-br from-purple-600 to-pink-500",
    quote: "Social Command Flow gave PointsBot a proper posting system. Instead of rewriting the same update five times, I can plan, approve, and publish feature posts in one flow without losing clarity.",
  },
  {
    company: "StyleLens",
    logo: "/attached_assets/stylelens-logo.png",
    logoColor: "bg-gradient-to-br from-orange-500 to-red-500",
    quote: "With StyleLens, speed matters. Social Command Flow helped me turn ideas into Reels quickly, with hooks and captions that actually fit the content instead of feeling generic.",
  },
  {
    company: "AwayDayTrips",
    logo: "/attached_assets/awaydaytrips-logo.png",
    logoColor: "bg-gradient-to-br from-gray-800 to-gray-900",
    quote: "AwayDayTrips runs time-sensitive campaigns. Social Command Flow keeps content organised from idea to post, so nothing gets missed and everything stays on-message.",
  },
  {
    company: "FPL Pulse",
    logo: "/attached_assets/fplpulse-logo.png",
    logoColor: "bg-gradient-to-br from-teal-600 to-green-500",
    quote: "FPL Pulse needed consistency more than volume. Social Command Flow made it easier to plan posts ahead and keep the content flowing week to week.",
  },
];

export default function Testimonials() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/">
            <ResponsiveTooltip content="Return to homepage">
              <Button variant="ghost" className="text-purple-400 hover:text-purple-300" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </ResponsiveTooltip>
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            What Our Users Say
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            See how businesses and creators are using SocialCommandFlow to streamline their content creation and social media management.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="bg-white/10 border-white/20 backdrop-blur hover:bg-white/15 transition-colors"
              data-testid={`card-testimonial-${testimonial.company.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${testimonial.logoColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-lg">
                      {testimonial.company.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Quote className="h-5 w-5 text-purple-400" />
                    </div>
                    <p className="text-gray-200 text-base leading-relaxed mb-4">
                      "{testimonial.quote}"
                    </p>
                    <p className="text-purple-400 font-semibold">
                      — {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/">
            <ResponsiveTooltip content="Start using the app">
              <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-get-started">
                Get Started with SocialCommandFlow
              </Button>
            </ResponsiveTooltip>
          </Link>
        </div>
      </div>
    </div>
  );
}

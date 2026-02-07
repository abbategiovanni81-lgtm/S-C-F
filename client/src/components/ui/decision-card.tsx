import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lock, Crown } from "lucide-react";
import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";

interface DecisionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  imageUrl?: string;
  videoUrl?: string;
  gradient?: string;
  locked?: boolean;
  tier?: "silent" | "pro" | "enterprise";
  selected?: boolean;
  onClick?: () => void;
  badge?: string;
  className?: string;
  children?: ReactNode;
}

export function DecisionCard({
  title,
  description,
  icon,
  imageUrl,
  videoUrl,
  gradient = "from-purple-600 to-pink-600",
  locked = false,
  tier,
  selected = false,
  onClick,
  badge,
  className,
  children,
}: DecisionCardProps) {
  const isInteractive = onClick && !locked;

  const cardContent = (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 border-2",
        isInteractive && "cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20",
        selected && "border-purple-500 shadow-lg shadow-purple-500/30",
        !selected && "border-slate-700",
        locked && "opacity-60",
        className
      )}
      onClick={isInteractive ? onClick : undefined}
    >
      {/* Gradient Background or Media */}
      {(imageUrl || videoUrl || gradient) && (
        <div className={cn(
          "w-full h-40 relative",
          !imageUrl && !videoUrl && `bg-gradient-to-br ${gradient}`
        )}>
          {videoUrl && (
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          )}
          {imageUrl && !videoUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Icon Overlay */}
          {icon && (
            <div className="absolute inset-0 flex items-center justify-center text-white/90">
              <div className="text-5xl">{icon}</div>
            </div>
          )}

          {/* Locked Overlay */}
          {locked && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <Lock className="w-12 h-12 text-white mb-2 mx-auto" />
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500">
                  <Crown className="w-3 h-3 mr-1" />
                  {tier?.toUpperCase()} ONLY
                </Badge>
              </div>
            </div>
          )}

          {/* Badge */}
          {badge && !locked && (
            <Badge className="absolute top-2 right-2 bg-purple-600 text-white">
              {badge}
            </Badge>
          )}
        </div>
      )}

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {title}
          {locked && <Lock className="w-4 h-4 text-yellow-500" />}
        </CardTitle>
        {description && (
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      {children && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );

  if (locked && tier) {
    return (
      <ResponsiveTooltip content={`Upgrade to ${tier.toUpperCase()} to unlock this feature`}>
        {cardContent}
      </ResponsiveTooltip>
    );
  }

  return cardContent;
}

// Grid variant for mobile-optimized 2-column layout
export function DecisionCardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      "grid gap-4",
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className
    )}>
      {children}
    </div>
  );
}

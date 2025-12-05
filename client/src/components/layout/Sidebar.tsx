import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar, BarChart3, Users, Settings, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Calendar, label: "Schedule", href: "/schedule" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Users, label: "Accounts", href: "/accounts" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 text-primary font-bold text-xl font-display">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            S
          </div>
          SocialCommand
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer",
                isActive 
                  ? "bg-sidebar-primary/10 text-sidebar-primary" 
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border/50">
        <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer">
          <PlusCircle className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </div>
    </div>
  );
}
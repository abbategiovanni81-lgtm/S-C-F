import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar, BarChart3, Users, Settings, PlusCircle, ChevronLeft, ChevronRight, Cpu, FileText, CheckSquare, Sparkles, Download, Scissors, Headphones, HelpCircle, Shield, Wand2, GitCompare, MessageSquare, Film, Type, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FileText, label: "Brand Briefs", href: "/brand-briefs" },
  { icon: CheckSquare, label: "Content Queue", href: "/content-queue" },
  { icon: Sparkles, label: "Content Analyzer", href: "/content-analyzer" },
  { icon: GitCompare, label: "Content Comparison", href: "/content-comparison" },
  { icon: Scissors, label: "Edit & Merge", href: "/edit-merge" },
  { icon: Type, label: "Editor", href: "/editor" },
  { icon: BookOpen, label: "Blog Studio", href: "/blog-studio" },
  { icon: Download, label: "Ready to Post", href: "/ready-to-post" },
  { icon: Headphones, label: "Social Listening", href: "/social-listening" },
  { icon: Wand2, label: "Creator Studio", href: "/creator-studio" },
  { icon: Film, label: "Video to Clips", href: "/video-to-clips" },
  { icon: Calendar, label: "Schedule", href: "/schedule" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Users, label: "Accounts", href: "/accounts" },
  { icon: MessageSquare, label: "Reddit A2E", href: "/reddit" },
  { icon: Cpu, label: "AI Engines", href: "/ai-engines" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "How To", href: "/how-to" },
];

const ADMIN_ITEM = { icon: Shield, label: "Admin", href: "/admin" };

interface SidebarProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

export function Sidebar({ collapsed, toggleCollapsed }: SidebarProps) {
  const [location] = useLocation();
  const { isOwner } = useAuth();
  
  const navItems = isOwner ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  return (
    <div className={cn(
      "h-full bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-20 transition-all duration-300 ease-in-out",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "h-16 flex items-center border-b border-sidebar-border/50",
        collapsed ? "justify-center px-0" : "px-6 justify-between"
      )}>
        <div className={cn("flex items-center gap-2 text-primary font-bold text-xl font-display overflow-hidden", collapsed && "justify-center")}>
          <img 
            src="/logo.png" 
            alt="SocialCommandFlow" 
            className={cn("flex-shrink-0 object-contain", collapsed ? "w-16 h-16" : "w-14 h-14")}
          />
          {!collapsed && <span className="whitespace-nowrap">SocialCommandFlow</span>}
        </div>
        {!collapsed && (
          <button 
            onClick={toggleCollapsed}
            className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all cursor-pointer",
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
                isActive 
                  ? "bg-sidebar-primary/10 text-sidebar-primary" 
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )} title={collapsed ? item.label : undefined}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border/50 flex flex-col gap-2">
        <button className={cn(
          "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center transition-colors cursor-pointer",
          collapsed ? "w-10 h-10 justify-center p-0 mx-auto" : "w-full h-10 px-4 py-2 justify-center gap-2 font-medium"
        )} title="New Post">
          <PlusCircle className="w-4 h-4" />
          {!collapsed && <span>New Post</span>}
        </button>

        {collapsed && (
          <button 
            onClick={toggleCollapsed}
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-md hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors mt-2"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
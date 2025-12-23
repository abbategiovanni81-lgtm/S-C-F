import { Bell, Search, User, LogOut, Settings, CreditCard } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState } from "react";

export function Header({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      if (query.includes("brief")) {
        setLocation("/brand-briefs");
      } else if (query.includes("content") || query.includes("queue")) {
        setLocation("/content-queue");
      } else if (query.includes("account")) {
        setLocation("/accounts");
      } else if (query.includes("analytic")) {
        setLocation("/analytics");
      } else if (query.includes("schedule")) {
        setLocation("/schedule");
      } else if (query.includes("ai") || query.includes("engine")) {
        setLocation("/ai-engines");
      } else if (query.includes("creator") || query.includes("studio")) {
        setLocation("/creator-studio");
      } else if (query.includes("listen")) {
        setLocation("/social-listening");
      } else if (query.includes("setting")) {
        setLocation("/settings");
      } else {
        setLocation("/content-queue");
      }
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/auth");
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
      <h1 className="text-xl font-bold font-display text-foreground" data-testid="text-header-title">{title}</h1>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search pages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="h-9 w-64 rounded-full bg-secondary/50 border-none pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            data-testid="input-search"
          />
        </div>
        
        <button 
          className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          data-testid="button-notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-3 pl-2 border-l border-border/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 border border-border cursor-pointer hover:border-primary transition-colors" data-testid="avatar-user">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.email || "User"}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user?.tier || "free"} Plan</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/settings")} data-testid="menu-settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/subscription")} data-testid="menu-subscription">
                <CreditCard className="w-4 h-4 mr-2" />
                Subscription
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="menu-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

import { Bell, Search, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header({ title }: { title: string }) {
  return (
    <header className="h-16 flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
      <h1 className="text-xl font-bold font-display text-foreground" data-testid="text-header-title">{title}</h1>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
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
          <Avatar className="h-9 w-9 border border-border" data-testid="avatar-user">
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

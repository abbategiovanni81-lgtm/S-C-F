import { Bell, Search } from "lucide-react";
import { MOCK_USER } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header({ title }: { title: string }) {
  return (
    <header className="h-16 flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
      <h1 className="text-xl font-bold font-display text-foreground">{title}</h1>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="h-9 w-64 rounded-full bg-secondary/50 border-none pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        
        <button className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-3 pl-2 border-l border-border/50">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium leading-none">{MOCK_USER.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{MOCK_USER.plan}</p>
          </div>
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={MOCK_USER.avatar} />
            <AvatarFallback>AC</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
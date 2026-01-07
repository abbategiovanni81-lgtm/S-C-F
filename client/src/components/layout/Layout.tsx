import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { HelpChatbot } from "@/components/HelpChatbot";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title = "Dashboard" }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });
  
  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={collapsed} toggleCollapsed={() => setCollapsed(!collapsed)} />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "ml-20" : "ml-64"
      )}>
        <Header title={title} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
      <HelpChatbot />
    </div>
  );
}
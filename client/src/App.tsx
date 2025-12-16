import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Schedule from "@/pages/Schedule";
import Accounts from "@/pages/Accounts";
import Analytics from "@/pages/Analytics";
import AIEngines from "@/pages/AIEngines";
import ContentQueue from "@/pages/ContentQueue";
import BrandBriefs from "@/pages/BrandBriefs";
import ContentAnalyzer from "@/pages/ContentAnalyzer";
import ReadyToPost from "@/pages/ReadyToPost";
import EditMerge from "@/pages/EditMerge";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/brand-briefs" component={BrandBriefs} />
      <Route path="/content-queue" component={ContentQueue} />
      <Route path="/content-analyzer" component={ContentAnalyzer} />
      <Route path="/edit-merge" component={EditMerge} />
      <Route path="/ready-to-post" component={ReadyToPost} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/accounts" component={Accounts} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/ai-engines" component={AIEngines} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
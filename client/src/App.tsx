import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
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
import SocialListening from "@/pages/SocialListening";
import Settings from "@/pages/Settings";
import HowTo from "@/pages/HowTo";
import Admin from "@/pages/Admin";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import CreatorStudio from "@/pages/CreatorStudio";
import ContentComparison from "@/pages/ContentComparison";
import Testimonials from "@/pages/Testimonials";
import RedditManager from "@/pages/RedditManager";
import VideoToClips from "@/pages/VideoToClips";

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/brand-briefs" component={BrandBriefs} />
      <Route path="/content-queue" component={ContentQueue} />
      <Route path="/content-analyzer" component={ContentAnalyzer} />
      <Route path="/content-comparison" component={ContentComparison} />
      <Route path="/edit-merge" component={EditMerge} />
      <Route path="/edit-merge/:contentId" component={EditMerge} />
      <Route path="/ready-to-post" component={ReadyToPost} />
      <Route path="/social-listening" component={SocialListening} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/accounts" component={Accounts} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/ai-engines" component={AIEngines} />
      <Route path="/settings" component={Settings} />
      <Route path="/how-to" component={HowTo} />
      <Route path="/creator-studio" component={CreatorStudio} />
      <Route path="/admin" component={Admin} />
      <Route path="/reddit" component={RedditManager} />
      <Route path="/video-to-clips" component={VideoToClips} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/testimonials" component={Testimonials} />
      <Route>
        {() => {
          if (isLoading) {
            return (
              <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            );
          }

          if (!isAuthenticated) {
            return <Landing />;
          }

          return <AuthenticatedRoutes />;
        }}
      </Route>
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
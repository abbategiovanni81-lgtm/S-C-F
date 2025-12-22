import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UpgradePromptProps {
  feature: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradePrompt({ feature, open, onOpenChange }: UpgradePromptProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-upgrade-prompt">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Premium Feature
          </DialogTitle>
          <DialogDescription>
            {feature} is available for premium users.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <h4 className="font-medium mb-2">Free Plan Option</h4>
            <p className="text-sm text-muted-foreground mb-3">
              You can use your own API keys to access this feature. Go to Settings to add your keys.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                window.location.href = "/settings";
              }}
              data-testid="button-go-to-settings"
            >
              Add Your API Keys
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              Upgrade to Premium
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Get unlimited access to all AI features with no API key setup required.
            </p>
            <Button
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              data-testid="button-upgrade-premium"
            >
              Contact for Premium Access
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface UpgradeBannerProps {
  className?: string;
}

export function UpgradeBanner({ className }: UpgradeBannerProps) {
  return (
    <Card className={`bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
            <Lock className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">Free Account</h4>
            <p className="text-xs text-muted-foreground">
              Add your own API keys in Settings to use AI features, or upgrade to Premium for full access.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => window.location.href = "/settings"}
            data-testid="button-banner-settings"
          >
            Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

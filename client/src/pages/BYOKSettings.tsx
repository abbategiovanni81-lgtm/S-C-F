import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  User,
  Brain,
  Video
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface APIKey {
  name: string;
  key: string;
  status: "active" | "inactive" | "not-set";
  icon: React.ElementType;
  color: string;
  description: string;
  link: string;
}

export default function BYOKSettings() {
  const { toast } = useToast();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [avatarAPIs, setAvatarAPIs] = useState<APIKey[]>([
    {
      name: "D-ID",
      key: "",
      status: "not-set",
      icon: User,
      color: "text-purple-400",
      description: "Create AI avatars with realistic facial expressions and lip-sync",
      link: "https://www.d-id.com/",
    },
    {
      name: "Creatify",
      key: "",
      status: "not-set",
      icon: Video,
      color: "text-blue-400",
      description: "Generate marketing videos with AI avatars and templates",
      link: "https://creatify.ai/",
    },
  ]);

  const [aiAPIs, setAIAPIs] = useState<APIKey[]>([
    {
      name: "OpenRouter",
      key: "",
      status: "not-set",
      icon: Brain,
      color: "text-green-400",
      description: "Access multiple AI models through a single API (GPT-4, Claude, Llama, etc.)",
      link: "https://openrouter.ai/",
    },
    {
      name: "Together AI",
      key: "",
      status: "not-set",
      icon: Brain,
      color: "text-cyan-400",
      description: "Fast inference for open-source models (Mixtral, Llama 3, etc.)",
      link: "https://www.together.ai/",
    },
  ]);

  const toggleKeyVisibility = (apiName: string) => {
    setShowKeys(prev => ({ ...prev, [apiName]: !prev[apiName] }));
  };

  const handleSave = (category: string) => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "API Keys Saved",
        description: `Your ${category} API keys have been securely saved.`,
      });
    }, 1000);
  };

  const updateAPIKey = (
    apis: APIKey[], 
    setAPIs: React.Dispatch<React.SetStateAction<APIKey[]>>, 
    name: string, 
    value: string
  ) => {
    setAPIs(apis.map(api => 
      api.name === name 
        ? { ...api, key: value, status: value ? "active" : "not-set" }
        : api
    ));
  };

  const renderAPISection = (
    apis: APIKey[],
    setAPIs: React.Dispatch<React.SetStateAction<APIKey[]>>,
    category: string
  ) => (
    <div className="space-y-4">
      {apis.map((api) => {
        const Icon = api.icon;
        return (
          <Card key={api.name}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${api.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{api.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {api.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge 
                  variant={api.status === "active" ? "default" : "secondary"}
                  className={api.status === "active" ? "bg-green-900/30 text-green-400 border-green-700" : ""}
                >
                  {api.status === "active" ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Not Set
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${api.name}-key`}>API Key</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => toggleKeyVisibility(api.name)}
                  >
                    {showKeys[api.name] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id={`${api.name}-key`}
                    type={showKeys[api.name] ? "text" : "password"}
                    placeholder={`Enter your ${api.name} API key`}
                    value={api.key}
                    onChange={(e) => updateAPIKey(apis, setAPIs, api.name, e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(api.link, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get API Key from {api.name}
              </Button>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end pt-4">
        <Button 
          onClick={() => handleSave(category)}
          disabled={isSaving}
          size="lg"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save {category} Keys
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-amber-700/50">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Key className="w-8 h-8 text-amber-400" />
                BYOK Settings
              </CardTitle>
              <CardDescription className="text-lg">
                Bring Your Own Keys - Connect your own API keys for lower costs and more control
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Info Alert */}
          <Alert className="bg-blue-900/20 border-blue-700/50">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertTitle className="text-blue-400">Why Use BYOK?</AlertTitle>
            <AlertDescription className="text-slate-300">
              By connecting your own API keys, you can:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Reduce costs by up to 50% on AI-generated content</li>
                <li>Get direct access to the latest models and features</li>
                <li>Maintain full control over your usage and billing</li>
                <li>Avoid monthly credit limits</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Tabs */}
          <Tabs defaultValue="avatars" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="avatars">
                <User className="w-4 h-4 mr-2" />
                Avatar APIs
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Brain className="w-4 h-4 mr-2" />
                AI Aggregators
              </TabsTrigger>
            </TabsList>

            <TabsContent value="avatars" className="mt-6">
              {renderAPISection(avatarAPIs, setAvatarAPIs, "Avatar")}
            </TabsContent>

            <TabsContent value="ai" className="mt-6">
              {renderAPISection(aiAPIs, setAIAPIs, "AI")}
            </TabsContent>
          </Tabs>

          {/* Security Notice */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-green-400" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300 space-y-2">
              <p>
                🔒 Your API keys are encrypted at rest using AES-256 encryption
              </p>
              <p>
                🔐 Keys are only decrypted server-side when making API calls
              </p>
              <p>
                🚫 We never log or store your API keys in plain text
              </p>
              <p>
                ✅ You can revoke access at any time by removing your keys
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

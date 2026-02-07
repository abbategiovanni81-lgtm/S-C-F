import { Layout } from "@/components/layout/Layout";
import { AvaWorkflowGuide } from "@/components/AvaWorkflowGuide";
import { QuickPostGrid } from "@/components/QuickPostGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap } from "lucide-react";

export default function AvaGuide() {
  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <Card className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-700/50">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-400" />
                Ava AI Assistant
              </CardTitle>
              <CardDescription className="text-lg">
                Let Ava guide you through content creation with smart workflows and quick actions
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Tabs for different modes */}
          <Tabs defaultValue="workflow" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="workflow">
                <Sparkles className="w-4 h-4 mr-2" />
                Guided Workflow
              </TabsTrigger>
              <TabsTrigger value="quick">
                <Zap className="w-4 h-4 mr-2" />
                Quick Actions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workflow" className="mt-6">
              <AvaWorkflowGuide 
                onComplete={(path) => {
                  console.log("Workflow completed with path:", path);
                }}
              />
            </TabsContent>

            <TabsContent value="quick" className="mt-6">
              <QuickPostGrid />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

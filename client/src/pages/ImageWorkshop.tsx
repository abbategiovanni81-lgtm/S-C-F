import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Package, Images } from "lucide-react";
import { MasterPromptGrid } from "@/components/image-workshop/MasterPromptGrid";
import { StylePackBrowser } from "@/components/image-workshop/StylePackBrowser";
import { ImageGallery } from "@/components/image-workshop/ImageGallery";

export default function ImageWorkshop() {
  return (
    <Layout title="Image Workshop">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Image Workshop</h1>
          <p className="text-muted-foreground mt-2">
            Transform images with AI and create professional face-swapped photo packs
          </p>
        </div>

        <Tabs defaultValue="master-prompts" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="master-prompts" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">Master Prompts</span>
            </TabsTrigger>
            <TabsTrigger value="style-packs" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Style Packs</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Images className="w-4 h-4" />
              <span className="hidden sm:inline">Gallery</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="master-prompts" className="mt-6">
            <MasterPromptGrid />
          </TabsContent>

          <TabsContent value="style-packs" className="mt-6">
            <StylePackBrowser />
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <ImageGallery />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

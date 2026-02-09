import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react";
import { StylePackDetail } from "./StylePackDetail";
import type { StylePack } from "@shared/schema";

export function StylePackBrowser() {
  const [selectedPack, setSelectedPack] = useState<StylePack | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data, isLoading } = useQuery<{ packs: StylePack[] }>({
    queryKey: ["/api/image-workshop/style-packs"],
  });

  const packs = data?.packs || [];
  const categories = ["all", ...Array.from(new Set(packs.map((p: StylePack) => p.category)))];

  const filteredPacks = categoryFilter === "all"
    ? packs
    : packs.filter((p: StylePack) => p.category === categoryFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selectedPack) {
    return (
      <StylePackDetail
        pack={selectedPack}
        onBack={() => setSelectedPack(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Style Packs</h2>
        <p className="text-muted-foreground text-sm">
          Upload your face photo and get professional face-swapped images
        </p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category: string) => (
          <Button
            key={category}
            variant={categoryFilter === category ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Pack grid - Netflix style rows */}
      <div className="space-y-8">
        {Array.from(new Set(filteredPacks.map((p: StylePack) => p.category))).map((category: string) => {
          const categoryPacks = filteredPacks.filter((p: StylePack) => p.category === category);
          
          return (
            <div key={category}>
              <h3 className="text-xl font-semibold mb-4">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryPacks.map((pack: StylePack) => (
                  <Card
                    key={pack.id}
                    className="cursor-pointer hover:border-primary transition-all hover:scale-105"
                    onClick={() => setSelectedPack(pack)}
                  >
                    {pack.thumbnailUrl && (
                      <div className="w-full h-48 rounded-t-lg overflow-hidden">
                        <img
                          src={pack.thumbnailUrl}
                          alt={pack.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{pack.name}</CardTitle>
                        {pack.requiredTier !== "free" && (
                          <Badge variant="secondary" className="shrink-0">
                            {pack.requiredTier}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs line-clamp-2">
                        {pack.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        {pack.templateCount} templates
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredPacks.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No style packs available</h3>
          <p className="text-muted-foreground">
            {categoryFilter !== "all"
              ? "Try selecting a different category"
              : "Check back later for new style packs"}
          </p>
        </div>
      )}
    </div>
  );
}

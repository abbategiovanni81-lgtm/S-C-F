import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { useState } from "react";

interface CarouselSlide {
  slideNumber: number;
  title: string;
  content: string;
  imageDescription: string;
  designTips: string;
}

interface CarouselPreviewProps {
  slides: CarouselSlide[];
  onEdit?: () => void;
}

export function CarouselPreview({ slides, onEdit }: CarouselPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-purple-500" />
          Carousel Preview
        </h3>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit in Creator
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Preview Card */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Slide {slide.slideNumber} of {slides.length}
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevSlide}
                  disabled={slides.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextSlide}
                  disabled={slides.length <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg flex items-center justify-center p-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-3">{slide.title}</h3>
                <div className="text-sm space-y-2">
                  {slide.content.split('\n').filter(line => line.trim()).map((line, i) => (
                    <p key={i} className="leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Slide Navigation */}
            <div className="flex justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? "w-8 bg-purple-500"
                      : "w-2 bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-base">Slide Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                Image Description
              </h4>
              <p className="text-sm leading-relaxed">{slide.imageDescription}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                Design Tips
              </h4>
              <p className="text-sm leading-relaxed">{slide.designTips}</p>
            </div>

            <div className="pt-4 space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">
                All Slides
              </h4>
              <div className="space-y-1">
                {slides.map((s, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      index === currentSlide
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {s.slideNumber}. {s.title}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

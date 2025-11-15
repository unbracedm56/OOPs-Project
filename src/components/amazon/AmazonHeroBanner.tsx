import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface HeroBanner {
  id: string;
  image: string;
  title?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface AmazonHeroBannerProps {
  banners: HeroBanner[];
  autoPlay?: boolean;
  interval?: number;
}

export const AmazonHeroBanner = ({
  banners,
  autoPlay = true,
  interval = 5000,
}: AmazonHeroBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, banners.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Banner Images */}
      <div 
        className="flex transition-transform duration-700 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="min-w-full h-full relative"
          >
            <img
              src={banner.image}
              alt={banner.title || "Banner"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            
            {/* Overlay Content */}
            {(banner.title || banner.description || banner.ctaText) && (
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center">
                <div className="container mx-auto px-4">
                  <Card className="max-w-xl p-8 bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-md border-border/50 shadow-modern-xl">
                    {banner.title && (
                      <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        {banner.title}
                      </h1>
                    )}
                    {banner.description && (
                      <p className="text-lg mb-6 text-muted-foreground leading-relaxed">
                        {banner.description}
                      </p>
                    )}
                    {banner.ctaText && (
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-primary-foreground shadow-modern group"
                        onClick={() => banner.ctaLink && window.location.assign(banner.ctaLink)}
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-300 inline-block">
                          {banner.ctaText}
                        </span>
                      </Button>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Modern floating design */}
      {banners.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:scale-110 border border-border/20"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:scale-110 border border-border/20"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Indicators - Modern pill design */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? "w-8 bg-gradient-to-r from-primary to-secondary shadow-modern" 
                  : "w-2 bg-white/50 hover:bg-white/75 hover:w-4"
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

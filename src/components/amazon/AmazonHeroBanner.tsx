import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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

  const handleCtaClick = (link: string) => {
    if (link.startsWith('#')) {
      // Smooth scroll to section
      const element = document.querySelector(link);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (link.startsWith('http')) {
      // External link
      window.open(link, '_blank');
    } else {
      // Internal navigation
      navigate(link);
    }
  };

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-[280px] md:h-[380px] overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
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
                <div className="container mx-auto px-4 md:px-6">
                  <Card className="max-w-lg p-6 md:p-8 bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-md border-border/50 shadow-2xl">
                    {banner.title && (
                      <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        {banner.title}
                      </h1>
                    )}
                    {banner.description && (
                      <p className="text-base md:text-lg mb-5 text-muted-foreground leading-relaxed">
                        {banner.description}
                      </p>
                    )}
                    {banner.ctaText && banner.ctaLink && (
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-primary-foreground shadow-lg group"
                        onClick={() => handleCtaClick(banner.ctaLink!)}
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

      {/* Navigation Arrows - Blended design */}
      {banners.length > 1 && (
        <>
          <button
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-all duration-300 hover:scale-110 flex items-center justify-center group border border-white/10"
            onClick={goToPrevious}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 md:h-7 md:w-7 text-white drop-shadow-lg transition-transform group-hover:-translate-x-0.5" />
          </button>
          <button
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-all duration-300 hover:scale-110 flex items-center justify-center group border border-white/10"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 md:h-7 md:w-7 text-white drop-shadow-lg transition-transform group-hover:translate-x-0.5" />
          </button>
        </>
      )}

      {/* Indicators - Minimal dot design */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/20 backdrop-blur-sm px-3 py-2 rounded-full">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? "w-6 bg-white shadow-md" 
                  : "w-2 bg-white/60 hover:bg-white/80 hover:w-3"
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

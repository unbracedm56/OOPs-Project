import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AmazonCarouselProps {
  title?: string;
  children: React.ReactNode;
  itemWidth?: number;
  gap?: number;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export const AmazonCarousel = ({
  title,
  children,
  itemWidth = 280,
  gap = 16,
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 5000,
}: AmazonCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [children]);

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      scrollRight();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval]);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({
      left: -(itemWidth * 3 + gap * 3),
      behavior: "smooth",
    });

    setTimeout(checkScroll, 300);
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // If at end, scroll back to beginning
    if (!canScrollRight) {
      container.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      container.scrollBy({
        left: itemWidth * 3 + gap * 3,
        behavior: "smooth",
      });
    }

    setTimeout(checkScroll, 300);
  };

  return (
    <div className="relative group">
      {title && (
        <h2 className="text-2xl font-bold mb-4 text-foreground">{title}</h2>
      )}

      <div className="relative">
        {/* Left Arrow */}
        {showArrows && canScrollLeft && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-20 w-10 rounded-r-md rounded-l-none shadow-lg opacity-90 hover:opacity-100 transition-opacity"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ gap: `${gap}px` }}
          onScroll={checkScroll}
        >
          {children}
        </div>

        {/* Right Arrow */}
        {showArrows && canScrollRight && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-20 w-10 rounded-l-md rounded-r-none shadow-lg opacity-90 hover:opacity-100 transition-opacity"
            onClick={scrollRight}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Helper component for carousel items
export const AmazonCarouselItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex-shrink-0", className)}>
      {children}
    </div>
  );
};

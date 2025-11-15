import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  title: string;
  image: string;
  categoryId?: string;
  onClick?: () => void;
}

export const AmazonCategoryCard = ({
  title,
  image,
  categoryId,
  onClick,
}: CategoryCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (categoryId) {
      navigate(`/category/${categoryId}`);
    }
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden hover:shadow-modern-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80 border-border/50 hover:border-primary/50 hover:-translate-y-1"
      onClick={handleClick}
    >
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl overflow-hidden relative">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div className="flex items-center gap-2 text-sm text-primary group-hover:gap-3 transition-all duration-300">
          <span className="font-medium">Shop now</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </Card>
  );
};

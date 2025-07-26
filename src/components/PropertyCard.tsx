import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type PropertyCardProps = {
  image: string;
  title: string;
  location: string;
  price: string;
  status?: "active" | "sold" | "rented" | null;
  type?: "sale" | "rent" | null;
};

const statusColors = {
  active: "bg-success text-success-foreground",
  sold: "bg-destructive text-destructive-foreground",
  rented: "bg-accent text-accent-foreground",
};

export default function PropertyCard({
  image,
  title,
  location,
  price,
  status,
  type,
}: PropertyCardProps) {
  // Helper to safely capitalize strings
  const capitalize = (s: string | null | undefined) => {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
      <img
        src={image}
        alt={title}
        className="w-20 h-20 rounded-lg object-cover"
      />
      <div className="flex-1">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="font-bold text-primary">{price}</p>
          <div className="flex items-center gap-2">
            {status && (
                <Badge className={cn(statusColors[status])} variant="secondary">
                    {capitalize(status)}
                </Badge>
            )}
            {type && (
                <Badge variant="outline">{capitalize(type)}</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

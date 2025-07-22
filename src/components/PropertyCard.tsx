import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, Edit } from "lucide-react";

interface PropertyCardProps {
  image: string;
  title: string;
  location: string;
  price: string;
  status: "active" | "sold" | "rented";
  type: "sale" | "rent";
}

export default function PropertyCard({
  image,
  title,
  location,
  price,
  status,
  type
}: PropertyCardProps) {
  const statusColors = {
    active: "bg-success text-success-foreground",
    sold: "bg-destructive text-destructive-foreground",
    rented: "bg-accent text-accent-foreground"
  };

  const typeColors = {
    sale: "bg-primary text-primary-foreground",
    rent: "bg-secondary text-secondary-foreground"
  };

  return (
    <div className="property-card">
      <div className="relative mb-3">
        <img
          src={image}
          alt={title}
          className="w-full h-40 object-cover rounded-lg"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge className={statusColors[status]} variant="secondary">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          <Badge className={typeColors[type]} variant="secondary">
            For {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground leading-tight">{title}</h3>
        
        <div className="flex items-center text-muted-foreground text-sm">
          <MapPin className="w-4 h-4 mr-1" />
          {location}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">{price}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
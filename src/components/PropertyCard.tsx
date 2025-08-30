import { Badge } from "@/components/ui/badge";
import { MapPin, Building, Shield, Award, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

type PropertyCardProps = {
  image: string;
  title: string;
  location: string;
  price: string;
  status?: "active" | "sold" | "rented" | null;
  type?: "sale" | "rent" | null;
  subcategory?: "eh_commercial" | "eh_verified" | "eh_signature" | "eh_dubai" | null;
};

const statusColors = {
  active: "bg-success text-success-foreground",
  sold: "bg-destructive text-destructive-foreground",
  rented: "bg-accent text-accent-foreground",
};

const ehCategoryConfig = {
  eh_commercial: { 
    label: "EH Commercial", 
    color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0",
    icon: Building
  },
  eh_verified: { 
    label: "EH Verified", 
    color: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0",
    icon: Shield
  },
  eh_signature: { 
    label: "EH Signature", 
    color: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0",
    icon: Award
  },
  eh_dubai: { 
    label: "EH Dubai", 
    color: "bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0",
    icon: Globe
  }
};

export default function PropertyCard({
  image,
  title,
  location,
  price,
  status,
  type,
  subcategory,
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
            {subcategory && ehCategoryConfig[subcategory] && (
                <Badge className={cn(ehCategoryConfig[subcategory].color)}>
                    {React.createElement(
                        ehCategoryConfig[subcategory].icon,
                        { className: "h-3 w-3 mr-1" }
                    )}
                    {ehCategoryConfig[subcategory].label}
                </Badge>
            )}
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

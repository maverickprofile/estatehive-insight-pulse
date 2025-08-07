export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  status: string;
  description?: string;
  amenities?: string[];
  image_urls?: string[];
  agent?: string;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  size?: string;
  created_at?: string;
}

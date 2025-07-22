import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin,
  Building,
  Home,
  Store
} from "lucide-react";

// Import property images
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";

const properties = [
  {
    id: 1,
    image: property1,
    title: "Luxury Apartment in Bandra",
    location: "Bandra West, Mumbai",
    price: "₹2,80,00,000",
    type: "Apartment",
    status: "active",
    agent: "Rahul Sharma",
    size: "1200 sqft",
    bedrooms: 3,
    city: "Mumbai"
  },
  {
    id: 2,
    image: property2,
    title: "Modern Villa with Garden",
    location: "Koramangala, Bangalore",
    price: "₹95,000/month",
    type: "Villa",
    status: "rented",
    agent: "Priya Singh",
    size: "2500 sqft",
    bedrooms: 4,
    city: "Bangalore"
  },
  {
    id: 3,
    image: property3,
    title: "Commercial Office Space",
    location: "Connaught Place, Delhi",
    price: "₹1,50,00,000",
    type: "Commercial",
    status: "sold",
    agent: "Amit Kumar",
    size: "800 sqft",
    bedrooms: 0,
    city: "Delhi"
  },
  {
    id: 4,
    image: property1,
    title: "2BHK Apartment",
    location: "Andheri East, Mumbai",
    price: "₹1,20,00,000",
    type: "Apartment",
    status: "active",
    agent: "Sneha Patel",
    size: "950 sqft",
    bedrooms: 2,
    city: "Mumbai"
  },
  {
    id: 5,
    image: property2,
    title: "Independent House",
    location: "Whitefield, Bangalore",
    price: "₹1,80,00,000",
    type: "House",
    status: "active",
    agent: "Raj Gupta",
    size: "1800 sqft",
    bedrooms: 3,
    city: "Bangalore"
  }
];

const statusColors = {
  active: "bg-success text-success-foreground",
  sold: "bg-destructive text-destructive-foreground",
  rented: "bg-accent text-accent-foreground",
  expired: "bg-muted text-muted-foreground"
};

const typeIcons = {
  Apartment: Building,
  Villa: Home,
  House: Home,
  Commercial: Store
};

export default function PropertiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    const matchesCity = cityFilter === "all" || property.city === cityFilter;
    const matchesType = typeFilter === "all" || property.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesCity && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Properties</h1>
          <p className="text-muted-foreground">Manage your property listings and inventory</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Filters */}
      <div className="metric-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Mumbai">Mumbai</SelectItem>
                <SelectItem value="Delhi">Delhi</SelectItem>
                <SelectItem value="Bangalore">Bangalore</SelectItem>
                <SelectItem value="Pune">Pune</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Properties Table */}
      <div className="metric-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProperties.map((property) => {
              const TypeIcon = typeIcons[property.type as keyof typeof typeIcons];
              return (
                <TableRow key={property.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-foreground">{property.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {property.bedrooms > 0 ? `${property.bedrooms} BHK` : property.type} • {property.size}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{property.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">{property.price}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{property.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[property.status as keyof typeof statusColors]} variant="secondary">
                      {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{property.agent}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card text-center">
          <div className="text-2xl font-bold text-success mb-1">
            {properties.filter(p => p.status === 'active').length}
          </div>
          <div className="text-sm text-muted-foreground">Active Listings</div>
        </div>
        <div className="metric-card text-center">
          <div className="text-2xl font-bold text-destructive mb-1">
            {properties.filter(p => p.status === 'sold').length}
          </div>
          <div className="text-sm text-muted-foreground">Sold Properties</div>
        </div>
        <div className="metric-card text-center">
          <div className="text-2xl font-bold text-accent mb-1">
            {properties.filter(p => p.status === 'rented').length}
          </div>
          <div className="text-sm text-muted-foreground">Rented Properties</div>
        </div>
        <div className="metric-card text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {properties.length}
          </div>
          <div className="text-sm text-muted-foreground">Total Properties</div>
        </div>
      </div>
    </div>
  );
}
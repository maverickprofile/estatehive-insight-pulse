import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Search,
  MapPin,
  Home,
  Bed,
  Bath,
  Square,
  Heart,
  MoreVertical,
  Filter,
  Grid3x3,
  List,
  TrendingUp,
  IndianRupee,
  Building,
  Calendar,
  Star,
  Users,
  Phone,
  Mail,
  Share2,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { propertiesService } from "@/services/database.service";
import { Property } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-500/10 text-gray-600 border-gray-200", icon: AlertCircle },
  active: { label: "Active", color: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle },
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: AlertCircle },
  under_contract: { label: "Under Contract", color: "bg-orange-500/10 text-orange-600 border-orange-200", icon: Clock },
  sold: { label: "Sold", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: CheckCircle },
  rented: { label: "Rented", color: "bg-purple-500/10 text-purple-600 border-purple-200", icon: Home },
  inactive: { label: "Inactive", color: "bg-gray-500/10 text-gray-600 border-gray-200", icon: XCircle },
  expired: { label: "Expired", color: "bg-red-500/10 text-red-600 border-red-200", icon: XCircle }
};

const categoryConfig = {
  sale: { label: "For Sale", color: "text-blue-600 bg-blue-50" },
  rent: { label: "For Rent", color: "text-purple-600 bg-purple-50" },
  lease: { label: "For Lease", color: "text-orange-600 bg-orange-50" }
};

// Helper functions to safely get config with fallbacks
const getStatusConfig = (status: string | null | undefined) => {
  const defaultStatus = { label: "Unknown", color: "bg-gray-500/10 text-gray-600 border-gray-200", icon: AlertCircle };
  if (!status) return statusConfig.active; // Default to active if no status
  return statusConfig[status as keyof typeof statusConfig] || defaultStatus;
};

const getCategoryConfig = (category: string | null | undefined) => {
  const defaultCategory = { label: "For Sale", color: "text-blue-600 bg-blue-50" };
  if (!category) return defaultCategory;
  return categoryConfig[category as keyof typeof categoryConfig] || defaultCategory;
};

export default function PropertiesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [savedProperties, setSavedProperties] = useState<number[]>([]);

  useEffect(() => {
    loadProperties();
  }, [selectedType, selectedStatus, selectedCategory]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (selectedStatus !== "all") {
        filters.status = selectedStatus;
      }
      if (selectedType !== "all") {
        filters.property_type = selectedType;
      }
      if (selectedCategory !== "all") {
        filters.category = selectedCategory;
      }
      if (priceRange.min) {
        filters.min_price = parseFloat(priceRange.min);
      }
      if (priceRange.max) {
        filters.max_price = parseFloat(priceRange.max);
      }

      const data = await propertiesService.getAllProperties(filters);
      setProperties(data || []);
    } catch (error: any) {
      console.error("Error loading properties:", error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await propertiesService.deleteProperty(deleteId);
      toast({
        title: "Success",
        description: "Property deleted successfully"
      });
      setDeleteId(null);
      loadProperties();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive"
      });
    }
  };

  const toggleSaveProperty = (propertyId: number) => {
    setSavedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Price on Request";
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const filteredProperties = properties.filter(property => {
    if (searchTerm && !property.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !property.city?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const stats = {
    total: properties.length,
    active: properties.filter(p => p.status === "active").length,
    sold: properties.filter(p => p.status === "sold").length,
    rented: properties.filter(p => p.status === "rented").length,
    totalValue: properties.reduce((sum, p) => sum + (p.price || 0), 0),
    avgPrice: properties.length > 0 ? properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length : 0
  };

  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto">
      <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">Property Listings</h1>
            <p className="text-sm text-muted-foreground">Manage and showcase your properties</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="hidden sm:flex"
            >
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
            </Button>
            <Button 
              onClick={() => navigate("/properties/add")}
              className="flex-1 sm:flex-initial"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-muted-foreground">Total</CardTitle>
                <Home className="h-3.5 w-3.5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Properties</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-muted-foreground">Active</CardTitle>
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold">{stats.active}</p>
              <p className="text-[10px] text-muted-foreground">Listed</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-muted-foreground">Rented</CardTitle>
                <Users className="h-3.5 w-3.5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold">{stats.rented}</p>
              <p className="text-[10px] text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-muted-foreground">Sold</CardTitle>
                <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold">{stats.sold}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-muted-foreground">Total Value</CardTitle>
                <IndianRupee className="h-3.5 w-3.5 text-indigo-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold">{formatPrice(stats.totalValue)}</p>
              <p className="text-[10px] text-muted-foreground">Portfolio</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-pink-500">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-muted-foreground">Avg Price</CardTitle>
                <Star className="h-3.5 w-3.5 text-pink-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold">{formatPrice(Math.round(stats.avgPrice))}</p>
              <p className="text-[10px] text-muted-foreground">Per unit</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, location, or features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
                <SelectItem value="lease">For Lease</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_contract">Under Contract</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto text-xs text-muted-foreground flex items-center">
              {filteredProperties.length} properties found
            </div>
          </div>
        </div>

        {/* Properties Grid/List */}
        {loading ? (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-3"
          }>
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-40 w-full" />
                <CardHeader className="p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No properties found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your filters or add a new property
              </p>
              <Button onClick={() => navigate("/properties/add")} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProperties.map((property) => (
              <Card 
                key={property.id} 
                className="group hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Image Section */}
                <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src={property.image_urls?.[0] || "/placeholder.svg"}
                    alt={property.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge className={cn("text-[10px] border", getStatusConfig(property.status).color)}>
                      {getStatusConfig(property.status).label}
                    </Badge>
                    {property.is_featured && (
                      <Badge className="text-[10px] bg-yellow-500/90 text-white border-yellow-600">
                        <Star className="h-2.5 w-2.5 mr-0.5" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveProperty(property.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart 
                      className={cn(
                        "h-3.5 w-3.5 transition-colors",
                        savedProperties.includes(property.id) 
                          ? "fill-red-500 text-red-500" 
                          : "text-gray-600"
                      )}
                    />
                  </button>

                  {/* Category */}
                  <div className="absolute bottom-2 right-2">
                    <Badge className={cn("text-[9px] px-1.5 py-0.5", getCategoryConfig(property.category).color)}>
                      {getCategoryConfig(property.category).label}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-3">
                  {/* Title & Location */}
                  <div className="mb-2">
                    <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        {property.neighborhood && `${property.neighborhood}, `}
                        {property.city}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(property.price)}
                      {property.category === "rent" && (
                        <span className="text-xs font-normal text-muted-foreground">/month</span>
                      )}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    {property.bedrooms && (
                      <div className="flex items-center gap-1">
                        <Bed className="h-3 w-3" />
                        <span>{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-1">
                        <Bath className="h-3 w-3" />
                        <span>{property.bathrooms}</span>
                      </div>
                    )}
                    {property.area_sqft && (
                      <div className="flex items-center gap-1">
                        <Square className="h-3 w-3" />
                        <span>{property.area_sqft} sqft</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => navigate(`/properties/${property.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/properties/${property.id}/edit`)}>
                          <Edit2 className="h-3 w-3 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/messages?property=${property.id}`)}>
                          <Mail className="h-3 w-3 mr-2" />
                          Inquiries
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-3 w-3 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(property.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {/* Image */}
                    <div className="relative w-32 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                      <img
                        src={property.image_urls?.[0] || "/placeholder.svg"}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      {property.is_featured && (
                        <Badge className="absolute top-1 left-1 text-[9px] bg-yellow-500/90">
                          <Star className="h-2.5 w-2.5" />
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-1">
                            {property.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {property.city}
                            </div>
                            <Badge className={cn("text-[9px]", getStatusConfig(property.status).color)}>
                              {getStatusConfig(property.status).label}
                            </Badge>
                            <Badge variant="outline" className="text-[9px]">
                              {property.property_type}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-base font-bold">
                          {formatPrice(property.price)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {property.bedrooms && (
                            <span className="flex items-center gap-1">
                              <Bed className="h-3 w-3" />
                              {property.bedrooms} Beds
                            </span>
                          )}
                          {property.bathrooms && (
                            <span className="flex items-center gap-1">
                              <Bath className="h-3 w-3" />
                              {property.bathrooms} Baths
                            </span>
                          )}
                          {property.area_sqft && (
                            <span className="flex items-center gap-1">
                              <Square className="h-3 w-3" />
                              {property.area_sqft} sqft
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => navigate(`/properties/${property.id}`)}
                          >
                            View Details
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Property</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the property as inactive. You can reactivate it later from the inactive properties list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
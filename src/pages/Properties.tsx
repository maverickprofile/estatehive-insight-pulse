import React, { useState, useEffect } from "react";
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
  AlertCircle,
  Award,
  Shield,
  Globe
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

const ehCategoryConfig = {
  eh_commercial: { 
    label: "EH Commercial", 
    color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0",
    icon: Building,
    description: "Premium Commercial Properties"
  },
  eh_verified: { 
    label: "EH Verified", 
    color: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0",
    icon: Shield,
    description: "Verified Premium Properties"
  },
  eh_signature: { 
    label: "EH Signature", 
    color: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-0",
    icon: Award,
    description: "Luxury Signature Collection"
  },
  eh_dubai: { 
    label: "EH Dubai", 
    color: "bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0",
    icon: Globe,
    description: "Exclusive Dubai Properties"
  }
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
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [savedProperties, setSavedProperties] = useState<number[]>([]);

  useEffect(() => {
    loadProperties();
  }, [selectedType, selectedStatus, selectedCategory, selectedSubcategory]);

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
      if (selectedSubcategory !== "all") {
        filters.subcategory = selectedSubcategory;
      }
      if (priceRange.min) {
        filters.min_price = parseFloat(priceRange.min);
      }
      if (priceRange.max) {
        filters.max_price = parseFloat(priceRange.max);
      }

      const data = await propertiesService.getAllProperties(filters);
      // Debug: Check if subcategory data is coming through
      if (data && data.length > 0) {
        const propertiesWithSubcategory = data.filter(p => p.subcategory);
        console.log(`${propertiesWithSubcategory.length} out of ${data.length} properties have EH categories`);
      }
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
        {/* Header - Professional Design */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-lg" />
          <div className="relative p-6 rounded-lg bg-background/80 backdrop-blur-sm border-0 shadow-sm">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      Property Portfolio
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {stats.total} properties • {stats.active} active listings • {formatPrice(stats.totalValue)} portfolio value
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => navigate("/properties/add")}
                  className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
                  size="default"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Property
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard - Professional Design */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Total Properties */}
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform">
                  <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground mb-1">{stats.total}</div>
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Total Properties
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Portfolio Size</span>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs font-medium">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Listings */}
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground mb-1">{stats.active}</div>
                  <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">
                    Active Listings
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Market Ready</span>
                <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                  {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% Live
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Performance */}
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground mb-1">{stats.sold + stats.rented}</div>
                  <div className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                    Deals Closed
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{stats.sold} Sold • {stats.rented} Rented</span>
                <div className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
                  This Month
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Value */}
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 group-hover:scale-110 transition-transform">
                  <IndianRupee className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground mb-1">{formatPrice(stats.totalValue)}</div>
                  <div className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    Portfolio Value
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg: {formatPrice(Math.round(stats.avgPrice))}</span>
                <div className="flex items-center gap-1 text-purple-600">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs font-medium">Premium</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Search & Filters - Professional Design */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Search Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Find Properties</h3>
                  <p className="text-sm text-muted-foreground">Search and filter your property portfolio</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>{filteredProperties.length} properties found</span>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties by title, location, features, or price range..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-sm border-muted-foreground/20 focus:border-primary/50 bg-muted/20"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => setSearchTerm("")}
                  >
                    ×
                  </Button>
                )}
              </div>
              
              {/* Filter Categories */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Property Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="h-10 border-muted-foreground/20">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="All Types" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted" />
                          All Property Types
                        </div>
                      </SelectItem>
                      <SelectItem value="residential">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          Residential
                        </div>
                      </SelectItem>
                      <SelectItem value="commercial">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Commercial
                        </div>
                      </SelectItem>
                      <SelectItem value="land">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          Land/Plot
                        </div>
                      </SelectItem>
                      <SelectItem value="industrial">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          Industrial
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Listing Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-10 border-muted-foreground/20">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="All Categories" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted" />
                          All Categories
                        </div>
                      </SelectItem>
                      <SelectItem value="sale">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          For Sale
                        </div>
                      </SelectItem>
                      <SelectItem value="rent">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          For Rent
                        </div>
                      </SelectItem>
                      <SelectItem value="lease">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          For Lease
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">EH Category</label>
                  <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                    <SelectTrigger className="h-10 border-muted-foreground/20">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="All EH Categories" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted" />
                          All EH Categories
                        </div>
                      </SelectItem>
                      <SelectItem value="eh_commercial">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-blue-500" />
                          EH Commercial
                        </div>
                      </SelectItem>
                      <SelectItem value="eh_verified">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          EH Verified
                        </div>
                      </SelectItem>
                      <SelectItem value="eh_signature">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-amber-500" />
                          EH Signature
                        </div>
                      </SelectItem>
                      <SelectItem value="eh_dubai">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-purple-500" />
                          EH Dubai
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-10 border-muted-foreground/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="All Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted" />
                          All Status
                        </div>
                      </SelectItem>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          Pending
                        </div>
                      </SelectItem>
                      <SelectItem value="under_contract">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          Under Contract
                        </div>
                      </SelectItem>
                      <SelectItem value="sold">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          Sold
                        </div>
                      </SelectItem>
                      <SelectItem value="rented">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          Rented
                        </div>
                      </SelectItem>
                      <SelectItem value="draft">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500" />
                          Draft
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Quick Actions</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10 text-xs"
                      onClick={() => {
                        setSelectedType("all");
                        setSelectedCategory("all");
                        setSelectedSubcategory("all");
                        setSelectedStatus("all");
                        setSearchTerm("");
                      }}
                    >
                      <Filter className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {(selectedType !== "all" || selectedCategory !== "all" || selectedSubcategory !== "all" || selectedStatus !== "all" || searchTerm) && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
                  <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
                  {selectedType !== "all" && (
                    <Badge variant="secondary" className="gap-1 capitalize">
                      Type: {selectedType}
                      <button
                        onClick={() => setSelectedType("all")}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedCategory !== "all" && (
                    <Badge variant="secondary" className="gap-1 capitalize">
                      Category: {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedSubcategory !== "all" && (
                    <Badge 
                      className={cn(
                        "gap-1",
                        ehCategoryConfig[selectedSubcategory as keyof typeof ehCategoryConfig]?.color || "bg-secondary"
                      )}
                    >
                      {ehCategoryConfig[selectedSubcategory as keyof typeof ehCategoryConfig]?.label || selectedSubcategory}
                      <button
                        onClick={() => setSelectedSubcategory("all")}
                        className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedStatus !== "all" && (
                    <Badge variant="secondary" className="gap-1 capitalize">
                      Status: {selectedStatus}
                      <button
                        onClick={() => setSelectedStatus("all")}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Search: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Properties Gallery - Professional Design */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <Skeleton className="h-64 w-full rounded-t-lg" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-6 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="text-center py-20">
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-muted/30 mb-6">
                  <Home className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No properties found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchTerm || selectedType !== "all" || selectedCategory !== "all" || selectedSubcategory !== "all" || selectedStatus !== "all" 
                    ? "No properties match your current search criteria. Try adjusting your filters."
                    : "Start building your property portfolio by adding your first listing."
                  }
                </p>
                <Button onClick={() => navigate("/properties/add")} size="lg" className="shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Property
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredProperties.map((property) => {
              const statusConfig = getStatusConfig(property.status);
              const categoryConfig = getCategoryConfig(property.category);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card 
                  key={property.id} 
                  className="group relative overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer bg-gradient-to-b from-background to-background/50"
                  onClick={() => navigate(`/properties/${property.id}`)}
                >
                  {/* Premium Image Section */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={property.image_urls?.[0] || `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop&crop=center`}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop&crop=center`;
                      }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                    
                    {/* Top Badges Row */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                      <div className="flex flex-col gap-2">
                        {/* Status Badge with Icon */}
                        <Badge className={cn(
                          "px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm border",
                          statusConfig.color.replace('/10', '/90').replace('text-', 'text-white border-white/20 bg-')
                        )}>
                          <StatusIcon className="h-3 w-3 mr-1.5" />
                          {statusConfig.label}
                        </Badge>
                        
                        {/* Featured Badge */}
                        {property.is_featured && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg backdrop-blur-sm px-3 py-1.5 text-xs font-medium">
                            <Star className="h-3 w-3 mr-1.5 fill-current" />
                            Featured
                          </Badge>
                        )}
                        
                        {/* EH Category Badge */}
                        {property.subcategory && ehCategoryConfig[property.subcategory as keyof typeof ehCategoryConfig] && (
                          <Badge className={cn(
                            "px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm",
                            ehCategoryConfig[property.subcategory as keyof typeof ehCategoryConfig].color
                          )}>
                            {React.createElement(
                              ehCategoryConfig[property.subcategory as keyof typeof ehCategoryConfig].icon,
                              { className: "h-3 w-3 mr-1.5" }
                            )}
                            {ehCategoryConfig[property.subcategory as keyof typeof ehCategoryConfig].label}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveProperty(property.id);
                          }}
                          className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all"
                        >
                          <Heart 
                            className={cn(
                              "h-4 w-4 transition-colors",
                              savedProperties.includes(property.id) 
                                ? "fill-red-500 text-red-500" 
                                : "text-gray-700 hover:text-red-500"
                            )}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Share functionality
                          }}
                          className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all"
                        >
                          <Share2 className="h-4 w-4 text-gray-700 hover:text-primary" />
                        </button>
                      </div>
                    </div>

                    {/* Category Badge - Bottom Right */}
                    <div className="absolute bottom-3 right-3">
                      <Badge className={cn(
                        "px-3 py-1.5 text-xs font-medium shadow-lg border-0",
                        categoryConfig.color.replace('text-', 'text-white bg-').replace('bg-blue-50', 'bg-blue-500').replace('bg-purple-50', 'bg-purple-500').replace('bg-orange-50', 'bg-orange-500')
                      )}>
                        {categoryConfig.label}
                      </Badge>
                    </div>

                    {/* Price Tag - Bottom Left */}
                    <div className="absolute bottom-3 left-3">
                      <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(property.price)}
                        </p>
                        {property.category === "rent" && (
                          <p className="text-xs text-gray-600">/month</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Content Section */}
                  <CardContent className="p-5">
                    {/* Title & Location */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-1 mb-2">
                        {property.title || "Untitled Property"}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2 text-primary/60" />
                        <span className="truncate">
                          {[property.neighborhood, property.city, property.state]
                            .filter(Boolean)
                            .join(", ") || "Location not specified"}
                        </span>
                      </div>
                    </div>

                    {/* Property Features */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {property.bedrooms && (
                          <div className="flex items-center gap-1.5">
                            <Bed className="h-4 w-4 text-primary/60" />
                            <span className="font-medium">{property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {property.bathrooms && (
                          <div className="flex items-center gap-1.5">
                            <Bath className="h-4 w-4 text-primary/60" />
                            <span className="font-medium">{property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {property.area_sqft && (
                          <div className="flex items-center gap-1.5">
                            <Square className="h-4 w-4 text-primary/60" />
                            <span className="font-medium">{property.area_sqft.toLocaleString()} sqft</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2 border-t border-muted/30">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 h-10 shadow-sm hover:shadow-md transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/properties/${property.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-10 w-10 p-0 shadow-sm hover:shadow-md border-muted-foreground/20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/properties/${property.id}/edit`);
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-3" />
                            Edit Property
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/messages?property=${property.id}`);
                            }}
                          >
                            <Mail className="h-4 w-4 mr-3" />
                            View Inquiries
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-3" />
                            Share Property
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(property.id);
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
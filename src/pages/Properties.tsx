import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Loader2,
  Search,
  MapPin,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import property1 from "@/assets/property1.jpg"; // Fallback image
import { cn } from "@/lib/utils";

const fetchProperties = async () => {
  const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export default function PropertiesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
  });

  const deletePropertyMutation = useMutation({
      mutationFn: async (propertyId: number) => {
          const { error } = await supabase.from('properties').delete().eq('id', propertyId);
          if (error) throw error;
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['properties'] });
          toast({ title: "Success", description: "Property deleted successfully." });
      },
      onError: (error: any) => {
          toast({ title: "Error", description: error.message, variant: "destructive" });
      }
  });

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (property.location && property.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || property.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Property Listings</h1>
          <p className="text-sm text-muted-foreground">Browse, manage, and add new properties to your inventory.</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
          onClick={() => navigate('/properties/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Filters Section */}
      <div className="metric-card">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search by name or location..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                </SelectContent>
            </Select>
             <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="House">House</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProperties.map((property) => (
            <div key={property.id} className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg">
                <div className="relative h-56 overflow-hidden">
                    <img src={property.image_urls?.[0] || property1} alt={property.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <Badge className="absolute top-3 left-3" variant="secondary">{property.badge || 'New Listing'}</Badge>
                </div>
                <div className="p-4 space-y-3">
                    <h3 className="text-lg font-semibold text-foreground truncate">{property.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 h-10">{property.description || `A wonderful ${property.bhk} in ${property.location}`}</p>
                    <div className="flex items-center justify-between pt-3 border-t">
                        <p className="text-xl font-bold text-primary">₹ {property.price}</p>
                        <Button size="sm" onClick={() => navigate(`/properties/${property.id}`)}>
                            View Details <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, 
  ArrowLeft, 
  Edit2, 
  Save, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Square, 
  User, 
  Phone,
  Mail,
  Calendar,
  Clock,
  IndianRupee,
  Home,
  Building2,
  Trees,
  Wifi,
  Dumbbell,
  Waves,
  Shield,
  ParkingCircle,
  Sofa,
  Eye,
  Heart,
  Share2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Star,
  TrendingUp,
  Ruler2,
  Compass,
  CalendarClock,
  FileText,
  Download,
  ExternalLink
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Property {
    id: string;
    title?: string;
    description?: string;
    property_type?: string;
    status?: string;
    
    // Location
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
    latitude?: number;
    longitude?: number;
    neighborhood?: string;
    
    // Pricing
    price?: number;
    price_per_sqft?: number;
    maintenance_charge?: number;
    
    // Specifications
    area_sqft?: number;
    bedrooms?: number;
    bathrooms?: number;
    balconies?: number;
    total_floors?: number;
    floor_number?: number;
    parking_spaces?: number;
    
    // Features
    furnished_status?: string;
    facing_direction?: string;
    age_of_property?: number;
    year_built?: number;
    possession_status?: string;
    possession_date?: string;
    
    // Images and Media
    image_urls?: string[];
    images?: string[];
    video_url?: string;
    virtual_tour_url?: string;
    
    // Amenities
    amenities?: string[] | string;
    
    // Meta
    agent_id?: string;
    owner_id?: string;
    views_count?: number;
    inquiries_count?: number;
    favorites_count?: number;
    shares_count?: number;
    is_featured?: boolean;
    created_at?: string;
    updated_at?: string;
}

// Helper functions for status and furnishing
const getStatusBadge = (status?: string) => {
  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-700" },
    active: { label: "Active", color: "bg-green-100 text-green-700" },
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
    under_contract: { label: "Under Contract", color: "bg-orange-100 text-orange-700" },
    sold: { label: "Sold", color: "bg-blue-100 text-blue-700" },
    rented: { label: "Rented", color: "bg-purple-100 text-purple-700" },
    inactive: { label: "Inactive", color: "bg-gray-100 text-gray-500" }
  };
  return statusConfig[status || 'active'] || statusConfig.active;
};

const getFurnishingBadge = (status?: string) => {
  const config: Record<string, { label: string; icon: any }> = {
    unfurnished: { label: "Unfurnished", icon: Home },
    semi_furnished: { label: "Semi Furnished", icon: Sofa },
    fully_furnished: { label: "Fully Furnished", icon: Building2 }
  };
  return config[status || 'unfurnished'] || config.unfurnished;
};

// Amenities mapping with icons
const amenityIcons: Record<string, any> = {
  'Swimming Pool': Waves,
  'Gym': Dumbbell,
  'Security': Shield,
  'Parking': ParkingCircle,
  'Wi-Fi': Wifi,
  'Garden': Trees,
  'Default': Check
};

// Function to fetch a single property from Supabase
const fetchPropertyById = async (id: string): Promise<Property> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as Property;
};

export default function PropertyDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [propertyData, setPropertyData] = useState<Property | null>(null);
    const [activeImage, setActiveImage] = useState(0);
    const [isSaved, setIsSaved] = useState(false);

    const { data: property, isLoading, error } = useQuery<Property>({
        queryKey: ['property', id],
        queryFn: () => fetchPropertyById(id!),
        enabled: !!id,
    });

    useEffect(() => {
        if (property) {
            setPropertyData(property);
        }
    }, [property]);

    const updatePropertyMutation = useMutation<void, Error, Property>({
        mutationFn: async (updatedData) => {
            const { id: propertyId, created_at, ...updateFields } = updatedData;
            const { error } = await supabase
                .from('properties')
                .update(updateFields)
                .eq('id', propertyId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['property', id] });
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            toast({ title: "Success", description: "Property details updated." });
            setIsEditing(false);
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setPropertyData(prev => prev ? { ...prev, [id]: value } as Property : prev);
    };

    const formatPrice = (price?: number) => {
        if (!price) return "Price on Request";
        if (price >= 10000000) {
            return `₹${(price / 10000000).toFixed(2)} Cr`;
        } else if (price >= 100000) {
            return `₹${(price / 100000).toFixed(2)} L`;
        }
        return `₹${price.toLocaleString("en-IN")}`;
    };

    const images = propertyData?.image_urls || propertyData?.images || [];

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Property</h2>
                    <p className="text-muted-foreground">{error.message}</p>
                    <Button onClick={() => navigate('/properties')} className="mt-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Properties
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header with Back Button */}
            <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => navigate('/properties')}
                                className="hover:bg-accent"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold">{propertyData?.title || 'Property Details'}</h1>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {propertyData?.city}, {propertyData?.state}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => setIsSaved(!isSaved)}>
                                <Heart className={cn("h-4 w-4", isSaved && "fill-red-500 text-red-500")} />
                            </Button>
                            <Button variant="outline" size="icon">
                                <Share2 className="h-4 w-4" />
                            </Button>
                            {isEditing ? (
                                <Button 
                                    onClick={() => propertyData && updatePropertyMutation.mutate(propertyData)}
                                    disabled={updatePropertyMutation.isPending}
                                >
                                    {updatePropertyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Property
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <Card className="overflow-hidden">
                            <div className="relative">
                                <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                                    {images.length > 0 ? (
                                        <img 
                                            src={images[activeImage]} 
                                            alt="Property" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Home className="h-20 w-20 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Image Navigation */}
                                {images.length > 1 && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur"
                                            onClick={() => setActiveImage(prev => prev > 0 ? prev - 1 : images.length - 1)}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur"
                                            onClick={() => setActiveImage(prev => prev < images.length - 1 ? prev + 1 : 0)}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                                
                                {/* Status Badge */}
                                <div className="absolute top-4 left-4">
                                    <Badge className={getStatusBadge(propertyData?.status).color}>
                                        {getStatusBadge(propertyData?.status).label}
                                    </Badge>
                                </div>
                                
                                {/* Image Counter */}
                                {images.length > 0 && (
                                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                                        {activeImage + 1} / {images.length}
                                    </div>
                                )}
                            </div>
                            
                            {/* Thumbnail Strip */}
                            {images.length > 1 && (
                                <div className="p-4 border-t">
                                    <div className="flex gap-2 overflow-x-auto">
                                        {images.map((img, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setActiveImage(index)}
                                                className={cn(
                                                    "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                                                    activeImage === index ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-gray-300"
                                                )}
                                            >
                                                <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Property Information Tabs */}
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                                <TabsTrigger value="location">Location</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="overview" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Property Description</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {isEditing ? (
                                            <Textarea 
                                                id="description" 
                                                value={propertyData?.description || ''} 
                                                onChange={handleInputChange} 
                                                rows={8}
                                                className="w-full"
                                            />
                                        ) : (
                                            <p className="text-muted-foreground leading-relaxed">
                                                {propertyData?.description || 'No description available.'}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="details" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Property Specifications</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Property Type</p>
                                            <p className="font-medium capitalize">{propertyData?.property_type || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Year Built</p>
                                            <p className="font-medium">{propertyData?.year_built || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Total Floors</p>
                                            <p className="font-medium">{propertyData?.total_floors || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Floor Number</p>
                                            <p className="font-medium">{propertyData?.floor_number || 'Ground'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Facing</p>
                                            <p className="font-medium capitalize">{propertyData?.facing_direction?.replace('_', ' ') || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Possession</p>
                                            <p className="font-medium capitalize">{propertyData?.possession_status?.replace('_', ' ') || 'N/A'}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="amenities" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Amenities & Features</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {Array.isArray(propertyData?.amenities) && propertyData.amenities.map((amenity, index) => {
                                                const Icon = amenityIcons[amenity] || amenityIcons.Default;
                                                return (
                                                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-accent/50">
                                                        <Icon className="h-4 w-4 text-primary" />
                                                        <span className="text-sm">{amenity}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {(!propertyData?.amenities || propertyData.amenities.length === 0) && (
                                            <p className="text-muted-foreground">No amenities listed</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="location" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Location Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">Address</p>
                                                <p className="font-medium">{propertyData?.address || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">Neighborhood</p>
                                                <p className="font-medium">{propertyData?.neighborhood || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">City</p>
                                                <p className="font-medium">{propertyData?.city || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">State</p>
                                                <p className="font-medium">{propertyData?.state || 'N/A'}</p>
                                            </div>
                                        </div>
                                        {/* Map placeholder */}
                                        <div className="h-64 bg-accent/20 rounded-lg flex items-center justify-center">
                                            <MapPin className="h-8 w-8 text-muted-foreground" />
                                            <span className="ml-2 text-muted-foreground">Map View</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right Column: Price & Key Details */}
                    <div className="space-y-6">
                        {/* Price Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Price Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-3xl font-bold text-primary">
                                        {formatPrice(propertyData?.price)}
                                    </p>
                                    {propertyData?.price_per_sqft && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            ₹{propertyData.price_per_sqft.toLocaleString()} per sqft
                                        </p>
                                    )}
                                </div>
                                {propertyData?.maintenance_charge && (
                                    <div className="pt-3 border-t">
                                        <p className="text-sm text-muted-foreground">Maintenance</p>
                                        <p className="font-medium">₹{propertyData.maintenance_charge.toLocaleString()}/month</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Key Features Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Key Features</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Square className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Area</p>
                                            <p className="font-semibold">{propertyData?.area_sqft || 0} sqft</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Bed className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Bedrooms</p>
                                            <p className="font-semibold">{propertyData?.bedrooms || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Bath className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Bathrooms</p>
                                            <p className="font-semibold">{propertyData?.bathrooms || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Car className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Parking</p>
                                            <p className="font-semibold">{propertyData?.parking_spaces || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <Separator className="my-4" />
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Furnishing</span>
                                        <Badge variant="outline">
                                            {getFurnishingBadge(propertyData?.furnished_status).label}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Balconies</span>
                                        <span className="font-medium">{propertyData?.balconies || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Interested in this property?</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button className="w-full" size="lg">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Send Inquiry
                                </Button>
                                <Button variant="outline" className="w-full" size="lg">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Schedule Visit
                                </Button>
                                <Button variant="outline" className="w-full" size="lg">
                                    <Phone className="h-4 w-4 mr-2" />
                                    Contact Agent
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Property Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Property Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Eye className="h-4 w-4" />
                                        Views
                                    </div>
                                    <span className="font-medium">{propertyData?.views_count || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MessageSquare className="h-4 w-4" />
                                        Inquiries
                                    </div>
                                    <span className="font-medium">{propertyData?.inquiries_count || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Heart className="h-4 w-4" />
                                        Saved
                                    </div>
                                    <span className="font-medium">{propertyData?.favorites_count || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Share2 className="h-4 w-4" />
                                        Shares
                                    </div>
                                    <span className="font-medium">{propertyData?.shares_count || 0}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
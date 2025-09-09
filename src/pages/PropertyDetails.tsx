import React, { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { notificationsService, propertiesService } from '@/services/database.service';
import DragDropImageUpload from '@/components/DragDropImageUpload';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import PropertyMap from '@/components/PropertyMap';
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
  Ruler,
  Compass,
  CalendarClock,
  FileText,
  Download,
  ExternalLink,
  Upload,
  Trash2,
  Plus,
  Bell
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Property {
    id: number;
    title?: string;
    description?: string;
    property_type?: string;
    property_subtype?: string | null;
    category?: 'sale' | 'rent' | 'lease';
    sale_type?: 'new' | 'resale' | null;
    subcategory?: 'eh_commercial' | 'eh_verified' | 'eh_signature' | 'eh_dubai' | null;
    status?: string;
    
    // Location
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
    state_code?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    neighborhood?: string;
    locality?: string;
    landmark?: string;
    map_location?: any;
    
    // Pricing
    price?: number;
    price_per_sqft?: number;
    maintenance_fee?: number;
    
    // Specifications
    area_sqft?: number;
    bedrooms?: number;
    bathrooms?: number;
    balconies?: number;
    total_floors?: number;
    floor_number?: number;
    parking_spaces?: number;
    
    // Features
    furnishing_status?: string;
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
    draft: { label: "Draft", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" },
    active: { label: "Active", color: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400" },
    pending: { label: "Pending", color: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400" },
    under_contract: { label: "Under Contract", color: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400" },
    sold: { label: "Sold", color: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400" },
    rented: { label: "Rented", color: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400" },
    inactive: { label: "Inactive", color: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" }
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

const getCategoryBadge = (category?: string, saleType?: string | null) => {
  const categoryConfig: Record<string, { label: string; color: string }> = {
    sale: { 
      label: saleType === 'new' ? "For Sale (New)" : saleType === 'resale' ? "For Sale (Resale)" : "For Sale", 
      color: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400" 
    },
    rent: { label: "For Rent", color: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400" },
    lease: { label: "For Leasing", color: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400" }
  };
  return categoryConfig[category || 'sale'] || categoryConfig.sale;
};

const getSubcategoryBadge = (subcategory?: string | null) => {
  const subcategoryConfig: Record<string, { label: string; color: string; icon: any }> = {
    eh_commercial: { 
      label: "EH Commercial", 
      color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      icon: Building2
    },
    eh_verified: { 
      label: "EH Verified", 
      color: "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
      icon: Shield
    },
    eh_signature: { 
      label: "EH Signature", 
      color: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white",
      icon: Star
    },
    eh_dubai: { 
      label: "EH Dubai", 
      color: "bg-gradient-to-r from-purple-500 to-pink-600 text-white",
      icon: TrendingUp
    }
  };
  return subcategory && subcategoryConfig[subcategory] ? subcategoryConfig[subcategory] : null;
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
    .eq('id', parseInt(id))
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
    const [userProfile, setUserProfile] = useState<any>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<number | null>(null);
    const [editingAmenities, setEditingAmenities] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState(false);

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

    // Fetch user profile to check if admin
    useEffect(() => {
        const fetchUserProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setUserProfile({ ...profile, userId: user.id });
            }
        };
        fetchUserProfile();
    }, []);

    const updatePropertyMutation = useMutation<void, Error, Property>({
        mutationFn: async (updatedData) => {
            const { id: propertyId, created_at, updated_at, age_of_property, area_sqm, ...updateFields } = updatedData;
            
            // Log the data being sent for debugging
            console.log('Updating property with ID:', propertyId);
            console.log('Update fields:', updateFields);
            
            // First, update the property
            const { data: updateData, error: updateError } = await supabase
                .from('properties')
                .update(updateFields)
                .eq('id', propertyId)
                .select();
                
            if (updateError) {
                console.error('Update error:', updateError);
                throw updateError;
            }
            
            console.log('Update response:', updateData);
            
            // Then, fetch the updated property
            const { data, error: fetchError } = await supabase
                .from('properties')
                .select('*')
                .eq('id', propertyId)
                .single();
                
            if (fetchError) {
                console.error('Fetch error:', fetchError);
                throw fetchError;
            }
            
            console.log('Update successful, returned data:', data);
            
            // Update local state with the returned data
            if (data) {
                setPropertyData(data);
            }
            
            // Try to create notification but don't fail if it doesn't work
            try {
                if (userProfile && userProfile.userId) {
                    await notificationsService.createNotification({
                        user_id: userProfile.userId || userProfile.id,
                        title: 'Property Updated',
                        message: `Property "${updatedData.title}" has been updated successfully`,
                        type: 'success',
                        action_url: `/properties/${propertyId}`,
                        is_read: false,
                        metadata: {
                            property_id: Number(propertyId),
                            category: 'property',
                            priority: 'normal'
                        }
                    });
                }
            } catch (notificationError) {
                // Log error but don't fail the entire update
                console.log('Notification creation failed (RLS policy issue):', notificationError);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['property', id] });
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            toast({ 
                title: "Success", 
                description: "Property details updated successfully."
            });
            setIsEditing(false);
        },
        onError: (error: any) => {
            console.error('Full error details:', error);
            const errorMessage = error?.message || 'Failed to update property';
            const errorDetails = error?.details || '';
            toast({ 
                title: "Error updating property", 
                description: `${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`, 
                variant: "destructive" 
            });
        }
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        let processedValue: any = value;
        
        // Handle number inputs
        if (type === 'number') {
            processedValue = value === '' ? null : Number(value);
        }
        
        setPropertyData(prev => prev ? { ...prev, [id]: processedValue } as Property : prev);
    };

    const handleSelectChange = (field: string, value: string) => {
        setPropertyData(prev => prev ? { ...prev, [field]: value } as Property : prev);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingImage(true);
        const newImageUrls: string[] = [];

        for (const file of files) {
            const fileName = `property-${id}-${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
                .from('property-images')
                .upload(fileName, file);

            if (!error && data) {
                const { data: { publicUrl } } = supabase.storage
                    .from('property-images')
                    .getPublicUrl(fileName);
                newImageUrls.push(publicUrl);
            }
        }

        if (newImageUrls.length > 0) {
            const updatedImages = [...(propertyData?.image_urls || []), ...newImageUrls];
            setPropertyData(prev => prev ? { ...prev, image_urls: updatedImages } as Property : prev);
            toast({ title: "Success", description: `${newImageUrls.length} image(s) uploaded successfully` });
        }
        setUploadingImage(false);
    };

    const handleImageDelete = async (index: number) => {
        if (!propertyData?.image_urls) return;
        
        const imageUrl = propertyData.image_urls[index];
        const fileName = imageUrl.split('/').pop();
        
        if (fileName) {
            await supabase.storage
                .from('property-images')
                .remove([fileName]);
        }
        
        const updatedImages = propertyData.image_urls.filter((_, i) => i !== index);
        setPropertyData(prev => prev ? { ...prev, image_urls: updatedImages } as Property : prev);
        setImageToDelete(null);
        
        // Adjust activeImage if necessary
        if (activeImage >= updatedImages.length && updatedImages.length > 0) {
            setActiveImage(updatedImages.length - 1);
        }
        
        toast({ title: "Success", description: "Image deleted successfully" });
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
            {/* Header */}
            <div className="bg-background/60 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => navigate('/properties')}
                                className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:block w-0.5 h-10 bg-border" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                            {propertyData?.title || 'Property Details'}
                                        </h1>
                                        {propertyData?.is_featured && (
                                            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-sm">
                                                <Star className="h-3 w-3 mr-1 fill-current" />
                                                Featured
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                                        <MapPin className="h-3.5 w-3.5 text-primary/60" />
                                        <span>{[propertyData?.neighborhood, propertyData?.city, propertyData?.state].filter(Boolean).join(', ') || 'Location'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Action Buttons */}
                            <div className="hidden md:flex items-center gap-3 mr-3 text-sm">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Eye className="h-4 w-4" />
                                    <span className="font-medium">{propertyData?.views_count || 0} views</span>
                                </div>
                                <div className="w-px h-5 bg-border" />
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="font-medium">{propertyData?.inquiries_count || 0} inquiries</span>
                                </div>
                            </div>
                            
                            <Button 
                                variant={isSaved ? "default" : "outline"} 
                                size="icon" 
                                onClick={() => setIsSaved(!isSaved)}
                                className={cn(
                                    "rounded-full shadow-sm hover:shadow-md transition-all",
                                    isSaved && "bg-red-500 hover:bg-red-600 border-red-500"
                                )}
                            >
                                <Heart className={cn("h-4 w-4", isSaved && "fill-white text-white")} />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="icon"
                                className="rounded-full shadow-sm hover:shadow-md hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                        className="rounded-full"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={() => propertyData && updatePropertyMutation.mutate(propertyData)}
                                        disabled={updatePropertyMutation.isPending}
                                        className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl rounded-full transition-all"
                                    >
                                        {updatePropertyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setIsEditing(true)}
                                        className="rounded-full shadow-sm hover:shadow-md hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                                    >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit Property
                                    </Button>
                                    {userProfile?.role === 'admin' && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive">
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete Property
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the property "{propertyData?.title}". 
                                                        This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={async () => {
                                                            setIsDeleting(true);
                                                            try {
                                                                await propertiesService.deleteProperty(propertyData?.id!);
                                                                toast({
                                                                    title: "Success",
                                                                    description: "Property deleted successfully"
                                                                });
                                                                navigate('/properties');
                                                            } catch (error) {
                                                                console.error('Delete error:', error);
                                                                toast({
                                                                    title: "Error",
                                                                    description: "Failed to delete property",
                                                                    variant: "destructive"
                                                                });
                                                                setIsDeleting(false);
                                                            }
                                                        }}
                                                        disabled={isDeleting}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        {isDeleting ? "Deleting..." : "Delete"}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image Gallery */}
                        <Card className="overflow-hidden border-0 shadow-xl bg-background">
                            <div className="relative">
                                <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
                                    {images.length > 0 ? (
                                        <img 
                                            src={images[activeImage]} 
                                            alt="Property" 
                                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop";
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <div className="p-6 rounded-full bg-muted/30 mb-4">
                                                <Home className="h-16 w-16 text-muted-foreground/50" />
                                            </div>
                                            <p className="text-muted-foreground">No images available</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Navigation Controls */}
                                {images.length > 1 && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-md shadow-lg hover:scale-110 transition-all duration-200 h-12 w-12"
                                            onClick={() => setActiveImage(prev => prev > 0 ? prev - 1 : images.length - 1)}
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-md shadow-lg hover:scale-110 transition-all duration-200 h-12 w-12"
                                            onClick={() => setActiveImage(prev => prev < images.length - 1 ? prev + 1 : 0)}
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </Button>
                                    </>
                                )}
                                
                                {/* Status Badges */}
                                <div className="absolute top-6 left-6 flex gap-3 flex-wrap max-w-md">
                                    {!isEditing && (
                                        <>
                                            <Badge className={cn(
                                                "px-4 py-2 text-sm font-medium shadow-xl backdrop-blur-md border-0",
                                                propertyData?.category === 'sale' ? "bg-blue-500/90 text-white" : 
                                                propertyData?.category === 'rent' ? "bg-green-500/90 text-white" :
                                                "bg-purple-500/90 text-white"
                                            )}>
                                                {getCategoryBadge(propertyData?.category, propertyData?.sale_type).label}
                                            </Badge>
                                            {getSubcategoryBadge(propertyData?.subcategory) && (
                                                <Badge className={cn(
                                                    "shadow-xl backdrop-blur-md border-0 px-4 py-2 text-sm font-medium",
                                                    getSubcategoryBadge(propertyData?.subcategory)!.color
                                                )}>
                                                    {getSubcategoryBadge(propertyData?.subcategory)!.icon && 
                                                        React.createElement(
                                                            getSubcategoryBadge(propertyData?.subcategory)!.icon,
                                                            { className: "h-3.5 w-3.5 mr-1.5" }
                                                        )
                                                    }
                                                    {getSubcategoryBadge(propertyData?.subcategory)!.label}
                                                </Badge>
                                            )}
                                        </>
                                    )}
                                    {isEditing && userProfile?.role === 'admin' ? (
                                        <Select 
                                            value={propertyData?.status || 'draft'} 
                                            onValueChange={(value) => handleSelectChange('status', value)}
                                        >
                                            <SelectTrigger className="w-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
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
                                    ) : (
                                        <Badge className={getStatusBadge(propertyData?.status).color}>
                                            {getStatusBadge(propertyData?.status).label}
                                        </Badge>
                                    )}
                                </div>
                                
                                {/* Image Counter */}
                                {images.length > 0 && (
                                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                                        {activeImage + 1} / {images.length}
                                    </div>
                                )}
                            </div>
                            
                            {/* Thumbnail Gallery */}
                            <div className="p-6 border-t border-border/50 bg-background">
                                <div className="flex gap-3 overflow-x-auto items-center pb-2 scrollbar-hide">
                                    {images.map((img, index) => (
                                        <div key={index} className="relative group">
                                            <button
                                                onClick={() => setActiveImage(index)}
                                                className={cn(
                                                    "relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300",
                                                    activeImage === index 
                                                        ? "border-primary shadow-lg shadow-primary/25 scale-105" 
                                                        : "border-transparent hover:border-primary/50 hover:shadow-md opacity-70 hover:opacity-100"
                                                )}
                                            >
                                                <img 
                                                    src={img} 
                                                    alt={`Thumbnail ${index + 1}`} 
                                                    className="w-full h-full object-cover" 
                                                />
                                                {activeImage === index && (
                                                    <div className="absolute inset-0 bg-primary/10" />
                                                )}
                                            </button>
                                            {isEditing && (
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleImageDelete(index)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {isEditing && (
                                        <div className="flex-shrink-0">
                                            <input
                                                type="file"
                                                id="image-upload"
                                                className="hidden"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                            />
                                            <label
                                                htmlFor="image-upload"
                                                className={cn(
                                                    "flex items-center justify-center w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors",
                                                    uploadingImage && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                {uploadingImage ? (
                                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                                ) : (
                                                    <Plus className="h-6 w-6 text-gray-400" />
                                                )}
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Property Information Tabs */}
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className={cn(
                                "grid w-full bg-muted/30 border-0 p-1.5 rounded-xl shadow-sm",
                                isEditing ? "grid-cols-5" : "grid-cols-4"
                            )}>
                                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                                    <FileText className="h-4 w-4 mr-2 hidden sm:block" />
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                                    <Ruler className="h-4 w-4 mr-2 hidden sm:block" />
                                    Details
                                </TabsTrigger>
                                <TabsTrigger value="amenities" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                                    <Shield className="h-4 w-4 mr-2 hidden sm:block" />
                                    Amenities
                                </TabsTrigger>
                                <TabsTrigger value="location" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                                    <MapPin className="h-4 w-4 mr-2 hidden sm:block" />
                                    Location
                                </TabsTrigger>
                                {isEditing && (
                                    <TabsTrigger value="images" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                                        <Upload className="h-4 w-4 mr-2 hidden sm:block" />
                                        Images
                                    </TabsTrigger>
                                )}
                            </TabsList>
                            
                            <TabsContent value="overview" className="mt-6">
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl font-bold">Property Description</CardTitle>
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <FileText className="h-5 w-5 text-primary" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {isEditing ? (
                                            <>
                                                <div>
                                                    <Label htmlFor="title">Property Title</Label>
                                                    <Input
                                                        id="title"
                                                        value={propertyData?.title || ''}
                                                        onChange={handleInputChange}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="description">Description</Label>
                                                    <Textarea 
                                                        id="description" 
                                                        value={propertyData?.description || ''} 
                                                        onChange={handleInputChange} 
                                                        rows={8}
                                                        className="mt-1 w-full"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="price">Price (₹)</Label>
                                                        <Input
                                                            id="price"
                                                            type="number"
                                                            value={propertyData?.price || ''}
                                                            onChange={handleInputChange}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="area_sqft">Area (sq.ft)</Label>
                                                        <Input
                                                            id="area_sqft"
                                                            type="number"
                                                            value={propertyData?.area_sqft || ''}
                                                            onChange={handleInputChange}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mt-4">
                                                    <div>
                                                        <Label htmlFor="category">Category</Label>
                                                        <Select 
                                                            value={propertyData?.category || 'sale'} 
                                                            onValueChange={(value) => {
                                                                handleSelectChange('category', value);
                                                                // Reset sale_type if category is not sale
                                                                if (value !== 'sale') {
                                                                    handleSelectChange('sale_type', null);
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className="mt-1">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="sale">For Sale</SelectItem>
                                                                <SelectItem value="rent">For Rent</SelectItem>
                                                                <SelectItem value="lease">For Leasing</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {propertyData?.category === 'sale' && (
                                                        <div>
                                                            <Label htmlFor="sale_type">Sale Type</Label>
                                                            <Select 
                                                                value={propertyData?.sale_type || 'new'} 
                                                                onValueChange={(value) => handleSelectChange('sale_type', value)}
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="new">New</SelectItem>
                                                                    <SelectItem value="resale">Resale</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mt-4">
                                                    <div>
                                                        <Label htmlFor="subcategory">EH Category (Premium)</Label>
                                                        <Select 
                                                            value={propertyData?.subcategory || 'none'} 
                                                            onValueChange={(value) => handleSelectChange('subcategory', value === 'none' ? null : value)}
                                                        >
                                                            <SelectTrigger className="mt-1">
                                                                <SelectValue placeholder="Select EH Category" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">None</SelectItem>
                                                                <SelectItem value="eh_commercial">EH Commercial - Premium Commercial Properties</SelectItem>
                                                                <SelectItem value="eh_verified">EH Verified - Verified Premium Properties</SelectItem>
                                                                <SelectItem value="eh_signature">EH Signature - Luxury Signature Collection</SelectItem>
                                                                <SelectItem value="eh_dubai">EH Dubai - Exclusive Dubai Properties</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex items-center space-x-2 mt-6">
                                                        <Checkbox 
                                                            id="is_featured" 
                                                            checked={propertyData?.is_featured || false}
                                                            onCheckedChange={(checked) => 
                                                                setPropertyData(prev => prev ? { ...prev, is_featured: checked as boolean } as Property : prev)
                                                            }
                                                        />
                                                        <Label 
                                                            htmlFor="is_featured" 
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            Feature this property
                                                        </Label>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-muted-foreground leading-relaxed">
                                                {propertyData?.description || 'No description available.'}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="details" className="mt-6">
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl font-bold">Property Specifications</CardTitle>
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Ruler className="h-5 w-5 text-primary" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {isEditing ? (
                                            <>
                                                <div className="space-y-1">
                                                    <Label htmlFor="property_type">Property Type</Label>
                                                    <Select 
                                                        value={propertyData?.property_type || ''} 
                                                        onValueChange={(value) => handleSelectChange('property_type', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="residential">Residential</SelectItem>
                                                            <SelectItem value="commercial">Commercial</SelectItem>
                                                            <SelectItem value="land">Land</SelectItem>
                                                            <SelectItem value="industrial">Industrial</SelectItem>
                                                            <SelectItem value="agricultural">Agricultural</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="year_built">Year Built</Label>
                                                    <Input
                                                        id="year_built"
                                                        type="number"
                                                        value={propertyData?.year_built || ''}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="total_floors">Total Floors</Label>
                                                    <Input
                                                        id="total_floors"
                                                        type="number"
                                                        value={propertyData?.total_floors || ''}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="floor_number">Floor Number</Label>
                                                    <Input
                                                        id="floor_number"
                                                        type="number"
                                                        value={propertyData?.floor_number || ''}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="bedrooms">Bedrooms</Label>
                                                    <Input
                                                        id="bedrooms"
                                                        type="number"
                                                        value={propertyData?.bedrooms || ''}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="bathrooms">Bathrooms</Label>
                                                    <Input
                                                        id="bathrooms"
                                                        type="number"
                                                        value={propertyData?.bathrooms || ''}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="facing_direction">Facing Direction</Label>
                                                    <Select 
                                                        value={propertyData?.facing_direction || ''} 
                                                        onValueChange={(value) => handleSelectChange('facing_direction', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="north">North</SelectItem>
                                                            <SelectItem value="south">South</SelectItem>
                                                            <SelectItem value="east">East</SelectItem>
                                                            <SelectItem value="west">West</SelectItem>
                                                            <SelectItem value="north_east">North East</SelectItem>
                                                            <SelectItem value="north_west">North West</SelectItem>
                                                            <SelectItem value="south_east">South East</SelectItem>
                                                            <SelectItem value="south_west">South West</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="parking_spaces">Parking Spaces</Label>
                                                    <Input
                                                        id="parking_spaces"
                                                        type="number"
                                                        value={propertyData?.parking_spaces || ''}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="furnishing_status">Furnishing Status</Label>
                                                    <Select 
                                                        value={propertyData?.furnishing_status || ''} 
                                                        onValueChange={(value) => handleSelectChange('furnishing_status', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="unfurnished">Unfurnished</SelectItem>
                                                            <SelectItem value="semi_furnished">Semi Furnished</SelectItem>
                                                            <SelectItem value="fully_furnished">Fully Furnished</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-3 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Building2 className="h-4 w-4 text-primary" />
                                                        <p className="text-xs text-muted-foreground font-medium">Property Type</p>
                                                    </div>
                                                    <p className="font-semibold text-lg capitalize">{propertyData?.property_type || 'N/A'}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Calendar className="h-4 w-4 text-primary" />
                                                        <p className="text-xs text-muted-foreground font-medium">Year Built</p>
                                                    </div>
                                                    <p className="font-semibold text-lg">{propertyData?.year_built || 'N/A'}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Building2 className="h-4 w-4 text-primary" />
                                                        <p className="text-xs text-muted-foreground font-medium">Total Floors</p>
                                                    </div>
                                                    <p className="font-semibold text-lg">{propertyData?.total_floors || 'N/A'}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Home className="h-4 w-4 text-primary" />
                                                        <p className="text-xs text-muted-foreground font-medium">Floor Number</p>
                                                    </div>
                                                    <p className="font-semibold text-lg">{propertyData?.floor_number || 'Ground'}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Compass className="h-4 w-4 text-primary" />
                                                        <p className="text-xs text-muted-foreground font-medium">Facing</p>
                                                    </div>
                                                    <p className="font-semibold text-lg capitalize">{propertyData?.facing_direction?.replace('_', ' ') || 'N/A'}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <CalendarClock className="h-4 w-4 text-primary" />
                                                        <p className="text-xs text-muted-foreground font-medium">Possession</p>
                                                    </div>
                                                    <p className="font-semibold text-lg capitalize">{propertyData?.possession_status?.replace('_', ' ') || 'N/A'}</p>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="amenities" className="mt-6">
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl font-bold">Amenities & Features</CardTitle>
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Shield className="h-5 w-5 text-primary" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {isEditing ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                                                    <Textarea
                                                        id="amenities"
                                                        value={Array.isArray(propertyData?.amenities) 
                                                            ? propertyData.amenities.join(', ') 
                                                            : propertyData?.amenities || ''}
                                                        onChange={(e) => {
                                                            const amenitiesArray = e.target.value
                                                                .split(',')
                                                                .map(a => a.trim())
                                                                .filter(a => a.length > 0);
                                                            setPropertyData(prev => prev ? { ...prev, amenities: amenitiesArray } as Property : prev);
                                                        }}
                                                        rows={4}
                                                        placeholder="e.g., Swimming Pool, Gym, Security, Parking, Wi-Fi, Garden"
                                                        className="mt-1 w-full"
                                                    />
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Enter amenities separated by commas
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {Array.isArray(propertyData?.amenities) && propertyData.amenities.map((amenity, index) => {
                                                        const Icon = amenityIcons[amenity] || amenityIcons.Default;
                                                        return (
                                                            <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-accent/50">
                                                                <div className="flex items-center gap-2">
                                                                    <Icon className="h-4 w-4 text-primary" />
                                                                    <span className="text-sm">{amenity}</span>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const updatedAmenities = propertyData.amenities?.filter((_, i) => i !== index) || [];
                                                                        setPropertyData(prev => prev ? { ...prev, amenities: updatedAmenities } as Property : prev);
                                                                    }}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {Array.isArray(propertyData?.amenities) && propertyData.amenities.map((amenity, index) => {
                                                        const Icon = amenityIcons[amenity] || amenityIcons.Default;
                                                        return (
                                                            <div key={index} className="group p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 hover:from-primary/10 hover:to-primary/15 hover:shadow-md transition-all duration-300">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                                        <Icon className="h-4 w-4 text-primary" />
                                                                    </div>
                                                                    <span className="text-sm font-medium">{amenity}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {(!propertyData?.amenities || propertyData.amenities.length === 0) && (
                                                    <p className="text-muted-foreground">No amenities listed</p>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="location" className="mt-6">
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl font-bold">Location Details</CardTitle>
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <MapPin className="h-5 w-5 text-primary" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {isEditing ? (
                                            <LocationAutocomplete
                                                country={propertyData?.country || 'India'}
                                                state={propertyData?.state || ''}
                                                city={propertyData?.city || ''}
                                                locality={propertyData?.locality || propertyData?.neighborhood || ''}
                                                address={propertyData?.address || ''}
                                                postalCode={propertyData?.postal_code || ''}
                                                onLocationChange={(location) => {
                                                    setPropertyData({
                                                        ...propertyData,
                                                        country: location.country || propertyData?.country,
                                                        country_code: location.country_code || propertyData?.country_code,
                                                        state: location.state || propertyData?.state,
                                                        state_code: location.state_code || propertyData?.state_code,
                                                        city: location.city || propertyData?.city,
                                                        locality: location.locality || propertyData?.locality,
                                                        neighborhood: location.locality || propertyData?.neighborhood,
                                                        address: location.address || propertyData?.address,
                                                        postal_code: location.postal_code || propertyData?.postal_code,
                                                        latitude: location.latitude !== undefined ? location.latitude : propertyData?.latitude,
                                                        longitude: location.longitude !== undefined ? location.longitude : propertyData?.longitude
                                                    });
                                                }}
                                            />
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MapPin className="h-4 w-4 text-primary" />
                                                        <p className="text-sm text-muted-foreground font-medium">Address</p>
                                                    </div>
                                                    <p className="font-medium">{propertyData?.address || 'N/A'}</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Home className="h-4 w-4 text-primary" />
                                                        <p className="text-sm text-muted-foreground font-medium">Locality</p>
                                                    </div>
                                                    <p className="font-medium">{propertyData?.locality || propertyData?.neighborhood || 'N/A'}</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Building2 className="h-4 w-4 text-primary" />
                                                        <p className="text-sm text-muted-foreground font-medium">City</p>
                                                    </div>
                                                    <p className="font-medium">{propertyData?.city || 'N/A'}</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MapPin className="h-4 w-4 text-primary" />
                                                        <p className="text-sm text-muted-foreground font-medium">State</p>
                                                    </div>
                                                    <p className="font-medium">{propertyData?.state || 'N/A'}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Interactive Map */}
                                        <div className="mt-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Compass className="h-4 w-4 text-primary" />
                                                <p className="text-sm font-medium text-muted-foreground">Interactive Map View</p>
                                            </div>
                                            <div className="h-96 rounded-xl overflow-hidden border-2 border-border/50 shadow-lg">
                                                <PropertyMap
                                                    latitude={propertyData?.latitude}
                                                    longitude={propertyData?.longitude}
                                                    address={propertyData?.address}
                                                    isEditable={isEditing}
                                                    onLocationChange={(lat, lng) => {
                                                        if (isEditing) {
                                                            setPropertyData({
                                                                ...propertyData,
                                                                latitude: lat,
                                                                longitude: lng
                                                            });
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            {/* Images Tab (only shown when editing) */}
                            {isEditing && (
                                <TabsContent value="images" className="mt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Manage Property Images</CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                Drag and drop to upload or reorder images. You can also add image URLs.
                                            </p>
                                        </CardHeader>
                                        <CardContent>
                                            <DragDropImageUpload
                                                images={propertyData?.image_urls || []}
                                                onImagesChange={(newImages) => {
                                                    setPropertyData(prev => prev ? {
                                                        ...prev,
                                                        image_urls: newImages
                                                    } as Property : prev);
                                                }}
                                                maxImages={20}
                                                entityType="property"
                                                entityId={id}
                                            />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            )}
                        </Tabs>
                    </div>

                    {/* Right Column: Property Information */}
                    <div className="space-y-6">
                        {/* Price Card */}
                        <Card className="border-0 shadow-xl bg-background overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold">Investment Value</CardTitle>
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <IndianRupee className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-xl bg-background shadow-inner border border-border/50">
                                    <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                                        {formatPrice(propertyData?.price)}
                                    </p>
                                    {propertyData?.category === 'rent' && (
                                        <p className="text-sm font-medium text-muted-foreground mt-1">per month</p>
                                    )}
                                    {propertyData?.price_per_sqft && (
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                            <p className="text-sm font-medium text-muted-foreground">
                                                ₹{propertyData.price_per_sqft.toLocaleString()} per sqft
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {propertyData?.maintenance_fee && (
                                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Maintenance</span>
                                            <span className="font-semibold">₹{propertyData.maintenance_fee.toLocaleString()}/mo</span>
                                        </div>
                                    </div>
                                )}
                                <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all">
                                    <Phone className="h-5 w-5 mr-2" />
                                    Contact Agent
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Key Features Card */}
                        <Card className="border-0 shadow-xl bg-background">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold">Property Highlights</CardTitle>
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Home className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
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
                                            {getFurnishingBadge(propertyData?.furnishing_status).label}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Balconies</span>
                                        <span className="font-medium">{propertyData?.balconies || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Property Stats Card */}
                        <Card className="border-0 shadow-xl bg-background overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold">Engagement Metrics</CardTitle>
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <Eye className="h-4 w-4 text-blue-500" />
                                            <span className="text-xs font-medium text-blue-500">+12%</span>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-500">{propertyData?.views_count || 0}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Total Views</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <MessageSquare className="h-4 w-4 text-green-500" />
                                            <span className="text-xs font-medium text-green-500">Active</span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-500">{propertyData?.inquiries_count || 0}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Inquiries</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <Heart className="h-4 w-4 text-red-500" />
                                            <span className="text-xs font-medium text-red-500">Popular</span>
                                        </div>
                                        <p className="text-2xl font-bold text-red-500">{propertyData?.favorites_count || 0}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Saved</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <Share2 className="h-4 w-4 text-purple-500" />
                                            <span className="text-xs font-medium text-purple-500">Viral</span>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-500">{propertyData?.shares_count || 0}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Shares</p>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bell className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Listed on</span>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {propertyData?.created_at ? format(new Date(propertyData.created_at), 'MMM dd, yyyy') : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
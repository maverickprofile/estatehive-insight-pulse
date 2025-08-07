import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // <-- FIX: Added Avatar imports
import { Loader2, ArrowLeft, Edit, Save, MapPin, Building, Home, Store, BedDouble, Bath, Car, Ruler, User, ArrowRight } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import type { Property } from '@/types';

interface Property {
    id: string;
    title?: string;
    location?: string;
    price?: number;
    status?: string;
    bedrooms?: number;
    bathrooms?: number;
    parking_spots?: number;
    size?: string;
    image_urls?: string[];
    agent?: string;
    amenities?: string[] | string;
    description?: string;
}

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
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
    const [propertyData, setPropertyData] = useState<Property | null>(null);
    const [activeImage, setActiveImage] = useState(0);

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

    const handleAmenitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setPropertyData(prev => prev ? { ...prev, amenities: value.split(',').map(item => item.trim()).filter(Boolean) } : prev);
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="flex h-screen items-center justify-center text-destructive">Error: {error.message}</div>;
    }

    return (
        <div className="bg-background min-h-screen">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                    <div>
                        {isEditing ? (
                            <Input id="title" value={propertyData?.title || ''} onChange={handleInputChange} className="text-3xl font-bold h-auto" />
                        ) : (
                            <h1 className="text-3xl font-bold text-foreground">{propertyData?.title}</h1>
                        )}
                        {isEditing ? (
                            <Input id="location" value={propertyData?.location || ''} onChange={handleInputChange} className="mt-1" />
                        ) : (
                            <div className="flex items-center text-muted-foreground mt-1"><MapPin className="w-4 h-4 mr-2" />{propertyData?.location}</div>
                        )}
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        {isEditing ? (
                            <Button onClick={() => propertyData && updatePropertyMutation.mutate(propertyData)} disabled={updatePropertyMutation.isPending}>
                                {updatePropertyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setIsEditing(true)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700">
                                    Purchase This Property <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Image Gallery & Agent */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <div className="aspect-video w-full overflow-hidden rounded-xl">
                                <img src={propertyData?.image_urls?.[activeImage]} alt="Main property view" className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {propertyData?.image_urls?.map((url: string, index: number) => (
                                    <div key={index} className={cn("cursor-pointer rounded-lg overflow-hidden border-2", activeImage === index ? 'border-primary' : 'border-transparent')} onClick={() => setActiveImage(index)}>
                                        <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-24 object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Agent Details */}
                        <div className="metric-card">
                            <h3 className="text-lg font-semibold mb-4">Agent Details</h3>
                             <div className="flex items-center gap-4">
                                <Avatar className="w-16 h-16">
                                    <AvatarImage src="https://github.com/shadcn.png" alt="Agent Avatar" />
                                    <AvatarFallback>AG</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-foreground">{propertyData?.agent || 'N/A'}</p>
                                    <p className="text-sm text-muted-foreground">Ray White Inner North</p>
                                    <Button variant="outline" className="mt-2">Contact Agent & View Listing</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details & Description */}
                    <div className="space-y-8">
                        {/* Key Details Card */}
                        <div className="metric-card">
                             <div className="flex items-center justify-between mb-4">
                                <div className="text-3xl font-bold text-primary flex items-center">
                                    <span className="text-4xl mr-1">₹</span>{propertyData?.price}
                                </div>
                                <Badge>{propertyData?.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                <div className="flex flex-col items-center"><BedDouble className="w-6 h-6 mb-1 text-primary"/> <span className="text-sm">{propertyData?.bedrooms || 0} Beds</span></div>
                                <div className="flex flex-col items-center"><Bath className="w-6 h-6 mb-1 text-primary"/> <span className="text-sm">{propertyData?.bathrooms || 0} Baths</span></div>
                                <div className="flex flex-col items-center"><Car className="w-6 h-6 mb-1 text-primary"/> <span className="text-sm">{propertyData?.parking_spots || 0} Parks</span></div>
                                <div className="flex flex-col items-center"><Ruler className="w-6 h-6 mb-1 text-primary"/> <span className="text-sm">{propertyData?.size || 'N/A'}</span></div>
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className="metric-card">
                            <h3 className="text-lg font-semibold mb-2">Snap Up This Great Investment</h3>
                             {isEditing ? (
                                <Textarea id="description" value={propertyData?.description || ''} onChange={handleInputChange} rows={8} />
                            ) : (
                                <p className="text-muted-foreground leading-relaxed">{propertyData?.description || 'No description available.'}</p>
                            )}
                        </div>

                        {/* Amenities Card */}
                        <div className="metric-card">
                             <h3 className="text-lg font-semibold mb-2">Amenities</h3>
                             {isEditing ? (
                                <Input id="amenities" value={propertyData?.amenities?.join(', ') || ''} onChange={handleAmenitiesChange} placeholder="Comma-separated amenities" />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {propertyData?.amenities?.map((amenity, index) => (
                                        <Badge key={index} variant="secondary">{amenity}</Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

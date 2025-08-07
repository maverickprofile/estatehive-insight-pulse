import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UploadCloud, X, ArrowLeft, Plus, Check } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';

// --- Data ---
const allAmenities = [
  "Swimming Pool", "Gymnasium", "Reserved Parking", "Security", "Lift",
  "Clubhouse", "Power Backup", "Vaastu Compliant", "Private Terrace/Garden",
  "Intercom Facility", "Maintenance Staff", "Piped Gas", "RO Water System",
  "Park", "Kids Play Area", "Rainwater Harvesting", "Servant Quarters"
];

const fetchAgents = async () => {
    const { data, error } = await supabase.from('agents').select('id, name');
    if (error) throw new Error(error.message);
    return data;
};

// --- Main Component ---
export default function AddPropertyPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    
    const [propertyData, setPropertyData] = useState({
        title: '',
        category: 'For Sale',
        price: '',
        location: '',
        agent_id: null as string | null,
        bhk: '',
        area: '',
        badge: 'EH Verified™',
        status: 'active',
        description: '',
    });

    const { data: agents = [] } = useQuery({ queryKey: ['agents'], queryFn: fetchAgents });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setPropertyData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: keyof typeof propertyData, value: any) => {
        setPropertyData(prev => ({ ...prev, [id]: value }));
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };
    
    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity)
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };

    const addPropertyMutation = useMutation({
        mutationFn: async (imageUrls: string[]) => {
            const finalData = { ...propertyData, amenities: selectedAmenities, image_urls: imageUrls };
            const { error } = await supabase.from('properties').insert([finalData]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            toast({ title: "Success!", description: "New property has been added." });
            navigate('/properties');
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
        onSettled: () => setIsUploading(false)
    });

    const handleSaveProperty = async () => {
        if (imageFiles.length === 0) {
            toast({ title: "Image Required", description: "Please upload at least one image.", variant: "destructive" });
            return;
        }
        
        setIsUploading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast({ title: "Authentication Error", description: "You must be logged in to add a property.", variant: "destructive" });
            setIsUploading(false);
            return;
        }

        const uploadPromises = imageFiles.map(file => {
            const filePath = `${user.id}/${Date.now()}_${file.name}`;
            return supabase.storage.from('property-images').upload(filePath, file, {
                onProgress: (event) => {
                    setUploadProgress(prev => ({
                        ...prev,
                        [file.name]: (event.loaded / event.total) * 100
                    }));
                }
            });
        });

        try {
            const uploadResults = await Promise.all(uploadPromises);
            const imageUrls: string[] = [];

            for (const result of uploadResults) {
                if (result.error) throw result.error;
                const { data } = supabase.storage.from('property-images').getPublicUrl(result.data.path);
                imageUrls.push(data.publicUrl);
            }

            addPropertyMutation.mutate(imageUrls);
        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
            setIsUploading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <Button variant="outline" onClick={() => navigate('/properties')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Properties
            </Button>
            <div className="metric-card max-w-4xl mx-auto p-8">
                <h1 className="text-3xl font-bold text-foreground mb-6">Add New Property</h1>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input id="title" placeholder="Property Title (e.g., Modern Villa Whitefield)" value={propertyData.title} onChange={handleInputChange} />
                        <Input id="location" placeholder="Location (e.g., Whitefield, Bangalore)" value={propertyData.location} onChange={handleInputChange} />
                        <Input id="price" placeholder="Price (e.g., ₹2.8 Cr)" value={propertyData.price} onChange={handleInputChange} />
                        <Input id="bhk" placeholder="BHK (e.g., 4 BHK)" value={propertyData.bhk} onChange={handleInputChange} />
                        <Input id="area" placeholder="Area (e.g., 3,200 sq ft)" value={propertyData.area} onChange={handleInputChange} />
                        <Select value={propertyData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="For Sale">For Sale</SelectItem>
                                <SelectItem value="For Rent">For Rent</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(value) => handleSelectChange('agent_id', value)}>
                            <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Assign an Agent" /></SelectTrigger>
                            <SelectContent>
                                {agents.map(agent => (
                                    <SelectItem key={agent.id} value={agent.id}>
                                        {agent.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                            {allAmenities.map(amenity => {
                                const isSelected = selectedAmenities.includes(amenity);
                                return (
                                    <Button
                                        key={amenity}
                                        variant={isSelected ? "primary" : "outline"}
                                        onClick={() => toggleAmenity(amenity)}
                                        className="rounded-full"
                                    >
                                        {isSelected && <Check className="w-4 h-4 mr-2" />}
                                        {amenity}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* ... (Image Upload and Description sections remain the same) ... */}
                     <div className="border-t border-border pt-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Property Images</h3>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                            <label htmlFor="image-upload" className="mt-4 inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md cursor-pointer">
                                Select Images
                            </label>
                            <input id="image-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} disabled={isUploading} />
                            <p className="mt-2 text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB. Max 4 images.</p>
                        </div>
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {imagePreviews.map((src, index) => (
                                <div key={index} className="relative">
                                    <img src={src} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-md" />
                                    <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeImage(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <Button onClick={handleSaveProperty} disabled={isUploading} size="lg">
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Property
                    </Button>
                </div>
            </div>
        </div>
    );
}

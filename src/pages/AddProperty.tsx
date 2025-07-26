import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UploadCloud, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function AddPropertyPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    
    const [propertyData, setPropertyData] = useState({
        title: '',
        category: '',
        price: '',
        amenities: '',
        location: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setPropertyData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: string, value: string) => {
        setPropertyData(prev => ({ ...prev, [id]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (imageFiles.length + files.length > 4) {
                toast({ title: "Upload Limit", description: "You can only upload a maximum of 4 images.", variant: "destructive" });
                return;
            }
            setImageFiles(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };
    
    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const addPropertyMutation = useMutation({
        mutationFn: async () => {
            setUploading(true);
            if (imageFiles.length === 0) {
                throw new Error("At least one image is required.");
            }

            // Get the current logged-in user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in to add a property.");

            const imageUrls: string[] = [];
            for (const file of imageFiles) {
                const fileExt = file.name.split('.').pop();
                // **IMPORTANT FIX**: The file path now includes the user's ID
                // This creates a folder for each user, matching the RLS policy.
                const filePath = `${user.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('property-images')
                    .getPublicUrl(filePath);
                imageUrls.push(publicUrl);
            }

            const amenitiesArray = propertyData.amenities.split(',').map(item => item.trim()).filter(Boolean);

            const finalData = {
                ...propertyData,
                amenities: amenitiesArray,
                image_urls: imageUrls,
            };
            
            const { error } = await supabase.from('properties').insert([finalData]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            toast({ title: "Success!", description: "New property has been added." });
            navigate('/properties');
        },
        onError: (error: any) => {
            console.error("Mutation Error:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
        onSettled: () => {
            setUploading(false);
        }
    });

    return (
        <div className="p-4 md:p-6 space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Add New Property</h1>
            <div className="metric-card max-w-4xl mx-auto">
                <div className="space-y-6">
                    {/* Basic Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Property Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input id="title" placeholder="Property Name / Title" onChange={handleInputChange} />
                            <Select onValueChange={(value) => handleSelectChange('category', value)}>
                                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Apartment">Apartment</SelectItem>
                                    <SelectItem value="Villa">Villa</SelectItem>
                                    <SelectItem value="House">House</SelectItem>
                                    <SelectItem value="Commercial">Commercial</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input id="price" placeholder="Price (e.g., ₹2.8 Cr)" onChange={handleInputChange} />
                            <Input id="location" placeholder="Location (e.g., Bandra West, Mumbai)" onChange={handleInputChange} />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="border-t border-border pt-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Property Images</h3>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                            <label htmlFor="image-upload" className="mt-4 inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md cursor-pointer">
                                Select Images
                            </label>
                            <input id="image-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploading} />
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

                    {/* Amenities */}
                    <div className="border-t border-border pt-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Amenities</h3>
                        <Textarea id="amenities" placeholder="Enter amenities, separated by commas (e.g., Swimming Pool, Gym, Parking)" onChange={handleInputChange} />
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <Button onClick={() => addPropertyMutation.mutate()} disabled={uploading}>
                        {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {uploading ? 'Saving...' : 'Save Property'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

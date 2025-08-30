import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, UserPlus, UploadCloud, User, ChevronsUpDown, Image } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

// --- Data Fetching Functions ---
type Location = { city: string; state: string };
const fetchIndianLocations = async (): Promise<Location[]> => {
    const response = await fetch('https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json');
    if (!response.ok) throw new Error('Failed to fetch locations');
    const data = await response.json();
    const locations: Location[] = [];
    Object.keys(data.states).forEach(state => {
        data.states[state].districts.forEach((city: string) => {
            locations.push({ city, state });
        });
    });
    return locations;
};

const fetchExistingAvatars = async () => {
    const { data, error } = await supabase.storage.from('avatars').list();
    if (error) throw new Error(error.message);
    return data.map(file => ({
        name: file.name,
        url: supabase.storage.from('avatars').getPublicUrl(file.name).data.publicUrl,
    }));
};

export default function CreateAgentPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // Can be a blob URL or a Supabase URL
    const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);

    const [agentData, setAgentData] = useState({
        name: '', email: '', phone: '', location: '', bio: ''
    });

    const { data: locations = [] } = useQuery({ queryKey: ['indianLocations'], queryFn: fetchIndianLocations });
    const { data: existingAvatars = [] } = useQuery({ queryKey: ['existingAvatars'], queryFn: fetchExistingAvatars });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setAgentData(prev => ({ ...prev, [id]: value }));
    };
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file); // Set the file to be uploaded
            setAvatarPreview(URL.createObjectURL(file)); // Set the preview
        }
    };

    const handleSelectExistingAvatar = (url: string) => {
        setAvatarFile(null); // Clear any file that was staged for upload
        setAvatarPreview(url); // Set the preview to the existing URL
    };

    const addAgentMutation = useMutation({
        mutationFn: async () => {
            setIsUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            let avatar_url = avatarPreview; // Start with the preview URL

            // Only upload if a *new* file has been selected
            if (avatarFile) {
                setUploadProgress(0);
                const filePath = `${user.id}/${Date.now()}_${avatarFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { onProgress: (event) => setUploadProgress((event.loaded / event.total) * 100) });
                
                if (uploadError) throw uploadError;
                avatar_url = supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl;
            }

            const agent_id = `EH-${Date.now().toString().slice(-4)}`;
            const finalAgentData = { ...agentData, user_id: user.id, avatar_url, agent_id };
            const { error } = await supabase.from('agents').insert([finalAgentData]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            toast({ title: "Success!", description: "New agent has been added." });
            navigate('/agents');
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
        onSettled: () => setIsUploading(false)
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/20 dark:to-blue-950/20 p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/agents')}
                        className="group hover:shadow-md transition-all duration-300"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Agents
                    </Button>
                </div>

                {/* Main Card */}
                <div className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-xl border-0">
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
                    
                    {/* Content */}
                    <div className="relative p-8 md:p-10">
                        {/* Title Section */}
                        <div className="mb-10 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                                <UserPlus className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                                Add New Agent
                            </h1>
                            <p className="mt-2 text-muted-foreground text-lg">
                                Create a profile for a new agent on your team
                            </p>
                        </div>
                        {/* Form Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            {/* Avatar Section */}
                            <div className="md:col-span-1">
                                <div className="sticky top-6 space-y-6">
                                    {/* Avatar Preview */}
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
                                        <Avatar className="relative w-48 h-48 mx-auto border-4 border-white dark:border-gray-800 shadow-2xl">
                                            <AvatarImage src={avatarPreview} className="object-cover" />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                                                <User className="w-24 h-24 text-muted-foreground" />
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    
                                    {/* Upload Controls */}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleAvatarChange} 
                                        accept="image/*" 
                                        className="hidden" 
                                    />
                                    
                                    <div className="space-y-3">
                                        <Button 
                                            variant="outline" 
                                            className="w-full group hover:shadow-md hover:border-blue-500/50 transition-all duration-300"
                                            onClick={() => fileInputRef.current?.click()} 
                                            disabled={isUploading}
                                        >
                                            <UploadCloud className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                            Upload Photo
                                        </Button>
                                        
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    variant="secondary" 
                                                    className="w-full hover:shadow-md transition-all duration-300"
                                                >
                                                    <Image className="w-4 h-4 mr-2" />
                                                    Gallery
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl font-semibold">Select from Gallery</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 py-4 max-h-[400px] overflow-y-auto pr-2">
                                                    {existingAvatars.map(avatar => (
                                                        <div 
                                                            key={avatar.name} 
                                                            className="relative group cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                                            onClick={() => handleSelectExistingAvatar(avatar.url)}
                                                        >
                                                            <img 
                                                                src={avatar.url} 
                                                                alt={avatar.name} 
                                                                className="w-full h-24 object-cover" 
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    
                                    {/* Upload Progress */}
                                    {isUploading && avatarFile && (
                                        <div className="space-y-2">
                                            <Progress value={uploadProgress} className="h-2" />
                                            <p className="text-xs text-center text-muted-foreground">
                                                Uploading... {Math.round(uploadProgress)}%
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Form Fields */}
                            <div className="md:col-span-2 space-y-6">
                                {/* Name Field */}
                                <div className="group">
                                    <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input 
                                        id="name" 
                                        placeholder="Enter agent's full name" 
                                        value={agentData.name} 
                                        onChange={handleInputChange} 
                                        required 
                                        className="h-12 text-base border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                    />
                                </div>

                                {/* Email Field */}
                                <div className="group">
                                    <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                                        Email Address
                                    </label>
                                    <Input 
                                        id="email" 
                                        placeholder="agent@company.com" 
                                        type="email" 
                                        value={agentData.email} 
                                        onChange={handleInputChange}
                                        className="h-12 text-base border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                    />
                                </div>

                                {/* Phone Field */}
                                <div className="group">
                                    <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-2">
                                        Phone Number
                                    </label>
                                    <Input 
                                        id="phone" 
                                        placeholder="+91 98765 43210" 
                                        value={agentData.phone} 
                                        onChange={handleInputChange}
                                        className="h-12 text-base border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                    />
                                </div>

                                {/* Location Field */}
                                <div className="group">
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Operating Location
                                    </label>
                                    <Popover open={isLocationPopoverOpen} onOpenChange={setIsLocationPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                role="combobox" 
                                                aria-expanded={isLocationPopoverOpen} 
                                                className="w-full h-12 justify-between text-base font-normal border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                                            >
                                                <span className={agentData.location ? "" : "text-muted-foreground"}>
                                                    {agentData.location || "Select operating location..."}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search location..." className="h-12" />
                                                <CommandList>
                                                    <CommandEmpty>No location found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {locations.map((loc, index) => (
                                                            <CommandItem 
                                                                key={`${loc.city}-${index}`} 
                                                                value={`${loc.city}, ${loc.state}`}
                                                                onSelect={(currentValue) => {
                                                                    setAgentData(prev => ({ ...prev, location: currentValue }));
                                                                    setIsLocationPopoverOpen(false);
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                {loc.city}, {loc.state}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Bio Field */}
                                <div className="group">
                                    <label htmlFor="bio" className="block text-sm font-medium text-muted-foreground mb-2">
                                        Agent Bio
                                    </label>
                                    <Textarea 
                                        id="bio" 
                                        placeholder="Brief description about the agent's experience, specialization, and achievements..." 
                                        value={agentData.bio} 
                                        onChange={handleInputChange}
                                        className="min-h-[120px] text-base border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-end border-t pt-8">
                            <Button 
                                variant="outline" 
                                size="lg"
                                onClick={() => navigate('/agents')}
                                className="sm:min-w-[150px] hover:shadow-md transition-all duration-300"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={() => addAgentMutation.mutate()} 
                                disabled={addAgentMutation.isPending || !agentData.name} 
                                size="lg"
                                className="sm:min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                {addAgentMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Creating Agent...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5 mr-2" />
                                        Save Agent Profile
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
        <div className="p-4 md:p-6 space-y-6">
             <Button variant="outline" onClick={() => navigate('/agents')}><ArrowLeft className="w-4 h-4 mr-2" />Back to Agents</Button>
            <div className="metric-card max-w-4xl mx-auto p-8">
                <div className="mb-8"><h1 className="text-3xl font-bold">Add New Agent</h1><p className="text-muted-foreground">Create a profile for a new agent on your team.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 flex flex-col items-center space-y-4">
                        <Avatar className="w-40 h-40"><AvatarImage src={avatarPreview} /><AvatarFallback><User className="w-20 h-20 text-muted-foreground" /></AvatarFallback></Avatar>
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                        <div className="flex gap-2">
                           <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}><UploadCloud className="w-4 h-4 mr-2" />Upload</Button>
                            <Dialog>
                                <DialogTrigger asChild><Button variant="secondary"><Image className="w-4 h-4 mr-2"/>Select Existing</Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Select an Existing Avatar</DialogTitle></DialogHeader>
                                    <div className="grid grid-cols-4 gap-4 py-4 max-h-[400px] overflow-y-auto">
                                        {existingAvatars.map(avatar => (
                                            <div key={avatar.name} className="cursor-pointer" onClick={() => handleSelectExistingAvatar(avatar.url)}>
                                                <img src={avatar.url} alt={avatar.name} className="rounded-md object-cover w-full h-24" />
                                            </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                        {isUploading && avatarFile && <Progress value={uploadProgress} className="w-full mt-2 h-2" />}
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <Input id="name" placeholder="Full Name" value={agentData.name} onChange={handleInputChange} required />
                        <Input id="email" placeholder="Email Address" type="email" value={agentData.email} onChange={handleInputChange} />
                        <Input id="phone" placeholder="Phone Number" value={agentData.phone} onChange={handleInputChange} />
                        <Popover open={isLocationPopoverOpen} onOpenChange={setIsLocationPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={isLocationPopoverOpen} className="w-full justify-between">
                                    {agentData.location || "Select operating location..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command><CommandInput placeholder="Search location..." /><CommandList><CommandEmpty>No location found.</CommandEmpty><CommandGroup>
                                    {locations.map((loc, index) => (
                                        <CommandItem key={`${loc.city}-${index}`} value={`${loc.city}, ${loc.state}`}
                                            onSelect={(currentValue) => {
                                                setAgentData(prev => ({ ...prev, location: currentValue }));
                                                setIsLocationPopoverOpen(false);
                                            }}
                                        >{loc.city}, {loc.state}</CommandItem>
                                    ))}
                                </CommandGroup></CommandList></Command>
                            </PopoverContent>
                        </Popover>
                        <Textarea id="bio" placeholder="Agent Bio" value={agentData.bio} onChange={handleInputChange} />
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <Button onClick={() => addAgentMutation.mutate()} disabled={addAgentMutation.isPending} size="lg">
                        {addAgentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <UserPlus className="w-4 h-4 mr-2" />
                        Save Agent Profile
                    </Button>
                </div>
            </div>
        </div>
    );
}

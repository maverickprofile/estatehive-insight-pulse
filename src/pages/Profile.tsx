import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload } from 'lucide-react';

// Function to fetch the current user's profile
const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('User not logged in');

    const { data, error } = await supabase
        .from('profiles')
        .select(`full_name, role, avatar_url`)
        .eq('id', session.user.id)
        .single();

    if (error) throw error;
    return data;
};

export default function ProfilePage() {
    const queryClient = useQueryClient();
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: fetchProfile,
    });

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setAvatarUrl(profile.avatar_url);
        }
    }, [profile]);

    const updateProfileMutation = useMutation({
        mutationFn: async ({ fullName, avatarUrl }: { fullName: string; avatarUrl: string | null }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const updates = {
                id: user.id,
                full_name: fullName,
                avatar_url: avatarUrl,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            alert('Profile updated successfully!');
        },
        onError: (error) => {
            console.error('Error updating profile:', error);
            alert(`Error: ${error.message}`);
        },
    });

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL of the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            
            setAvatarUrl(publicUrl);
            updateProfileMutation.mutate({ fullName, avatarUrl: publicUrl });

        } catch (error: any) {
            alert(`Error uploading avatar: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profile & Settings</h1>
            
            <div className="metric-card max-w-2xl mx-auto">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Profile Picture</h3>
                        <div className="flex items-center gap-6 mt-4">
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={avatarUrl || undefined} alt="User avatar" />
                                <AvatarFallback className="text-3xl">
                                    {fullName ? fullName.split(' ').map(n => n[0]).join('') : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                {/* Placeholder for Image Cropping UI */}
                                <p className="text-sm text-muted-foreground mb-2">Upload a new photo. We recommend a 1:1 aspect ratio.</p>
                                <Button asChild variant="outline">
                                    <label htmlFor="avatar-upload" className="cursor-pointer">
                                        <Upload className="w-4 h-4 mr-2" />
                                        {uploading ? 'Uploading...' : 'Upload Image'}
                                    </label>
                                </Button>
                                <input id="avatar-upload" type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden"/>
                                <p className="text-xs text-muted-foreground mt-2">This is where an image cropping tool would appear before uploading.</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border pt-6">
                        <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                        <div className="space-y-4 mt-4">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                                <Input id="email" value={profile?.email || ''} disabled />
                            </div>
                             <div>
                                <label htmlFor="role" className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
                                <Input id="role" value={profile?.role || ''} disabled className="capitalize" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <Button onClick={() => updateProfileMutation.mutate({ fullName, avatarUrl })} disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}

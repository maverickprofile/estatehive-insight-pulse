import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentsService } from '@/services/agents.service';
import { StorageService, storageUtils } from '@/services/storage.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';

const SPECIALIZATIONS = [
    'Residential',
    'Commercial',
    'Industrial',
    'Agricultural',
    'Luxury',
    'Rental',
    'Investment',
    'New Construction'
];

export default function AddAgent() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    const [agentData, setAgentData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        specialization: [] as string[],
        experience_years: '',
        bio: '',
        commission_rate: '',
        rating: '',
        is_active: true,
        avatar_url: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAgentData(prev => ({ ...prev, [name]: value }));
    };

    const handleSpecializationToggle = (spec: string) => {
        setAgentData(prev => ({
            ...prev,
            specialization: prev.specialization.includes(spec)
                ? prev.specialization.filter(s => s !== spec)
                : [...prev.specialization, spec]
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!StorageService.validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])) {
            toast({
                title: "Invalid file type",
                description: "Please upload a JPEG, PNG, or WebP image",
                variant: "destructive",
            });
            return;
        }

        // Validate file size (max 2MB for avatars)
        if (!StorageService.validateFileSize(file, 2)) {
            toast({
                title: "File too large",
                description: "Please upload an image smaller than 2MB",
                variant: "destructive",
            });
            return;
        }

        setUploadingImage(true);
        try {
            // Compress image before upload
            const compressedFile = await storageUtils.compressImage(file, 800, 0.8);
            
            // Upload to Supabase storage
            const avatarUrl = await StorageService.uploadAgentAvatar(compressedFile);
            
            setAgentData(prev => ({ ...prev, avatar_url: avatarUrl }));
            
            toast({
                title: "Success",
                description: "Avatar uploaded successfully",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to upload image",
                variant: "destructive",
            });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = {
                name: agentData.name,
                email: agentData.email,
                phone: agentData.phone,
                location: agentData.location || null,
                specialization: agentData.specialization.length > 0 ? agentData.specialization : null,
                experience_years: agentData.experience_years ? parseInt(agentData.experience_years) : null,
                bio: agentData.bio || null,
                commission_rate: agentData.commission_rate ? parseFloat(agentData.commission_rate) : null,
                rating: agentData.rating ? parseFloat(agentData.rating) : null,
                is_active: agentData.is_active,
                avatar_url: agentData.avatar_url || null
            };

            await agentsService.createAgent(submitData);
            
            toast({
                title: "Success",
                description: "Agent added successfully",
            });
            
            navigate('/agents');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add agent",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/agents')}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Add New Agent</h1>
                    <p className="text-sm text-muted-foreground">Add a new agent to your team</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="metric-card space-y-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            {agentData.avatar_url ? (
                                <div className="relative w-24 h-24">
                                    <img
                                        src={agentData.avatar_url}
                                        alt="Avatar"
                                        className="w-24 h-24 rounded-full object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6"
                                        onClick={() => setAgentData(prev => ({ ...prev, avatar_url: '' }))}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="avatar">Profile Picture</Label>
                            <Input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                value={agentData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={agentData.email}
                                onChange={handleInputChange}
                                required
                                placeholder="john@example.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone">Phone *</Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={agentData.phone}
                                onChange={handleInputChange}
                                required
                                placeholder="+91 9876543210"
                            />
                        </div>
                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                name="location"
                                value={agentData.location}
                                onChange={handleInputChange}
                                placeholder="Mumbai"
                            />
                        </div>
                        <div>
                            <Label htmlFor="experience_years">Experience (Years)</Label>
                            <Input
                                id="experience_years"
                                name="experience_years"
                                type="number"
                                min="0"
                                value={agentData.experience_years}
                                onChange={handleInputChange}
                                placeholder="5"
                            />
                        </div>
                        <div>
                            <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                            <Input
                                id="commission_rate"
                                name="commission_rate"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={agentData.commission_rate}
                                onChange={handleInputChange}
                                placeholder="2.5"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Specializations</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                            {SPECIALIZATIONS.map(spec => (
                                <label
                                    key={spec}
                                    className={`flex items-center justify-center px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                                        agentData.specialization.includes(spec)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background border-input hover:bg-accent'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={agentData.specialization.includes(spec)}
                                        onChange={() => handleSpecializationToggle(spec)}
                                    />
                                    <span className="text-sm">{spec}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            value={agentData.bio}
                            onChange={handleInputChange}
                            placeholder="Brief description about the agent..."
                            rows={4}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={agentData.is_active}
                                onCheckedChange={(checked) => 
                                    setAgentData(prev => ({ ...prev, is_active: checked }))
                                }
                            />
                            <Label htmlFor="is_active">Active Agent</Label>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/agents')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Adding...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Add Agent
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
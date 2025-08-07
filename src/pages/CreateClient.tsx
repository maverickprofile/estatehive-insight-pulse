import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, UserPlus } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function CreateClientPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [clientData, setClientData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        status: 'prospect',
        budget: '',
        source: '',
        rating: 3.0, // Default rating
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setClientData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: string, value: string) => {
        setClientData(prev => ({ ...prev, [id]: value }));
    };

    const addClientMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const { error } = await supabase.from('clients').insert([{
                ...clientData,
                user_id: user.id,
                agent: user.user_metadata.full_name || 'Unassigned',
            }]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast({ title: "Success!", description: "New client has been created successfully." });
            navigate('/clients');
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    return (
        <div className="p-4 md:p-6 space-y-6">
             <Button variant="outline" onClick={() => navigate('/clients')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clients
            </Button>
            <div className="metric-card max-w-4xl mx-auto p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Add New Client</h1>
                    <p className="text-muted-foreground">Enter the client's details to add them to your database.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <Input id="name" placeholder="Full Name" value={clientData.name} onChange={handleInputChange} required />
                        <Input id="email" placeholder="Email Address" type="email" value={clientData.email} onChange={handleInputChange} />
                        <Input id="phone" placeholder="Phone Number" value={clientData.phone} onChange={handleInputChange} />
                        <Input id="location" placeholder="Location (e.g., Mumbai)" value={clientData.location} onChange={handleInputChange} />
                    </div>
                    {/* Column 2 */}
                    <div className="space-y-4">
                        <Input id="budget" placeholder="Budget (e.g., ₹80L - ₹1.2Cr)" value={clientData.budget} onChange={handleInputChange} />
                        <Select onValueChange={(value) => handleSelectChange('source', value)}>
                            <SelectTrigger><SelectValue placeholder="Lead Source" /></SelectTrigger>
                            <SelectContent className='bg-white'>
                                <SelectItem value="Website">Website</SelectItem>
                                <SelectItem value="Referral">Referral</SelectItem>
                                <SelectItem value="Facebook">Facebook</SelectItem>
                                <SelectItem value="Google Ads">Google Ads</SelectItem>
                                <SelectItem value="Walk-in">Walk-in</SelectItem>
                            </SelectContent>
                        </Select>
                         <Select onValueChange={(value) => handleSelectChange('status', value)} defaultValue="prospect">
                            <SelectTrigger><SelectValue placeholder="Client Status" /></SelectTrigger>
                            <SelectContent className='bg-white'>
                                <SelectItem value="prospect">Prospect</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="negotiating">Negotiating</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <Button onClick={() => addClientMutation.mutate()} disabled={addClientMutation.isPending} size="lg">
                        {addClientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <UserPlus className="w-4 h-4 mr-2" />
                        Save Client
                    </Button>
                </div>
            </div>
        </div>
    );
}

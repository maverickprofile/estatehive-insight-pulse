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

export default function CreateLeadPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [leadData, setLeadData] = useState({
        name: '',
        email: '',
        phone: '',
        source: '',
        interest: '',
        location: '',
        budget: '',
        stage: 'new',
        priority: 'medium',
        agent: '',
        notes: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setLeadData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: string, value: string) => {
        setLeadData(prev => ({ ...prev, [id]: value }));
    };

    const addLeadMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const { error } = await supabase.from('leads').insert([{
                ...leadData,
                // Ensure agent is assigned if not filled, or handle it based on your logic
                agent: leadData.agent || 'Unassigned', 
            }]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            toast({ title: "Success!", description: "New lead has been created successfully." });
            navigate('/leads');
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    return (
        <div className="p-4 md:p-6 space-y-6">
             <Button variant="outline" onClick={() => navigate('/leads')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
            </Button>
            <div className="metric-card max-w-4xl mx-auto p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Create New Lead</h1>
                    <p className="text-muted-foreground">Fill out the form below to add a new lead to your pipeline.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <Input id="name" placeholder="Full Name" value={leadData.name} onChange={handleInputChange} required />
                        <Input id="email" placeholder="Email Address" type="email" value={leadData.email} onChange={handleInputChange} />
                        <Input id="phone" placeholder="Phone Number" value={leadData.phone} onChange={handleInputChange} />
                         <Select onValueChange={(value) => handleSelectChange('source', value)}>
                            <SelectTrigger><SelectValue placeholder="Lead Source" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Website">Website</SelectItem>
                                <SelectItem value="Referral">Referral</SelectItem>
                                <SelectItem value="Facebook">Facebook</SelectItem>
                                <SelectItem value="Google Ads">Google Ads</SelectItem>
                                <SelectItem value="Walk-in">Walk-in</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Column 2 */}
                    <div className="space-y-4">
                        <Input id="interest" placeholder="Property Interest (e.g., 3BHK Apartment)" value={leadData.interest} onChange={handleInputChange} />
                        <Input id="location" placeholder="Preferred Location" value={leadData.location} onChange={handleInputChange} />
                        <Input id="budget" placeholder="Budget (e.g., ₹80L - ₹1.2Cr)" value={leadData.budget} onChange={handleInputChange} />
                        <Select onValueChange={(value) => handleSelectChange('priority', value)} defaultValue="medium">
                            <SelectTrigger><SelectValue placeholder="Priority Level" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <Button onClick={() => addLeadMutation.mutate()} disabled={addLeadMutation.isPending} size="lg">
                        {addLeadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <UserPlus className="w-4 h-4 mr-2" />
                        Save Lead
                    </Button>
                </div>
            </div>
        </div>
    );
}

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
        interest_type: 'buy',
        interested_in: '',
        location: '',
        budget: '',
        stage: 'new',
        priority: 'medium',
        assigned_to: '',
        notes: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setLeadData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: string, value: string) => {
        setLeadData(prev => ({ ...prev, [id]: value }));
    };

    const parseBudget = (budgetString: string) => {
        // Parse budget string like "80L - 1.2Cr" or "50L" or "1Cr"
        const cleanBudget = budgetString.replace(/[₹,\s]/g, '');
        const parts = cleanBudget.split('-');
        
        const parseValue = (val: string) => {
            const num = parseFloat(val);
            if (val.toLowerCase().includes('cr')) {
                return num * 10000000; // Convert crores to actual number
            } else if (val.toLowerCase().includes('l')) {
                return num * 100000; // Convert lakhs to actual number
            }
            return num;
        };

        if (parts.length === 2) {
            return {
                budget_min: parseValue(parts[0]),
                budget_max: parseValue(parts[1])
            };
        } else if (parts.length === 1 && cleanBudget) {
            const value = parseValue(parts[0]);
            return {
                budget_min: value * 0.8, // 80% of value as min
                budget_max: value * 1.2  // 120% of value as max
            };
        }
        return { budget_min: null, budget_max: null };
    };

    const addLeadMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const budgetValues = parseBudget(leadData.budget);
            
            const leadToInsert = {
                name: leadData.name,
                email: leadData.email || null,
                phone: leadData.phone || null,
                source: leadData.source || 'website',
                interest_type: leadData.interest_type as 'buy' | 'sell' | 'rent' | 'lease' | 'invest',
                interested_in: leadData.interested_in || leadData.location || null,
                location: leadData.location || null,
                budget_min: budgetValues.budget_min,
                budget_max: budgetValues.budget_max,
                stage: leadData.stage as any,
                priority: leadData.priority as any,
                assigned_to: leadData.assigned_to || null,
                notes: leadData.notes || null,
                location_preference: leadData.location ? [leadData.location] : []
            };

            const { error } = await supabase.from('leads').insert([leadToInsert]);

            if (error) {
                console.error('Lead creation error:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            toast({ title: "Success!", description: "New lead has been created successfully." });
            navigate('/leads');
        },
        onError: (error: any) => {
            console.error('Lead creation failed:', error);
            toast({ 
                title: "Error", 
                description: error.message || "Failed to create lead. Please check all fields.", 
                variant: "destructive" 
            });
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
                        <Input id="name" placeholder="Full Name *" value={leadData.name} onChange={handleInputChange} required />
                        <Input id="email" placeholder="Email Address" type="email" value={leadData.email} onChange={handleInputChange} />
                        <Input id="phone" placeholder="Phone Number" value={leadData.phone} onChange={handleInputChange} />
                         <Select onValueChange={(value) => handleSelectChange('source', value)}>
                            <SelectTrigger><SelectValue placeholder="Lead Source" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="website">Website</SelectItem>
                                <SelectItem value="referral">Referral</SelectItem>
                                <SelectItem value="social_media">Social Media</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Phone</SelectItem>
                                <SelectItem value="walk_in">Walk-in</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(value) => handleSelectChange('interest_type', value)} defaultValue="buy">
                            <SelectTrigger><SelectValue placeholder="Interest Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="buy">Buy</SelectItem>
                                <SelectItem value="sell">Sell</SelectItem>
                                <SelectItem value="rent">Rent</SelectItem>
                                <SelectItem value="lease">Lease</SelectItem>
                                <SelectItem value="invest">Invest</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Column 2 */}
                    <div className="space-y-4">
                        <Input id="interested_in" placeholder="Property Interest (e.g., 3BHK Apartment)" value={leadData.interested_in} onChange={handleInputChange} />
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
                        <Textarea 
                            id="notes" 
                            placeholder="Additional notes..." 
                            value={leadData.notes} 
                            onChange={handleInputChange}
                            className="min-h-[100px]"
                        />
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

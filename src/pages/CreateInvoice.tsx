import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge'; // <-- FIX: Added missing import
import { Loader2, Plus, Trash2, ArrowLeft, Users, IndianRupee } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';

// Function to fetch leads to populate the dropdown
const fetchLeads = async () => {
    const { data, error } = await supabase.from('leads').select('id, name, email');
    if (error) throw new Error(error.message);
    return data;
};

export default function CreateInvoicePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [issueDate, setIssueDate] = useState(new Date());
    const [dueDate, setDueDate] = useState(new Date());
    const [lineItems, setLineItems] = useState([{ description: '', amount: 0 }]);
    const [notes, setNotes] = useState('All payments are due within 30 days. Thank you for your business.');

    // Fetch leads for the dropdown
    const { data: leads = [] } = useQuery({
        queryKey: ['leadsForInvoice'],
        queryFn: fetchLeads
    });

    // Handle selecting a lead from the dropdown
    const handleLeadSelect = (leadId: string) => {
        const selectedLead = leads.find(lead => lead.id.toString() === leadId);
        if (selectedLead) {
            setClientName(selectedLead.name);
            setClientEmail(selectedLead.email || '');
        }
    };

    // Automatic Tax Calculation
    const subtotal = lineItems.reduce((acc, item) => acc + Number(item.amount || 0), 0);
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const totalAmount = subtotal + cgst + sgst;

    const addInvoiceMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

            const { error } = await supabase.from('invoices').insert([{
                user_id: user.id,
                invoice_number: invoiceNumber,
                client_name: clientName,
                client_email: clientEmail,
                client_address: clientAddress,
                issue_date: issueDate.toISOString(),
                due_date: dueDate.toISOString(),
                line_items: lineItems,
                total_amount: totalAmount,
                status: 'draft',
                notes: notes,
            }]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast({ title: "Success!", description: "Invoice created and saved as a draft." });
            navigate('/invoices');
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const handleItemChange = (index: number, field: 'description' | 'amount', value: string | number) => {
        const updatedItems = [...lineItems];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setLineItems(updatedItems);
    };

    const addItem = () => {
        setLineItems([...lineItems, { description: '', amount: 0 }]);
    };

    const removeItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
             <Button variant="outline" onClick={() => navigate('/invoices')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Invoices
            </Button>
            <div className="metric-card max-w-5xl mx-auto p-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">New Invoice</h1>
                        <p className="text-muted-foreground">Fill out the details below to create an invoice.</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">Status</p>
                        <Badge variant="secondary">Draft</Badge>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Client Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Bill To</h3>
                        <Select onValueChange={handleLeadSelect}>
                            <SelectTrigger >
                                <SelectValue placeholder="Select a lead or enter details manually" />
                            </SelectTrigger>
                            <SelectContent className='bg-white'>
                                {leads.map(lead => (
                                    <SelectItem key={lead.id} value={lead.id.toString()}>
                                        {lead.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                        <Input placeholder="Client Email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                        <Textarea placeholder="Client Address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
                    </div>
                    {/* Right Column: Invoice Details */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Invoice Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Issue Date</label>
                                <Input type="date" value={format(issueDate, 'yyyy-MM-dd')} onChange={(e) => setIssueDate(new Date(e.target.value))} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Due Date</label>
                                <Input type="date" value={format(dueDate, 'yyyy-MM-dd')} onChange={(e) => setDueDate(new Date(e.target.value))} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="mt-8">
                    <h3 className="font-semibold text-lg border-b pb-2 mb-4">Items</h3>
                    <div className="space-y-2">
                        {lineItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input placeholder="Item Description (e.g., Commission on Property Sale)" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                                <Input type="number" placeholder="Amount" value={item.amount} onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value))} className="w-48" />
                                <Button variant="destructive" size="icon" onClick={() => removeItem(index)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" onClick={addItem} className="mt-2"><Plus className="w-4 h-4 mr-2" />Add Item</Button>
                </div>

                {/* Total Calculation */}
                <div className="flex justify-end mt-8">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">CGST (9%)</span>
                            <span>₹{cgst.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">SGST (9%)</span>
                            <span>₹{sgst.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-primary border-t pt-2 mt-2">
                            <span>Total Amount</span>
                            <span>₹{totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="mt-8">
                    <h3 className="font-semibold text-lg border-b pb-2 mb-4">Notes</h3>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                <div className="mt-8 flex justify-end">
                    <Button onClick={() => addInvoiceMutation.mutate()} disabled={addInvoiceMutation.isPending} size="lg">
                        {addInvoiceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Invoice as Draft
                    </Button>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { invoicesService } from '@/services/invoices.service';
import { clientsService, propertiesService } from '@/services/database.service';
import { agentsService } from '@/services/agents.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Plus, Trash2, FileText } from 'lucide-react';

interface LineItem {
    description: string;
    amount: number;
}

export default function CreateInvoice() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [invoiceData, setInvoiceData] = useState({
        client_id: '',
        property_id: '',
        agent_id: '',
        invoice_type: 'booking',
        due_date: '',
        notes: ''
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { description: '', amount: 0 }
    ]);

    // Fetch data for dropdowns
    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientsService.getAllClients()
    });

    const { data: properties = [] } = useQuery({
        queryKey: ['properties'],
        queryFn: () => propertiesService.getAllProperties()
    });

    const { data: agents = [] } = useQuery({
        queryKey: ['agents'],
        queryFn: () => agentsService.getAllAgents()
    });

    const createInvoiceMutation = useMutation({
        mutationFn: invoicesService.createInvoice,
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Invoice created successfully",
            });
            navigate('/invoices');
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create invoice",
                variant: "destructive",
            });
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInvoiceData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setInvoiceData(prev => ({ ...prev, [name]: value }));
    };

    const addLineItem = () => {
        setLineItems(prev => [...prev, { description: '', amount: 0 }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
        setLineItems(prev => prev.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const calculateTotals = () => {
        const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        const taxAmount = subtotal * 0.18; // 18% GST
        const totalAmount = subtotal + taxAmount;
        
        return { subtotal, taxAmount, totalAmount };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { subtotal, taxAmount, totalAmount } = calculateTotals();

            const submitData = {
                client_id: invoiceData.client_id ? parseInt(invoiceData.client_id) : null,
                property_id: invoiceData.property_id ? parseInt(invoiceData.property_id) : null,
                agent_id: invoiceData.agent_id || null,
                invoice_type: invoiceData.invoice_type,
                due_date: invoiceData.due_date,
                subtotal,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                status: 'draft',
                notes: invoiceData.notes || null,
                items: lineItems.filter(item => item.description && item.amount > 0)
            };

            await createInvoiceMutation.mutateAsync(submitData);
        } catch (error) {
            // Error handled by mutation
        } finally {
            setLoading(false);
        }
    };

    const { subtotal, taxAmount, totalAmount } = calculateTotals();

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/invoices')}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Create New Invoice</h1>
                    <p className="text-sm text-muted-foreground">Generate an invoice for your client</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="metric-card space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="client_id">Client *</Label>
                            <Select
                                value={invoiceData.client_id}
                                onValueChange={(value) => handleSelectChange('client_id', value)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id.toString()}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="agent_id">Agent</Label>
                            <Select
                                value={invoiceData.agent_id}
                                onValueChange={(value) => handleSelectChange('agent_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {agents.map(agent => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="property_id">Property (Optional)</Label>
                            <Select
                                value={invoiceData.property_id}
                                onValueChange={(value) => handleSelectChange('property_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a property" />
                                </SelectTrigger>
                                <SelectContent>
                                    {properties.map(property => (
                                        <SelectItem key={property.id} value={property.id.toString()}>
                                            {property.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="invoice_type">Invoice Type</Label>
                            <Select
                                value={invoiceData.invoice_type}
                                onValueChange={(value) => handleSelectChange('invoice_type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="booking">Booking</SelectItem>
                                    <SelectItem value="commission">Commission</SelectItem>
                                    <SelectItem value="service">Service</SelectItem>
                                    <SelectItem value="consultation">Consultation</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="due_date">Due Date *</Label>
                            <Input
                                id="due_date"
                                name="due_date"
                                type="date"
                                value={invoiceData.due_date}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            value={invoiceData.notes}
                            onChange={handleInputChange}
                            placeholder="Additional notes or terms..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* Line Items */}
                <div className="metric-card space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Line Items</h3>
                        <Button type="button" variant="outline" onClick={addLineItem}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {lineItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div className="md:col-span-8">
                                    <Label htmlFor={`description-${index}`}>Description</Label>
                                    <Input
                                        id={`description-${index}`}
                                        value={item.description}
                                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                        placeholder="Service description..."
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Label htmlFor={`amount-${index}`}>Amount (₹)</Label>
                                    <Input
                                        id={`amount-${index}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.amount || ''}
                                        onChange={(e) => updateLineItem(index, 'amount', parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLineItem(index)}
                                        disabled={lineItems.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax (18% GST):</span>
                            <span>₹{taxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span>₹{totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/invoices')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading || createInvoiceMutation.isPending}>
                        {loading || createInvoiceMutation.isPending ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Create Invoice
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
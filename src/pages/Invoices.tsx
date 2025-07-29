import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusColors = {
  paid: "bg-green-100 text-green-800",
  sent: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-800",
  overdue: "bg-red-100 text-red-800",
};

const fetchInvoices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from('invoices').select('*').eq('user_id', user.id).order('issue_date', { ascending: false });
    if (error) throw error;
    return data;
};

export default function InvoicesPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const { data: invoices = [], isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: fetchInvoices
    });

    const filteredInvoices = invoices.filter(invoice =>
        invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
                    <p className="text-sm text-muted-foreground">Create and manage your client invoices.</p>
                </div>
                <Button onClick={() => navigate('/invoices/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                </Button>
            </div>

            <div className="metric-card">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Search by client or invoice number..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="metric-card overflow-x-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Due Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.map((invoice) => (
                                <TableRow key={invoice.id} className="cursor-pointer" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                    <TableCell>{invoice.client_name}</TableCell>
                                    <TableCell>₹{invoice.total_amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge className={cn("capitalize", statusColors[invoice.status as keyof typeof statusColors])} variant="secondary">
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{format(new Date(invoice.due_date), "PPP")}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}

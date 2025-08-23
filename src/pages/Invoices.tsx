import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesService } from "@/services/invoices.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Loader2, 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Send, 
  CheckCircle,
  DollarSign,
  Clock,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors = {
  paid: "bg-green-100 text-green-800",
  sent: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-800",
  overdue: "bg-red-100 text-red-800",
};


export default function InvoicesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);

    const { data: invoices = [], isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => invoicesService.getAllInvoices()
    });

    const { data: invoiceStats } = useQuery({
        queryKey: ['invoice-stats'],
        queryFn: () => invoicesService.getInvoiceStats()
    });

    const deleteInvoiceMutation = useMutation({
        mutationFn: invoicesService.deleteInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
            toast({
                title: "Success",
                description: "Invoice deleted successfully",
            });
            setDeleteInvoiceId(null);
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to delete invoice",
                variant: "destructive",
            });
        },
    });

    const markAsPaidMutation = useMutation({
        mutationFn: (id: string) => invoicesService.markAsPaid(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
            toast({
                title: "Success",
                description: "Invoice marked as paid",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to mark invoice as paid",
                variant: "destructive",
            });
        },
    });

    const sendInvoiceMutation = useMutation({
        mutationFn: invoicesService.sendInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
            toast({
                title: "Success",
                description: "Invoice sent successfully",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to send invoice",
                variant: "destructive",
            });
        },
    });

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            const matchesSearch = searchTerm === '' ||
                invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (invoice.client?.name && invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [invoices, searchTerm, statusFilter]);

    const handleDelete = (e: React.MouseEvent, invoiceId: string) => {
        e.stopPropagation();
        setDeleteInvoiceId(invoiceId);
    };

    const handleMarkAsPaid = (e: React.MouseEvent, invoiceId: string) => {
        e.stopPropagation();
        markAsPaidMutation.mutate(invoiceId);
    };

    const handleSend = (e: React.MouseEvent, invoiceId: string) => {
        e.stopPropagation();
        sendInvoiceMutation.mutate(invoiceId);
    };

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Invoices</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">Create and manage your client invoices.</p>
                </div>
                <Button onClick={() => navigate('/invoices/new')} className="w-full sm:w-auto">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Create Invoice
                </Button>
            </div>

            {/* Stats Cards */}
            {invoiceStats && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="metric-card p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-muted-foreground">Total Invoices</p>
                                <p className="text-lg sm:text-2xl font-bold truncate">{invoiceStats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="metric-card p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-muted-foreground">Total Revenue</p>
                                <p className="text-lg sm:text-2xl font-bold truncate">₹{invoiceStats.totalAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="metric-card p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                                <p className="text-lg sm:text-2xl font-bold">{invoiceStats.pending}</p>
                            </div>
                        </div>
                    </div>
                    <div className="metric-card p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-muted-foreground">Overdue</p>
                                <p className="text-lg sm:text-2xl font-bold">{invoiceStats.overdue}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="metric-card space-y-3 sm:space-y-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
                        <Input 
                            placeholder="Search by client or invoice number..." 
                            className="pl-9 sm:pl-10 text-sm" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                    <span>Showing {filteredInvoices.length} of {invoices.length} invoices</span>
                </div>
            </div>

            <div className="metric-card overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center h-32 sm:h-64">
                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs sm:text-sm">Invoice #</TableHead>
                                        <TableHead className="text-xs sm:text-sm">Client</TableHead>
                                        <TableHead className="text-xs sm:text-sm">Property</TableHead>
                                        <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                                        <TableHead className="text-xs sm:text-sm">Due Date</TableHead>
                                        <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <FileText className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-muted-foreground mb-2" />
                                                <p className="text-sm sm:text-base text-muted-foreground">No invoices found</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredInvoices.map((invoice) => (
                                            <TableRow key={invoice.id} className="cursor-pointer" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                                                <TableCell className="font-medium text-sm">{invoice.invoice_number}</TableCell>
                                                <TableCell className="text-sm truncate">{invoice.client?.name || 'N/A'}</TableCell>
                                                <TableCell className="text-sm truncate">{invoice.property?.title || 'N/A'}</TableCell>
                                                <TableCell className="text-sm">₹{invoice.total_amount?.toLocaleString() || '0'}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn("capitalize text-xs", statusColors[invoice.status as keyof typeof statusColors])} variant="secondary">
                                                        {invoice.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{invoice.due_date ? format(new Date(invoice.due_date), "MMM dd, yyyy") : 'N/A'}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/invoices/${invoice.id}`);
                                                            }}
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                        </Button>
                                                        {invoice.status === 'draft' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-blue-600"
                                                                onClick={(e) => handleSend(e, invoice.id)}
                                                                disabled={sendInvoiceMutation.isPending}
                                                            >
                                                                <Send className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                        {invoice.status === 'sent' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-green-600"
                                                                onClick={(e) => handleMarkAsPaid(e, invoice.id)}
                                                                disabled={markAsPaidMutation.isPending}
                                                            >
                                                                <CheckCircle className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/invoices/edit/${invoice.id}`);
                                                            }}
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-destructive"
                                                            onClick={(e) => handleDelete(e, invoice.id)}
                                                            disabled={deleteInvoiceMutation.isPending}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3 p-4">
                            {filteredInvoices.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">No invoices found</p>
                                </div>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <div key={invoice.id} className="border rounded-lg p-3 space-y-3 cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-medium text-sm truncate">{invoice.invoice_number}</h3>
                                                <p className="text-xs text-muted-foreground truncate">{invoice.client?.name || 'N/A'}</p>
                                            </div>
                                            <Badge className={cn("capitalize text-xs ml-2", statusColors[invoice.status as keyof typeof statusColors])} variant="secondary">
                                                {invoice.status}
                                            </Badge>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            {invoice.property && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{invoice.property.title}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <DollarSign className="w-3 h-3 flex-shrink-0" />
                                                <span>₹{invoice.total_amount?.toLocaleString() || '0'}</span>
                                            </div>
                                            {invoice.due_date && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                                    <span>Due {format(new Date(invoice.due_date), "MMM dd, yyyy")}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/invoices/${invoice.id}`);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {invoice.status === 'draft' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600"
                                                        onClick={(e) => handleSend(e, invoice.id)}
                                                        disabled={sendInvoiceMutation.isPending}
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {invoice.status === 'sent' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600"
                                                        onClick={(e) => handleMarkAsPaid(e, invoice.id)}
                                                        disabled={markAsPaidMutation.isPending}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/invoices/edit/${invoice.id}`);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={(e) => handleDelete(e, invoice.id)}
                                                    disabled={deleteInvoiceMutation.isPending}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
            
            <AlertDialog open={!!deleteInvoiceId} onOpenChange={() => setDeleteInvoiceId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this invoice? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteInvoiceId && deleteInvoiceMutation.mutate(deleteInvoiceId)}
                            className="bg-destructive text-destructive-foreground"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

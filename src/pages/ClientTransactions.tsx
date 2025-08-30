import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Download,
  FileText,
  MoreVertical,
  Search,
  Filter,
  Eye,
  Edit,
  Copy,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  Receipt,
  Home,
  Building,
  MapPin,
  User,
  Users,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  LineChart,
  Activity,
  Banknote,
  HandCoins,
  Landmark,
  ShoppingBag,
  Package,
  Truck,
  CheckSquare,
  FileSignature,
  Key,
  Shield,
  Zap,
  Info,
  ExternalLink,
  RefreshCw,
  Share2
} from "lucide-react";
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { clientsService } from "@/services/database.service";
import { Client } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart
} from 'recharts';

// Transaction type configurations
const transactionTypes = {
  booking: { 
    icon: HandCoins, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    label: 'Booking Amount'
  },
  emi: { 
    icon: RefreshCw, 
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    label: 'EMI Payment'
  },
  downpayment: { 
    icon: Banknote, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    label: 'Down Payment'
  },
  final: { 
    icon: CheckSquare, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    label: 'Final Payment'
  },
  maintenance: { 
    icon: Shield, 
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900',
    label: 'Maintenance'
  },
  refund: { 
    icon: ArrowDownRight, 
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900',
    label: 'Refund'
  }
};

// Transaction status configurations
const statusConfig = {
  completed: { 
    icon: CheckCircle, 
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    label: 'Completed'
  },
  pending: { 
    icon: Clock, 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    label: 'Pending'
  },
  failed: { 
    icon: XCircle, 
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900',
    label: 'Failed'
  },
  processing: { 
    icon: RefreshCw, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    label: 'Processing'
  }
};

// Mock transaction data
const mockTransactions = [
  {
    id: 'TXN001',
    type: 'booking',
    property: 'Sunset Villa #A301',
    amount: 500000,
    status: 'completed',
    paymentMethod: 'Bank Transfer',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    reference: 'REF2024030001',
    description: 'Initial booking amount for Sunset Villa'
  },
  {
    id: 'TXN002',
    type: 'downpayment',
    property: 'Sunset Villa #A301',
    amount: 2000000,
    status: 'completed',
    paymentMethod: 'Cheque',
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    reference: 'REF2024030002',
    description: '20% down payment'
  },
  {
    id: 'TXN003',
    type: 'emi',
    property: 'Sunset Villa #A301',
    amount: 150000,
    status: 'completed',
    paymentMethod: 'Auto Debit',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    reference: 'REF2024030003',
    description: 'EMI Payment - March 2024'
  },
  {
    id: 'TXN004',
    type: 'emi',
    property: 'Sunset Villa #A301',
    amount: 150000,
    status: 'pending',
    paymentMethod: 'Auto Debit',
    date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    reference: 'REF2024040001',
    description: 'EMI Payment - April 2024'
  },
  {
    id: 'TXN005',
    type: 'maintenance',
    property: 'Garden View Apartment',
    amount: 5000,
    status: 'completed',
    paymentMethod: 'UPI',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    reference: 'REF2024030004',
    description: 'Monthly maintenance charges'
  }
];

// Mock chart data
const monthlyTransactionData = [
  { month: 'Jan', amount: 500000, count: 2 },
  { month: 'Feb', amount: 750000, count: 3 },
  { month: 'Mar', amount: 2800000, count: 5 },
  { month: 'Apr', amount: 150000, count: 1 },
  { month: 'May', amount: 0, count: 0 },
  { month: 'Jun', amount: 0, count: 0 },
];

const paymentMethodData = [
  { name: 'Bank Transfer', value: 45, color: '#3b82f6' },
  { name: 'Cheque', value: 30, color: '#8b5cf6' },
  { name: 'UPI', value: 15, color: '#10b981' },
  { name: 'Card', value: 10, color: '#f59e0b' },
];

export default function ClientTransactionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [newTransactionDialog, setNewTransactionDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  
  // New transaction form state
  const [transactionForm, setTransactionForm] = useState({
    type: 'booking',
    property: '',
    amount: '',
    paymentMethod: '',
    reference: '',
    description: ''
  });

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getClientById(parseInt(id!));
      setClient(data);
    } catch (error) {
      console.error("Error loading client:", error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive"
      });
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    // Validate form
    if (!transactionForm.property || !transactionForm.amount) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // Create transaction logic here
    toast({
      title: "Success",
      description: "Transaction created successfully"
    });
    setNewTransactionDialog(false);
    resetTransactionForm();
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      type: 'booking',
      property: '',
      amount: '',
      paymentMethod: '',
      reference: '',
      description: ''
    });
  };

  const handleExportTransactions = () => {
    toast({
      title: "Exporting",
      description: "Preparing transaction report..."
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredTransactions = mockTransactions.filter(txn => {
    if (selectedType !== 'all' && txn.type !== selectedType) return false;
    if (selectedStatus !== 'all' && txn.status !== selectedStatus) return false;
    if (searchTerm && !txn.property.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !txn.reference.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (activeTab === 'pending' && txn.status !== 'pending') return false;
    if (activeTab === 'completed' && txn.status !== 'completed') return false;
    return true;
  });

  // Calculate statistics
  const stats = {
    totalAmount: mockTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    pendingAmount: mockTransactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0),
    totalTransactions: mockTransactions.length,
    completedTransactions: mockTransactions.filter(t => t.status === 'completed').length,
    avgTransactionValue: mockTransactions.length > 0 
      ? mockTransactions.reduce((sum, t) => sum + t.amount, 0) / mockTransactions.length
      : 0
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Client Not Found</h2>
          <p className="text-muted-foreground mb-4">The client you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/clients')}>
            Back to Clients
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/clients/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={client.avatar_url || undefined} />
              <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Transactions</h1>
              <p className="text-muted-foreground">{client.name}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportTransactions}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setNewTransactionDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span>{stats.completedTransactions} completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">₹{stats.pendingAmount.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 text-yellow-600 mr-1" />
              <span>{mockTransactions.filter(t => t.status === 'pending').length} pending</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Activity className="h-3 w-3 text-blue-600 mr-1" />
              <span>All time</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">₹{Math.round(stats.avgTransactionValue).toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <PieChart className="h-3 w-3 text-purple-600 mr-1" />
              <span>Per transaction</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Trends</CardTitle>
            <CardDescription>Monthly transaction amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyTransactionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by property or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(transactionTypes).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by creating a new transaction'}
              </p>
              <Button onClick={() => setNewTransactionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((txn) => {
                  const typeConfig = transactionTypes[txn.type as keyof typeof transactionTypes];
                  const TypeIcon = typeConfig.icon;
                  const statusInfo = statusConfig[txn.status as keyof typeof statusConfig];
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <TableRow key={txn.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center",
                            typeConfig.bgColor
                          )}>
                            <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
                          </div>
                          <span>{txn.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {txn.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{txn.property}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {txn.type === 'refund' ? '-' : '+'}₹{txn.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", statusInfo.bgColor, statusInfo.color, "border-0")}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{txn.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(txn.date, 'MMM d, yyyy')}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(txn.date, 'h:mm a')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedTransaction(txn);
                              setViewDetailsDialog(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Download Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Reference
                            </DropdownMenuItem>
                            {txn.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-green-600">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel Transaction
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Transaction Dialog */}
      <Dialog open={newTransactionDialog} onOpenChange={setNewTransactionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
            <DialogDescription>
              Record a new transaction for {client.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select 
                  value={transactionForm.type} 
                  onValueChange={(value) => setTransactionForm({...transactionForm, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(transactionTypes).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Property</Label>
                <Select 
                  value={transactionForm.property} 
                  onValueChange={(value) => setTransactionForm({...transactionForm, property: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunset-villa">Sunset Villa #A301</SelectItem>
                    <SelectItem value="garden-view">Garden View Apartment</SelectItem>
                    <SelectItem value="city-center">City Center Complex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select 
                  value={transactionForm.paymentMethod} 
                  onValueChange={(value) => setTransactionForm({...transactionForm, paymentMethod: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                placeholder="Enter transaction reference"
                value={transactionForm.reference}
                onChange={(e) => setTransactionForm({...transactionForm, reference: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Add any notes or description..."
                value={transactionForm.description}
                onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewTransactionDialog(false);
              resetTransactionForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransaction}>
              Create Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Dialog */}
      <Dialog open={viewDetailsDialog} onOpenChange={setViewDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information about this transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Transaction ID</Label>
                  <p className="font-medium">{selectedTransaction.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Reference</Label>
                  <p className="font-medium">{selectedTransaction.reference}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Badge variant="outline" className="mt-1">
                    {transactionTypes[selectedTransaction.type as keyof typeof transactionTypes].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {(() => {
                      const statusInfo = statusConfig[selectedTransaction.status as keyof typeof statusConfig];
                      const StatusIcon = statusInfo.icon;
                      return (
                        <Badge className={cn("gap-1", statusInfo.bgColor, statusInfo.color, "border-0")}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Property</Label>
                  <p className="font-medium">{selectedTransaction.property}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  <p className="font-bold text-lg">₹{selectedTransaction.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{selectedTransaction.paymentMethod}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date & Time</Label>
                  <p className="font-medium">
                    {format(selectedTransaction.date, 'PPpp')}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm">{selectedTransaction.description}</p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Details
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => {
              setViewDetailsDialog(false);
              setSelectedTransaction(null);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
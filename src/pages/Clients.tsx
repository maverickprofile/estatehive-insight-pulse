import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Star, 
  Loader2,
  MoreVertical,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Trophy,
  TrendingUp,
  Users,
  Home,
  FileText,
  MessageSquare,
  UserCheck,
  Crown
} from "lucide-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { clientsService } from "@/services/database.service";
import { Client } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const statusConfig = {
  active: { 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    label: "Active"
  },
  inactive: { 
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    label: "Inactive"
  },
  prospect: { 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    label: "Prospect"
  },
  vip: { 
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    label: "VIP"
  }
};

const loyaltyTierConfig = {
  bronze: { 
    color: "text-orange-600",
    icon: Trophy,
    minPurchases: 0
  },
  silver: { 
    color: "text-gray-600",
    icon: Trophy,
    minPurchases: 3
  },
  gold: { 
    color: "text-yellow-600",
    icon: Trophy,
    minPurchases: 5
  },
  platinum: { 
    color: "text-purple-600",
    icon: Crown,
    minPurchases: 10
  }
};

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, [selectedStatus, selectedTier]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (selectedStatus !== "all") {
        filters.status = selectedStatus;
      }
      if (selectedTier !== "all") {
        filters.loyalty_tier = selectedTier;
      }

      const data = await clientsService.getAllClients(filters);
      setClients(data || []);
    } catch (error: any) {
      console.error("Error loading clients:", error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await clientsService.deleteClient(deleteId);
      toast({
        title: "Success",
        description: "Client deleted successfully"
      });
      setDeleteId(null);
      loadClients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive"
      });
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      loadClients();
      return;
    }
    
    try {
      setLoading(true);
      const data = await clientsService.searchClients(searchTerm);
      setClients(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateClientStatus = async (clientId: number, status: string) => {
    try {
      await clientsService.updateClient(clientId, { status: status as any });
      toast({
        title: "Success",
        description: "Client status updated successfully"
      });
      loadClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client status",
        variant: "destructive"
      });
    }
  };

  const filteredClients = clients.filter(client => {
    if (searchTerm && 
        !client.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !client.email?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !client.phone?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === "active").length,
    vip: clients.filter(c => c.status === "vip").length,
    totalValue: clients.reduce((sum, c) => sum + (c.total_purchases || 0), 0),
    avgLifetimeValue: clients.length > 0 
      ? clients.reduce((sum, c) => sum + (c.lifetime_value || 0), 0) / clients.length
      : 0
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Clients</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your client relationships and interactions</p>
        </div>
        <Button onClick={() => navigate('/clients/new')} className="w-full sm:w-auto">
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Clients</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="relative p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              All registered clients
            </p>
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-0">
                <TrendingUp className="w-3 h-3 mr-1" />
                100%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Clients</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="relative p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently engaged
            </p>
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-0">
                {stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(0)}%` : '0%'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">VIP Clients</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="relative p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
              {stats.vip}
            </div>
            <p className="text-xs text-muted-foreground">
              Premium customers
            </p>
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-0">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Elite
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="relative p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold truncate bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
              ₹{stats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From all clients
            </p>
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-0">
                <TrendingUp className="w-3 h-3 mr-1" />
                Revenue
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg. Lifetime Value</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent className="relative p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold truncate bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-400 dark:to-indigo-600 bg-clip-text text-transparent">
              ₹{Math.round(stats.avgLifetimeValue).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Per client
            </p>
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-0">
                <Trophy className="w-3 h-3 mr-1" />
                Value
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:pt-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Search clients by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9 sm:pl-10 text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Loyalty Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleSearch} className="w-full sm:w-auto">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Clients Table */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <Users className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No clients found</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Try adjusting your filters or add a new client
              </p>
              <Button onClick={() => navigate('/clients/new')} className="w-full sm:w-auto">
                <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Add Client
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Client</TableHead>
                      <TableHead className="text-xs sm:text-sm">Contact</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm">Loyalty</TableHead>
                      <TableHead className="text-xs sm:text-sm">Properties</TableHead>
                      <TableHead className="text-xs sm:text-sm">Lifetime Value</TableHead>
                      <TableHead className="text-xs sm:text-sm">Last Activity</TableHead>
                      <TableHead className="text-xs sm:text-sm text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const tierConfig = loyaltyTierConfig[client.loyalty_tier || 'bronze'];
                  const TierIcon = tierConfig.icon;
                  
                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={client.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm sm:text-base truncate">{client.name}</div>
                            {client.company && (
                              <div className="text-xs sm:text-sm text-muted-foreground truncate">{client.company}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <Mail className="h-2 w-2 sm:h-3 sm:w-3 text-muted-foreground" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <Phone className="h-2 w-2 sm:h-3 sm:w-3 text-muted-foreground" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("capitalize", statusConfig[client.status || 'active'].color)}>
                          {statusConfig[client.status || 'active'].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TierIcon className={cn("h-3 w-3 sm:h-4 sm:w-4", tierConfig.color)} />
                          <span className="capitalize text-xs sm:text-sm">{client.loyalty_tier || 'bronze'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="font-semibold text-sm">{client.total_purchases || 0}</div>
                            <div className="text-xs text-muted-foreground">Bought</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-sm">{client.total_properties_viewed || 0}</div>
                            <div className="text-xs text-muted-foreground">Viewed</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm truncate">₹{(client.lifetime_value || 0).toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        {client.last_interaction ? (
                          <div className="text-sm">
                            {format(new Date(client.last_interaction), "dd MMM yyyy")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)}>
                              <Eye className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}/edit`)}>
                              <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/messages?client=${client.id}`)}>
                              <MessageSquare className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/appointments/create?client=${client.id}`)}>
                              <Calendar className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Schedule Meeting
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {client.status !== 'vip' && (
                              <DropdownMenuItem onClick={() => updateClientStatus(client.id, 'vip')}>
                                <Crown className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                Mark as VIP
                              </DropdownMenuItem>
                            )}
                            {client.status === 'active' && (
                              <DropdownMenuItem onClick={() => updateClientStatus(client.id, 'inactive')}>
                                <UserCheck className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                Mark Inactive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(client.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
            
          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3 p-4">
              {filteredClients.map((client) => {
                const tierConfig = loyaltyTierConfig[client.loyalty_tier || 'bronze'];
                const TierIcon = tierConfig.icon;
                
                return (
                  <Card key={client.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={client.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{getInitials(client.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{client.name}</div>
                          {client.company && (
                            <div className="text-xs text-muted-foreground truncate">{client.company}</div>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/messages?client=${client.id}`)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/appointments/create?client=${client.id}`)}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule Meeting
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {client.status !== 'vip' && (
                            <DropdownMenuItem onClick={() => updateClientStatus(client.id, 'vip')}>
                              <Crown className="mr-2 h-4 w-4" />
                              Mark as VIP
                            </DropdownMenuItem>
                          )}
                          {client.status === 'active' && (
                            <DropdownMenuItem onClick={() => updateClientStatus(client.id, 'inactive')}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Mark Inactive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(client.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={cn("capitalize text-xs", statusConfig[client.status || 'active'].color)}>
                          {statusConfig[client.status || 'active'].label}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <TierIcon className={cn("h-3 w-3", tierConfig.color)} />
                          <span className="capitalize text-xs">{client.loyalty_tier || 'bronze'}</span>
                        </div>
                      </div>
                      
                      {client.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      
                      {client.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Properties:</span>
                          <span className="ml-1 font-medium">{client.total_purchases || 0} bought, {client.total_properties_viewed || 0} viewed</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Lifetime Value:</span>
                          <span className="ml-1 font-semibold">₹{(client.lifetime_value || 0).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {client.last_interaction ? (
                            format(new Date(client.last_interaction), "dd MMM yyyy")
                          ) : (
                            "Never"
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client and all associated data including conversations and appointments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
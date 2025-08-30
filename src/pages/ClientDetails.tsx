import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Trophy,
  Crown,
  Star,
  MessageSquare,
  FileText,
  Home,
  Clock,
  TrendingUp,
  Users,
  Building,
  Briefcase,
  Send,
  Download,
  Upload,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Target,
  ShoppingBag,
  Eye,
  Heart,
  Share2,
  Loader2,
  UserCheck,
  Gift,
  Zap,
  Award,
  PieChart,
  BarChart,
  LineChart,
  Paperclip
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

const statusConfig = {
  active: { 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
    icon: CheckCircle,
    label: "Active"
  },
  inactive: { 
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-800",
    icon: XCircle,
    label: "Inactive"
  },
  prospect: { 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800",
    icon: Target,
    label: "Prospect"
  },
  vip: { 
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800",
    icon: Crown,
    label: "VIP Client"
  }
};

const loyaltyTierConfig = {
  bronze: { 
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    icon: Trophy,
    label: "Bronze",
    benefits: ["Basic Support", "Property Alerts", "Newsletter Access"],
    minPurchases: 0,
    discount: 0
  },
  silver: { 
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950",
    icon: Trophy,
    label: "Silver",
    benefits: ["Priority Support", "Early Access", "5% Discount", "Exclusive Events"],
    minPurchases: 3,
    discount: 5
  },
  gold: { 
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    icon: Trophy,
    label: "Gold",
    benefits: ["VIP Support", "First Priority", "10% Discount", "Personal Agent", "Premium Events"],
    minPurchases: 5,
    discount: 10
  },
  platinum: { 
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    icon: Crown,
    label: "Platinum",
    benefits: ["24/7 Concierge", "15% Discount", "Dedicated Team", "Exclusive Properties", "VIP Everything"],
    minPurchases: 10,
    discount: 15
  }
};

// Mock data for charts
const mockActivityData = [
  { month: 'Jan', interactions: 12, properties: 5, value: 250000 },
  { month: 'Feb', interactions: 15, properties: 8, value: 450000 },
  { month: 'Mar', interactions: 20, properties: 12, value: 780000 },
  { month: 'Apr', interactions: 18, properties: 10, value: 620000 },
  { month: 'May', interactions: 25, properties: 15, value: 920000 },
  { month: 'Jun', interactions: 30, properties: 18, value: 1100000 },
];

const mockPropertyTypes = [
  { name: 'Apartments', value: 45, color: '#3b82f6' },
  { name: 'Villas', value: 30, color: '#8b5cf6' },
  { name: 'Plots', value: 15, color: '#10b981' },
  { name: 'Commercial', value: 10, color: '#f59e0b' },
];

const mockTimeline = [
  {
    id: 1,
    type: 'property_view',
    title: 'Viewed Sunset Villa',
    description: 'Client viewed property details and saved to favorites',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    icon: Eye,
    color: 'text-blue-600'
  },
  {
    id: 2,
    type: 'meeting',
    title: 'Site Visit Scheduled',
    description: 'Scheduled property visit for Sunset Villa',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    icon: Calendar,
    color: 'text-green-600'
  },
  {
    id: 3,
    type: 'communication',
    title: 'WhatsApp Conversation',
    description: 'Discussed property features and pricing',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    icon: MessageSquare,
    color: 'text-purple-600'
  },
  {
    id: 4,
    type: 'document',
    title: 'Document Shared',
    description: 'Shared property brochure and floor plans',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    icon: FileText,
    color: 'text-orange-600'
  },
  {
    id: 5,
    type: 'purchase',
    title: 'Property Purchase',
    description: 'Completed purchase of Garden View Apartment',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    icon: ShoppingBag,
    color: 'text-green-600'
  },
];

export default function ClientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteDialog, setNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageContent, setMessageContent] = useState("");

  useEffect(() => {
    if (id) {
      loadClientDetails();
    }
  }, [id]);

  const loadClientDetails = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getClientById(parseInt(id!));
      setClient(data);
    } catch (error) {
      console.error("Error loading client:", error);
      toast({
        title: "Error",
        description: "Failed to load client details",
        variant: "destructive"
      });
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    setSendingMessage(true);
    // Simulate sending message
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully"
      });
      setMessageContent("");
      setSendingMessage(false);
    }, 1500);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      // Add note logic here
      toast({
        title: "Note Added",
        description: "Note has been added successfully"
      });
      setNewNote("");
      setNoteDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
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

  const statusInfo = statusConfig[client.status || 'active'];
  const StatusIcon = statusInfo.icon;
  const tierInfo = loyaltyTierConfig[client.loyalty_tier || 'bronze'];
  const TierIcon = tierInfo.icon;

  // Calculate progress to next tier
  const currentPurchases = client.total_purchases || 0;
  let nextTier = null;
  let progressToNext = 0;
  
  if (client.loyalty_tier === 'bronze' && currentPurchases < 3) {
    nextTier = 'silver';
    progressToNext = (currentPurchases / 3) * 100;
  } else if (client.loyalty_tier === 'silver' && currentPurchases < 5) {
    nextTier = 'gold';
    progressToNext = ((currentPurchases - 3) / 2) * 100;
  } else if (client.loyalty_tier === 'gold' && currentPurchases < 10) {
    nextTier = 'platinum';
    progressToNext = ((currentPurchases - 5) / 5) * 100;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/clients')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Client Details</h1>
            <p className="text-muted-foreground">View and manage client information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate(`/messages?client=${client.id}`)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button 
            onClick={() => navigate(`/clients/${client.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}/documents`)}>
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}/transactions`)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Transactions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/appointments/create?client=${client.id}`)}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Client Info */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
            <CardContent className="relative p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 ring-4 ring-background shadow-xl">
                  <AvatarImage src={client.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary to-primary/60 text-white">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-1">{client.name}</h2>
                {client.company && (
                  <p className="text-muted-foreground mb-3 flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {client.company}
                  </p>
                )}
                <div className="flex gap-2 mb-4">
                  <Badge className={cn("border", statusInfo.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                  <Badge className={cn("border", tierInfo.bgColor, tierInfo.color)}>
                    <TierIcon className="h-3 w-3 mr-1" />
                    {tierInfo.label}
                  </Badge>
                </div>
                
                {/* Contact Info */}
                <div className="w-full space-y-3 text-left">
                  {client.email && (
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{client.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Joined {client.created_at ? format(new Date(client.created_at), 'MMM dd, yyyy') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loyalty Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                Loyalty Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Tier</span>
                  <span className="font-semibold capitalize">{client.loyalty_tier || 'bronze'}</span>
                </div>
                {nextTier && (
                  <>
                    <Progress value={progressToNext} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {Math.ceil((loyaltyTierConfig[nextTier].minPurchases - currentPurchases))} more purchases to {nextTier}
                    </p>
                  </>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Current Benefits:</p>
                <ul className="space-y-1">
                  {tierInfo.benefits.map((benefit, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Purchases</span>
                <span className="font-bold text-lg">{client.total_purchases || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Properties Viewed</span>
                <span className="font-bold text-lg">{client.total_properties_viewed || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lifetime Value</span>
                <span className="font-bold text-lg">₹{(client.lifetime_value || 0).toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Activity</span>
                <span className="text-sm">
                  {client.last_interaction ? 
                    formatDistanceToNow(new Date(client.last_interaction), { addSuffix: true }) : 
                    'Never'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Track all client interactions and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {mockTimeline.map((item, index) => {
                        const ItemIcon = item.icon;
                        return (
                          <div key={item.id} className="flex gap-4">
                            <div className="relative">
                              <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center bg-background border-2",
                                item.color
                              )}>
                                <ItemIcon className="h-5 w-5" />
                              </div>
                              {index < mockTimeline.length - 1 && (
                                <div className="absolute left-5 top-10 w-0.5 h-full bg-border -translate-x-1/2" />
                              )}
                            </div>
                            <div className="flex-1 pb-8">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-sm">{item.title}</h4>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-auto flex-col gap-2 p-4"
                      onClick={() => setNoteDialog(true)}
                    >
                      <FileText className="h-5 w-5" />
                      <span className="text-xs">Add Note</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto flex-col gap-2 p-4"
                      onClick={() => navigate(`/appointments/create?client=${client.id}`)}
                    >
                      <Calendar className="h-5 w-5" />
                      <span className="text-xs">Schedule</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto flex-col gap-2 p-4"
                      onClick={() => navigate(`/clients/${client.id}/documents`)}
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-xs">Upload Doc</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto flex-col gap-2 p-4"
                      onClick={() => navigate(`/properties?client=${client.id}`)}
                    >
                      <Home className="h-5 w-5" />
                      <span className="text-xs">Show Properties</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 mt-6">
              {/* Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Interaction Trends</CardTitle>
                  <CardDescription>
                    Monthly interaction and property viewing patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockActivityData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="interactions" 
                        stackId="1"
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.6}
                        name="Interactions"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="properties" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.6}
                        name="Properties Viewed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Communication History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Communication History
                    </span>
                    <Button size="sm" onClick={() => navigate(`/clients/${client.id}/communications`)}>
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">WhatsApp Message</span>
                        <span className="text-xs text-muted-foreground">2 hours ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Discussed pricing options for Sunset Villa
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Email Sent</span>
                        <span className="text-xs text-muted-foreground">1 day ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Property brochure and payment plans shared
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Phone Call</span>
                        <span className="text-xs text-muted-foreground">3 days ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Initial consultation about property requirements
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-6 mt-6">
              {/* Property Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Preferences</CardTitle>
                  <CardDescription>
                    Based on viewing history and interactions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Preferred Type</Label>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-primary" />
                        <span className="font-medium">Apartments & Villas</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Budget Range</Label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-medium">₹50L - ₹1.5Cr</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Preferred Location</Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">South Delhi, Gurgaon</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Size Preference</Label>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-primary" />
                        <span className="font-medium">3-4 BHK</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Interest Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Interest Distribution</CardTitle>
                  <CardDescription>
                    Types of properties client is interested in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={mockPropertyTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mockPropertyTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recently Viewed Properties */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recently Viewed Properties</span>
                    <Button size="sm" variant="outline">View All</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                          <Home className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">Sunset Villa #{item}</h4>
                          <p className="text-xs text-muted-foreground">3 BHK • 2,500 sq.ft • South Delhi</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm font-semibold">₹1.2 Cr</span>
                            <Badge variant="secondary" className="text-xs">
                              <Heart className="h-3 w-3 mr-1" />
                              Favorited
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6 mt-6">
              {/* AI Insights */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    AI-Powered Insights
                  </CardTitle>
                  <CardDescription>
                    Smart recommendations based on client behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-sm">High Purchase Intent</p>
                        <p className="text-xs text-muted-foreground">
                          Client has viewed 5+ properties in the last week and engaged in multiple conversations. 
                          Consider scheduling a site visit.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-sm">Increasing Engagement</p>
                        <p className="text-xs text-muted-foreground">
                          30% increase in activity this month. Client is actively searching for properties.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <Gift className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-sm">Loyalty Opportunity</p>
                        <p className="text-xs text-muted-foreground">
                          Client is 1 purchase away from Gold tier. Consider offering exclusive benefits.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Score</CardTitle>
                  <CardDescription>
                    Overall client engagement metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">85/100</span>
                      <Badge className="bg-green-100 text-green-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12% this month
                      </Badge>
                    </div>
                    <Progress value={85} className="h-3" />
                    
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Response Rate</span>
                          <span className="font-medium">92%</span>
                        </div>
                        <Progress value={92} className="h-1.5" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Activity Level</span>
                          <span className="font-medium">78%</span>
                        </div>
                        <Progress value={78} className="h-1.5" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Interest Score</span>
                          <span className="font-medium">88%</span>
                        </div>
                        <Progress value={88} className="h-1.5" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Loyalty Score</span>
                          <span className="font-medium">82%</span>
                        </div>
                        <Progress value={82} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Follow up on Sunset Villa inquiry</p>
                        <p className="text-xs text-muted-foreground">Client showed high interest 2 days ago</p>
                      </div>
                      <Button size="sm">Call Now</Button>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Schedule property tour</p>
                        <p className="text-xs text-muted-foreground">3 properties match client preferences</p>
                      </div>
                      <Button size="sm" variant="outline">Schedule</Button>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Send className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Send personalized property recommendations</p>
                        <p className="text-xs text-muted-foreground">5 new listings match criteria</p>
                      </div>
                      <Button size="sm" variant="outline">Send</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note about this client for future reference
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
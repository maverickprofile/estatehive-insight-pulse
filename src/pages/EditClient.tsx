import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft,
  Save,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  Trophy,
  Crown,
  Star,
  Upload,
  X,
  Check,
  AlertCircle,
  Briefcase,
  Globe,
  Hash,
  MessageSquare,
  Shield,
  Tag,
  UserCheck,
  Zap,
  Camera,
  Loader2,
  ShoppingBag
} from "lucide-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { clientsService } from "@/services/database.service";
import { Client } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";

const statusOptions = [
  { value: "active", label: "Active", icon: Check, color: "text-green-600" },
  { value: "inactive", label: "Inactive", icon: X, color: "text-gray-600" },
  { value: "prospect", label: "Prospect", icon: UserCheck, color: "text-blue-600" },
  { value: "vip", label: "VIP Client", icon: Crown, color: "text-purple-600" }
];

const loyaltyTiers = [
  { value: "bronze", label: "Bronze", icon: Trophy, color: "text-orange-600" },
  { value: "silver", label: "Silver", icon: Trophy, color: "text-gray-600" },
  { value: "gold", label: "Gold", icon: Trophy, color: "text-yellow-600" },
  { value: "platinum", label: "Platinum", icon: Crown, color: "text-purple-600" }
];

const sourceOptions = [
  "Website", "Referral", "Social Media", "Walk-in", "Phone Inquiry", 
  "Email Campaign", "Property Portal", "Agent Network", "Exhibition", "Other"
];

const preferenceOptions = {
  propertyTypes: ["Apartment", "Villa", "Plot", "Commercial", "Farm House", "Studio"],
  budgetRanges: ["< 25L", "25L-50L", "50L-1Cr", "1Cr-2Cr", "2Cr-5Cr", "> 5Cr"],
  locations: ["North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi", "Gurgaon", "Noida", "Faridabad", "Ghaziabad"],
  sizes: ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK", "Studio", "Penthouse"]
};

export default function EditClientPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Form state
  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    status: "active",
    loyalty_tier: "bronze",
    notes: "",
    preferences: {},
    tags: []
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadClient();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getClientById(parseInt(id!));
      setFormData(data);
      if (data.avatar_url) {
        setAvatarPreview(data.avatar_url);
      }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Invalid phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Update client data
      await clientsService.updateClient(parseInt(id!), formData);
      
      toast({
        title: "Success",
        description: "Client updated successfully"
      });
      
      navigate(`/clients/${id}`);
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update client",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await clientsService.deleteClient(parseInt(id!));
      toast({
        title: "Success",
        description: "Client deleted successfully"
      });
      navigate('/clients');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete client",
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
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
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
          <div>
            <h1 className="text-3xl font-bold">Edit Client</h1>
            <p className="text-muted-foreground">Update client information and preferences</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/clients/${id}`)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Essential client details and profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/60 text-white">
                      {formData.name ? getInitials(formData.name) : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
                        <Camera className="h-4 w-4" />
                        <span className="text-sm">Change Photo</span>
                      </div>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={cn("pl-10", errors.name && "border-red-500")}
                        placeholder="Enter client's full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company/Organization</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        name="company"
                        value={formData.company || ""}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-4 w-4", option.color)} />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loyalty_tier">Loyalty Tier</Label>
                    <Select 
                      value={formData.loyalty_tier} 
                      onValueChange={(value) => handleSelectChange("loyalty_tier", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {loyaltyTiers.map((tier) => {
                          const Icon = tier.icon;
                          return (
                            <SelectItem key={tier.value} value={tier.value}>
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-4 w-4", tier.color)} />
                                <span>{tier.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleInputChange}
                    placeholder="Add any internal notes about this client..."
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    These notes are only visible to your team
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  How to reach and communicate with the client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={handleInputChange}
                        className={cn("pl-10", errors.email && "border-red-500")}
                        placeholder="client@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleInputChange}
                        className={cn("pl-10", errors.phone && "border-red-500")}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address || ""}
                      onChange={handleInputChange}
                      className="pl-10 min-h-[80px]"
                      placeholder="Enter complete address..."
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Communication Preferences
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive property updates via email
                        </p>
                      </div>
                      <Switch id="email-notifications" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          Get instant updates via SMS
                        </p>
                      </div>
                      <Switch id="sms-notifications" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="whatsapp-notifications">WhatsApp Updates</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive messages on WhatsApp
                        </p>
                      </div>
                      <Switch id="whatsapp-notifications" defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Preferences</CardTitle>
                <CardDescription>
                  Client's property requirements and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Property Types</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {preferenceOptions.propertyTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`type-${type}`}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`type-${type}`} className="text-sm font-normal cursor-pointer">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Budget Range</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          {preferenceOptions.budgetRanges.map((range) => (
                            <SelectItem key={range} value={range}>
                              {range}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Preferred Size</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size preference" />
                        </SelectTrigger>
                        <SelectContent>
                          {preferenceOptions.sizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Locations</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {preferenceOptions.locations.map((location) => (
                        <div key={location} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`location-${location}`}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`location-${location}`} className="text-sm font-normal cursor-pointer">
                            {location}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="special-requirements">Special Requirements</Label>
                    <Textarea
                      id="special-requirements"
                      placeholder="Any specific requirements or preferences..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Additional client information and metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lead Source</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map((source) => (
                          <SelectItem key={source} value={source.toLowerCase().replace(" ", "-")}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Assigned Agent</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent1">John Smith</SelectItem>
                        <SelectItem value="agent2">Sarah Johnson</SelectItem>
                        <SelectItem value="agent3">Mike Davis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lifetime-value">Lifetime Value</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lifetime-value"
                        type="number"
                        value={formData.lifetime_value || 0}
                        onChange={(e) => handleSelectChange("lifetime_value", e.target.value)}
                        className="pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total-purchases">Total Purchases</Label>
                    <div className="relative">
                      <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="total-purchases"
                        type="number"
                        value={formData.total_purchases || 0}
                        onChange={(e) => handleSelectChange("total_purchases", e.target.value)}
                        className="pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Premium", "Investor", "First-time Buyer", "NRI", "Urgent", "Cash Buyer"].map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add custom tags..."
                    className="mt-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Add tag logic
                      }
                    }}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Account Information</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Client ID: #{formData.id}
                      </p>
                    </div>
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      Joined {formData.created_at ? format(new Date(formData.created_at), 'MMM dd, yyyy') : 'N/A'}
                    </Badge>
                  </div>
                  
                  {formData.updated_at && (
                    <div className="text-xs text-muted-foreground">
                      Last updated: {format(new Date(formData.updated_at), 'PPpp')}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Danger Zone */}
                <div className="border border-red-200 dark:border-red-900 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <h3 className="font-medium">Danger Zone</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Once you delete a client, there is no going back. All associated data will be permanently removed.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Client
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client
              "{formData.name}" and remove all associated data including conversations,
              appointments, and transaction history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
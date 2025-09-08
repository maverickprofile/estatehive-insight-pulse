import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { leadsService } from "@/services/database.service";
import { Lead } from "@/types/database.types";
import {
  ArrowLeft,
  Save,
  Edit,
  Trash2,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Building,
  IndianRupee,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  MessageSquare,
  User,
  Home,
  Briefcase,
  CreditCard,
  FileText,
  Activity,
  ChevronRight,
  Star,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const leadStages = [
  { id: "new", label: "New", color: "bg-blue-500", textColor: "text-blue-600", bgLight: "bg-blue-50 dark:bg-blue-950" },
  { id: "contacted", label: "Contacted", color: "bg-yellow-500", textColor: "text-yellow-600", bgLight: "bg-yellow-50 dark:bg-yellow-950" },
  { id: "qualified", label: "Qualified", color: "bg-purple-500", textColor: "text-purple-600", bgLight: "bg-purple-50 dark:bg-purple-950" },
  { id: "proposal", label: "Proposal", color: "bg-orange-500", textColor: "text-orange-600", bgLight: "bg-orange-50 dark:bg-orange-950" },
  { id: "negotiation", label: "Negotiation", color: "bg-indigo-500", textColor: "text-indigo-600", bgLight: "bg-indigo-50 dark:bg-indigo-950" },
  { id: "closed_won", label: "Won", color: "bg-green-500", textColor: "text-green-600", bgLight: "bg-green-50 dark:bg-green-950" },
  { id: "closed_lost", label: "Lost", color: "bg-red-500", textColor: "text-red-600", bgLight: "bg-red-50 dark:bg-red-950" },
  { id: "on_hold", label: "On Hold", color: "bg-gray-500", textColor: "text-gray-600", bgLight: "bg-gray-50 dark:bg-gray-950" }
];

const priorityOptions = [
  { id: "low", label: "Low", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { id: "normal", label: "Normal", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { id: "high", label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { id: "urgent", label: "Urgent", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" }
];

const qualityRatings = [
  { id: "hot", label: "Hot", icon: "🔥", color: "text-red-600" },
  { id: "warm", label: "Warm", icon: "☀️", color: "text-orange-600" },
  { id: "cold", label: "Cold", icon: "❄️", color: "text-blue-600" }
];

const interestTypes = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" },
  { id: "rent", label: "Rent" },
  { id: "lease", label: "Lease" },
  { id: "invest", label: "Invest" }
];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});

  useEffect(() => {
    if (id) {
      fetchLead();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const data = await leadsService.getLeadById(Number(id));
      setLead(data);
      setFormData(data);
    } catch (error) {
      console.error("Error fetching lead:", error);
      toast({
        title: "Error",
        description: "Failed to load lead details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lead?.id) return;

    try {
      setSaving(true);
      const updatedLead = await leadsService.updateLead(lead.id, formData);
      setLead(updatedLead);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Lead updated successfully"
      });
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lead?.id) return;

    try {
      await leadsService.deleteLead(lead.id);
      toast({
        title: "Success",
        description: "Lead deleted successfully"
      });
      navigate("/leads");
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setFormData(lead || {});
    setIsEditing(false);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getCurrentStage = () => {
    return leadStages.find(s => s.id === formData.stage) || leadStages[0];
  };

  const getCurrentPriority = () => {
    return priorityOptions.find(p => p.id === formData.priority) || priorityOptions[1];
  };

  const getCurrentQuality = () => {
    return qualityRatings.find(q => q.id === formData.quality_rating);
  };

  if (loading) {
    return (
      <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-background via-background to-purple-50/5 dark:to-purple-950/10">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Lead not found</p>
          <Button onClick={() => navigate("/leads")} className="mt-4">
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-background via-background to-purple-50/5 dark:to-purple-950/10">
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/leads")}
              className="hover:bg-white/80 dark:hover:bg-gray-800/80"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {formData.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn(getCurrentStage().bgLight, getCurrentStage().textColor)}>
                  {getCurrentStage().label}
                </Badge>
                <Badge className={getCurrentPriority().color}>
                  {getCurrentPriority().label} Priority
                </Badge>
                {getCurrentQuality() && (
                  <span className={cn("flex items-center gap-1", getCurrentQuality().color)}>
                    <span>{getCurrentQuality().icon}</span>
                    <span className="text-sm font-medium">{getCurrentQuality().label}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: "Convert to client feature will be available soon"
                    });
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Convert to Client
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm" htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">{formData.name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm" htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">{formData.email || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm" htmlFor="phone">Phone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">{formData.phone || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm" htmlFor="alternate_phone">Alternate Phone</Label>
                    {isEditing ? (
                      <Input
                        id="alternate_phone"
                        value={formData.alternate_phone || ""}
                        onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">{formData.alternate_phone || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm" htmlFor="whatsapp_number">WhatsApp</Label>
                    {isEditing ? (
                      <Input
                        id="whatsapp_number"
                        value={formData.whatsapp_number || ""}
                        onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">{formData.whatsapp_number || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm" htmlFor="date_of_birth">Date of Birth</Label>
                    {isEditing ? (
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth || ""}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">{formatDate(formData.date_of_birth)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm" htmlFor="occupation">Occupation</Label>
                    {isEditing ? (
                      <Input
                        id="occupation"
                        value={formData.occupation || ""}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">{formData.occupation || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm" htmlFor="company_name">Company</Label>
                    {isEditing ? (
                      <Input
                        id="company_name"
                        value={formData.company_name || ""}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">{formData.company_name || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm" htmlFor="annual_income">Annual Income</Label>
                    {isEditing ? (
                      <Input
                        id="annual_income"
                        type="number"
                        value={formData.annual_income || ""}
                        onChange={(e) => setFormData({ ...formData, annual_income: Number(e.target.value) })}
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">{formatCurrency(formData.annual_income)}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm" htmlFor="source">Lead Source</Label>
                    {isEditing ? (
                      <Input
                        id="source"
                        value={formData.source || ""}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">{formData.source || "—"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Preferences */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-green-600" />
                  Property Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm" htmlFor="interest_type">Interest Type</Label>
                    {isEditing ? (
                      <Select
                        value={formData.interest_type}
                        onValueChange={(value) => setFormData({ ...formData, interest_type: value as any })}
                      >
                        <SelectTrigger className="mt-1 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {interestTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1 font-medium capitalize">{formData.interest_type || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm" htmlFor="possession_timeline">Possession Timeline</Label>
                    {isEditing ? (
                      <Input
                        id="possession_timeline"
                        value={formData.possession_timeline || ""}
                        onChange={(e) => setFormData({ ...formData, possession_timeline: e.target.value })}
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">{formData.possession_timeline || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Budget Range</Label>
                    {isEditing ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          placeholder="Min"
                          className="text-sm"
                          value={formData.budget_min || ""}
                          onChange={(e) => setFormData({ ...formData, budget_min: Number(e.target.value) })}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          className="text-sm"
                          value={formData.budget_max || ""}
                          onChange={(e) => setFormData({ ...formData, budget_max: Number(e.target.value) })}
                        />
                      </div>
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">
                        {formatCurrency(formData.budget_min)} - {formatCurrency(formData.budget_max)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Area (sq.ft)</Label>
                    {isEditing ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          placeholder="Min"
                          className="text-sm"
                          value={formData.min_area_sqft || ""}
                          onChange={(e) => setFormData({ ...formData, min_area_sqft: Number(e.target.value) })}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          className="text-sm"
                          value={formData.max_area_sqft || ""}
                          onChange={(e) => setFormData({ ...formData, max_area_sqft: Number(e.target.value) })}
                        />
                      </div>
                    ) : (
                      <p className="mt-1 font-medium text-sm sm:text-base">
                        {formData.min_area_sqft || "—"} - {formData.max_area_sqft || "—"} sq.ft
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs sm:text-sm" htmlFor="location_preference">Location Preferences</Label>
                    {isEditing ? (
                      <Textarea
                        id="location_preference"
                        value={formData.location_preference?.join(", ") || ""}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          location_preference: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                        })}
                        className="mt-1 text-sm"
                        placeholder="Enter locations separated by commas"
                      />
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {formData.location_preference?.length ? (
                          formData.location_preference.map((loc, idx) => (
                            <Badge key={idx} variant="secondary">{loc}</Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={6}
                    placeholder="Add notes about this lead..."
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{formData.notes || "No notes added"}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Status & Activity */}
          <div className="space-y-6">
            {/* Lead Management */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Lead Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs sm:text-sm" htmlFor="stage">Stage</Label>
                  {isEditing ? (
                    <Select
                      value={formData.stage}
                      onValueChange={(value) => setFormData({ ...formData, stage: value as any })}
                    >
                      <SelectTrigger className="mt-1 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {leadStages.map(stage => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1 text-sm">
                      <Badge className={cn(getCurrentStage().bgLight, getCurrentStage().textColor)}>
                        {getCurrentStage().label}
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs sm:text-sm" htmlFor="priority">Priority</Label>
                  {isEditing ? (
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                    >
                      <SelectTrigger className="mt-1 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(priority => (
                          <SelectItem key={priority.id} value={priority.id}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1 text-sm">
                      <Badge className={getCurrentPriority().color}>
                        {getCurrentPriority().label}
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs sm:text-sm" htmlFor="quality_rating">Quality Rating</Label>
                  {isEditing ? (
                    <Select
                      value={formData.quality_rating || ""}
                      onValueChange={(value) => setFormData({ ...formData, quality_rating: value as any })}
                    >
                      <SelectTrigger className="mt-1 text-sm">
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        {qualityRatings.map(rating => (
                          <SelectItem key={rating.id} value={rating.id}>
                            <span className="flex items-center gap-2">
                              <span>{rating.icon}</span>
                              <span>{rating.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1 text-sm">
                      {getCurrentQuality() ? (
                        <span className={cn("flex items-center gap-2", getCurrentQuality().color)}>
                          <span>{getCurrentQuality().icon}</span>
                          <span className="font-medium">{getCurrentQuality().label}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs sm:text-sm" htmlFor="score">Lead Score</Label>
                  {isEditing ? (
                    <Input
                      id="score"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.score || 0}
                      onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                      className="mt-1 text-sm"
                    />
                  ) : (
                    <div className="mt-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{formData.score || 0}/100</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Stats */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Activity Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Follow-ups</span>
                  <span className="font-medium">{formData.followup_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Site Visits</span>
                  <span className="font-medium">{formData.site_visits_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Contact</span>
                  <span className="font-medium">{formatDate(formData.last_contact_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Next Follow-up</span>
                  <span className="font-medium">{formatDate(formData.next_followup_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="font-medium">{formatDate(formData.created_at)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs sm:text-sm"
                  onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: "Schedule follow-up feature will be available soon"
                    });
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Follow-up
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs sm:text-sm"
                  onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: "Send message feature will be available soon"
                    });
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs sm:text-sm"
                  onClick={() => {
                    if (formData.phone) {
                      window.location.href = `tel:${formData.phone}`;
                    }
                  }}
                  disabled={!formData.phone}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs sm:text-sm"
                  onClick={() => {
                    if (formData.email) {
                      window.location.href = `mailto:${formData.email}`;
                    }
                  }}
                  disabled={!formData.email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
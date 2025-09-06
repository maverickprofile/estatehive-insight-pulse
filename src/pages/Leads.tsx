import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Building,
  IndianRupee,
  MoreVertical,
  Search,
  Activity,
  Target,
  Edit,
  Trash2,
  CheckCircle,
  Calendar,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Users,
  Filter,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { leadsService } from "@/services/database.service";
import { Lead } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const leadStages = [
  { id: "new", title: "New", color: "bg-blue-500", textColor: "text-blue-600", bgLight: "bg-blue-50 dark:bg-blue-950" },
  { id: "contacted", title: "Contacted", color: "bg-yellow-500", textColor: "text-yellow-600", bgLight: "bg-yellow-50 dark:bg-yellow-950" },
  { id: "qualified", title: "Qualified", color: "bg-purple-500", textColor: "text-purple-600", bgLight: "bg-purple-50 dark:bg-purple-950" },
  { id: "proposal", title: "Proposal", color: "bg-orange-500", textColor: "text-orange-600", bgLight: "bg-orange-50 dark:bg-orange-950" },
  { id: "negotiation", title: "Negotiation", color: "bg-indigo-500", textColor: "text-indigo-600", bgLight: "bg-indigo-50 dark:bg-indigo-950" },
  { id: "won", title: "Won", color: "bg-green-500", textColor: "text-green-600", bgLight: "bg-green-50 dark:bg-green-950" },
  { id: "lost", title: "Lost", color: "bg-red-500", textColor: "text-red-600", bgLight: "bg-red-50 dark:bg-red-950" }
];

const priorityConfig = {
  high: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "High" },
  medium: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "Med" },
  low: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Low" },
  normal: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "Normal" },
  urgent: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Urgent" }
};

export default function LeadsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedStage, setSelectedStage] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadLeads();
  }, [selectedSource, selectedPriority]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (selectedSource !== "all") {
        filters.source = selectedSource;
      }
      if (selectedPriority !== "all") {
        filters.priority = selectedPriority;
      }

      const data = await leadsService.getAllLeads(filters);
      setLeads(data || []);
    } catch (error: any) {
      console.error("Error loading leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      loadLeads();
      return;
    }
    
    try {
      setLoading(true);
      const data = await leadsService.searchLeads(searchTerm);
      setLeads(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await leadsService.deleteLead(deleteId);
      toast({
        title: "Success",
        description: "Lead deleted successfully"
      });
      setDeleteId(null);
      loadLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive"
      });
    }
  };

  const handleStageChange = async (leadId: number, newStage: string) => {
    try {
      await leadsService.updateLead(leadId, { stage: newStage as any });
      toast({
        title: "Success",
        description: "Lead stage updated successfully"
      });
      loadLeads();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead stage",
        variant: "destructive"
      });
    }
  };

  // Drag and drop handlers - disabled on mobile
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    if (isMobile) return; // Disable on mobile
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
    // Add visual feedback
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (isMobile) return; // Disable on mobile
    // Remove visual feedback
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = "1";
    setDraggedLead(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isMobile) return; // Disable on mobile
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    if (isMobile) return; // Disable on mobile
    e.preventDefault();
    e.stopPropagation();
    if (draggedLead && draggedLead.stage !== stageId) {
      await handleStageChange(draggedLead.id, stageId);
    }
    setDraggedLead(null);
  };

  const convertToClient = async (leadId: number) => {
    try {
      await leadsService.convertToClient(leadId);
      toast({
        title: "Success",
        description: "Lead converted to client successfully"
      });
      loadLeads();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to convert lead to client",
        variant: "destructive"
      });
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (searchTerm && 
        !lead.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !lead.phone?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedStage !== "all" && lead.stage !== selectedStage) {
      return false;
    }
    return true;
  });

  const getLeadsByStage = (stageId: string) => {
    return filteredLeads.filter(lead => lead.stage === stageId);
  };

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.stage === "new").length,
    qualified: leads.filter(l => l.stage === "qualified").length,
    won: leads.filter(l => l.stage === "won").length,
    conversion: leads.length > 0 
      ? ((leads.filter(l => l.stage === "won").length / leads.length) * 100).toFixed(1)
      : "0",
    // Add numerator/denominator for clarity
    conversionFraction: {
      numerator: leads.filter(l => l.stage === "won").length,
      denominator: leads.length
    }
  };

  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto">
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold">Leads</h1>
        <Button 
          onClick={() => navigate("/leads/new")}
          size="sm"
          className="h-8 px-3"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span className="hidden xs:inline">Add</span>
        </Button>
      </div>

      {/* Statistics Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Total Leads Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
              {stats.new > 0 && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0 text-[10px] sm:text-xs px-1 sm:px-2 py-0.5">
                  +{stats.new}
                </Badge>
              )}
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5">Total Leads</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {stats.total}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Qualified Leads Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-purple-600 dark:text-purple-400">
                {stats.total > 0 ? Math.round((stats.qualified / stats.total) * 100) : 0}%
              </span>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5">Qualified</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {stats.qualified}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Won Deals Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
              </div>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-0 text-[10px] sm:text-xs px-1 sm:px-2 py-0.5">
                Won
              </Badge>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5">Won Deals</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {stats.won}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5">Conversion</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                {stats.conversion}%
              </p>
              <div className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                {stats.conversionFraction.numerator}/{stats.conversionFraction.denominator}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters - Mobile Optimized */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  ×
                </Button>
              )}
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                  <SelectItem value="voice_crm">Voice CRM</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Stages - Mobile Optimized */}
      <div className="w-full">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {/* Pipeline Overview Header */}
            <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-background to-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Lead Pipeline</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {filteredLeads.length} leads • {leads.filter(l => l.stage === "won").length} converted
                  </p>
                </div>
                {!isMobile && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="animate-pulse">✋</div>
                    <span>Drag to move leads</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stage Headers - Mobile Scrollable */}
            <div className="border-b bg-muted/10 overflow-x-auto">
              <div className="flex min-w-max pb-1">
                {leadStages.map((stage) => {
                  const stageCount = getLeadsByStage(stage.id).length;
                  const isActive = selectedStage === stage.id;
                  const hasLeads = stageCount > 0;
                  
                  return (
                    <div 
                      key={stage.id}
                      className={cn(
                        "min-w-[100px] sm:min-w-[140px] p-2 sm:p-3 border-r last:border-r-0 transition-all relative cursor-pointer flex-shrink-0",
                        isActive && "bg-background shadow-sm",
                        !isActive && "hover:bg-background/50"
                      )}
                      onDragOver={!isMobile ? handleDragOver : undefined}
                      onDrop={!isMobile ? (e) => handleDrop(e, stage.id) : undefined}
                      onClick={() => setSelectedStage(selectedStage === stage.id ? "all" : stage.id)}
                    >
                      <div className="flex flex-col items-center text-center gap-1">
                        <div className="flex flex-col items-center gap-1">
                          <div className={cn("w-2.5 h-2.5 rounded-full", stage.color)} />
                          <span className="font-medium text-xs sm:text-sm">
                            {stage.title}
                          </span>
                        </div>
                        <Badge 
                          variant={hasLeads ? "default" : "secondary"}
                          className={cn(
                            "text-xs px-2 py-0.5 min-w-[24px]",
                            stage.id === "won" && hasLeads && "bg-green-500",
                            stage.id === "lost" && hasLeads && "bg-red-500"
                          )}
                        >
                          {stageCount}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Display Area - Mobile Optimized */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-3 sm:p-4">
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-2 sm:p-3">
              {selectedStage === "all" ? (
                // Show all stages with their leads
                <div className="space-y-4">
                  {leadStages.map((stage) => {
                    const stageLeads = getLeadsByStage(stage.id);
                    if (stageLeads.length === 0 && !searchTerm) return null;
                    
                    return (
                      <div 
                        key={stage.id}
                        className="relative"
                        onDragOver={!isMobile ? handleDragOver : undefined}
                        onDrop={!isMobile ? (e) => handleDrop(e, stage.id) : undefined}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                          <h3 className="font-semibold text-sm sm:text-base">{stage.title}</h3>
                          <span className="text-xs sm:text-sm text-muted-foreground">({stageLeads.length})</span>
                        </div>
                        
                        <div className="grid gap-2 grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {stageLeads.map((lead) => (
                            <Card
                              key={lead.id}
                              className={cn(
                                "transition-all",
                                !isMobile && "cursor-move hover:shadow-lg",
                                stage.bgLight,
                                draggedLead?.id === lead.id && "opacity-50"
                              )}
                              draggable={!isMobile}
                              onDragStart={!isMobile ? (e) => handleDragStart(e, lead) : undefined}
                              onDragEnd={!isMobile ? handleDragEnd : undefined}
                            >
                              <CardHeader className="p-3 pb-2">
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm sm:text-base">{lead.name}</h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      <Badge className={cn("text-[10px] sm:text-xs px-1.5 py-0", priorityConfig[lead.priority || 'medium']?.color || priorityConfig.medium.color)}>
                                        {priorityConfig[lead.priority || 'medium']?.label || lead.priority || 'Medium'}
                                      </Badge>
                                      {lead.source && (
                                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0">
                                          {lead.source}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                                        Edit Lead
                                      </DropdownMenuItem>
                                      {isMobile && (
                                        <>
                                          <DropdownMenuItem onClick={() => handleStageChange(lead.id, 'qualified')}>
                                            Move to Qualified
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStageChange(lead.id, 'won')}>
                                            Mark as Won
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      <DropdownMenuItem 
                                        onClick={() => setDeleteId(lead.id)}
                                        className="text-red-600"
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardHeader>
                              <CardContent className="p-3 pt-1 space-y-1">
                                {lead.email && (
                                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span className="break-all">{lead.email}</span>
                                  </div>
                                )}
                                {lead.phone && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                    <span>{lead.phone}</span>
                                  </div>
                                )}
                                {lead.location && (
                                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-1">{lead.location}</span>
                                  </div>
                                )}
                                {lead.budget_max && (
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                    <IndianRupee className="h-3 w-3 flex-shrink-0" />
                                    <span>₹{(lead.budget_max / 100000).toFixed(0)}L</span>
                                  </div>
                                )}
                                {lead.notes && (
                                  <div className="text-xs text-muted-foreground line-clamp-2 pt-1">
                                    {lead.notes}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        
                        {stageLeads.length === 0 && searchTerm && (
                          <div className="p-4 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
                            No leads found in {stage.title}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Show leads for selected stage
                <div>
                  <div 
                    className="min-h-[200px]"
                    onDragOver={!isMobile ? handleDragOver : undefined}
                    onDrop={!isMobile ? (e) => handleDrop(e, selectedStage) : undefined}
                  >
                    <div className="grid gap-2 grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {getLeadsByStage(selectedStage).map((lead) => {
                        const stage = leadStages.find(s => s.id === lead.stage);
                        return (
                          <Card
                            key={lead.id}
                            className={cn(
                              "transition-all",
                              !isMobile && "cursor-move hover:shadow-lg",
                              stage?.bgLight,
                              draggedLead?.id === lead.id && "opacity-50"
                            )}
                            draggable={!isMobile}
                            onDragStart={!isMobile ? (e) => handleDragStart(e, lead) : undefined}
                            onDragEnd={!isMobile ? handleDragEnd : undefined}
                          >
                            <CardHeader className="p-3 pb-2">
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm sm:text-base">{lead.name}</h4>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <Badge className={cn("text-[10px] sm:text-xs px-1.5 py-0", priorityConfig[lead.priority || 'medium'].color)}>
                                      {priorityConfig[lead.priority || 'medium'].label}
                                    </Badge>
                                    {lead.source && (
                                      <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0">
                                        {lead.source}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                                      Edit Lead
                                    </DropdownMenuItem>
                                    {isMobile && selectedStage !== 'qualified' && (
                                      <DropdownMenuItem onClick={() => handleStageChange(lead.id, 'qualified')}>
                                        Move to Qualified
                                      </DropdownMenuItem>
                                    )}
                                    {isMobile && selectedStage !== 'won' && (
                                      <DropdownMenuItem onClick={() => handleStageChange(lead.id, 'won')}>
                                        Mark as Won
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={() => setDeleteId(lead.id)}
                                      className="text-red-600"
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-1 space-y-1">
                              {lead.email && (
                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span className="break-all">{lead.email}</span>
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  <span>{lead.phone}</span>
                                </div>
                              )}
                              {lead.location && (
                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span className="line-clamp-1">{lead.location}</span>
                                </div>
                              )}
                              {lead.budget_max && (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                  <IndianRupee className="h-3 w-3 flex-shrink-0" />
                                  <span>₹{(lead.budget_max / 100000).toFixed(0)}L</span>
                                </div>
                              )}
                              {lead.notes && (
                                <div className="text-xs text-muted-foreground line-clamp-2 pt-1">
                                  {lead.notes}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    
                    {getLeadsByStage(selectedStage).length === 0 && (
                      <EmptyState
                        icon={Users}
                        title="No leads in this stage"
                        description="Leads will appear here when they reach this stage"
                        action={
                          <Button onClick={() => navigate("/leads/new")} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Lead
                          </Button>
                        }
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </div>
  );
}
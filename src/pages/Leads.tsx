import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Filter
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
  low: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Low" }
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

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
    // Add visual feedback
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Remove visual feedback
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = "1";
    setDraggedLead(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
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
      : "0"
  };

  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto">
      <div className="p-4 space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold">Leads</h1>
        <Button 
          onClick={() => navigate("/leads/new")}
          size="sm"
          className="h-8 px-3"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>

      {/* Statistics Cards - Professional Design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Leads Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              {stats.new > 0 && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0 text-xs px-2 py-0.5">
                  +{stats.new} new
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Leads</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.total}
              </p>
              <div className="mt-2 flex items-center gap-1">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qualified Leads Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                {stats.total > 0 ? Math.round((stats.qualified / stats.total) * 100) : 0}%
              </span>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Qualified</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.qualified}
              </p>
              <div className="mt-2">
                <Progress 
                  value={stats.total > 0 ? (stats.qualified / stats.total) * 100 : 0} 
                  className="h-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Won Deals Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-0 text-xs px-2 py-0.5">
                This month
              </Badge>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Won Deals</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.won}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Active pipeline
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
              </div>
              {parseFloat(stats.conversion) > 50 ? (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-0 text-xs px-2 py-0.5">
                  High
                </Badge>
              ) : parseFloat(stats.conversion) > 25 ? (
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 border-0 text-xs px-2 py-0.5">
                  Medium
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-0 text-xs px-2 py-0.5">
                  Low
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Conversion Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.conversion}%
              </p>
              <div className="mt-2">
                <Progress 
                  value={parseFloat(stats.conversion)} 
                  className="h-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters - Professional Design */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 text-sm border-muted-foreground/20 focus:border-primary"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => setSearchTerm("")}
                >
                  ×
                </Button>
              )}
            </div>
            
            {/* Filter Section */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Filter by Source</label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="h-9 text-sm border-muted-foreground/20">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="All Sources" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-muted" />
                        All Sources
                      </div>
                    </SelectItem>
                    <SelectItem value="Website">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Website
                      </div>
                    </SelectItem>
                    <SelectItem value="Referral">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Referral
                      </div>
                    </SelectItem>
                    <SelectItem value="Facebook">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        Facebook
                      </div>
                    </SelectItem>
                    <SelectItem value="Google Ads">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Google Ads
                      </div>
                    </SelectItem>
                    <SelectItem value="Walk-in">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        Walk-in
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Filter by Priority</label>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="h-9 text-sm border-muted-foreground/20">
                    <div className="flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="All Priorities" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-muted" />
                        All Priorities
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        High Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        Medium Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Low Priority
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Active Filters Display */}
              {(selectedSource !== "all" || selectedPriority !== "all" || searchTerm) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedSource !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Source: {selectedSource}
                      <button
                        onClick={() => setSelectedSource("all")}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedPriority !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Priority: {selectedPriority}
                      <button
                        onClick={() => setSelectedPriority("all")}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Search: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Stages - Professional Design */}
      <div className="w-full">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {/* Pipeline Overview Header */}
            <div className="p-4 border-b bg-gradient-to-r from-background to-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base">Lead Pipeline</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredLeads.length} leads • {leads.filter(l => l.stage === "won").length} converted this month
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Drag leads between stages</span>
                  <div className="flex gap-1">
                    {leadStages.map((stage) => (
                      <div key={stage.id} className={cn("w-2 h-2 rounded-full", stage.color)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stage Headers - Enhanced Design */}
            <div className="border-b bg-muted/10 overflow-x-auto">
              <div className="flex min-w-fit">
                {leadStages.map((stage, index) => {
                  const stageCount = getLeadsByStage(stage.id).length;
                  const isActive = selectedStage === stage.id;
                  const hasLeads = stageCount > 0;
                  
                  return (
                    <div 
                      key={stage.id}
                      className={cn(
                        "flex-1 min-w-[120px] sm:min-w-[140px] p-3 sm:p-4 border-r last:border-r-0 transition-all relative cursor-pointer group",
                        isActive && "bg-background shadow-sm",
                        !isActive && "hover:bg-background/50",
                        draggedLead && draggedLead.stage !== stage.id && "hover:bg-accent/20"
                      )}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, stage.id)}
                      onClick={() => !draggedLead && setSelectedStage(selectedStage === stage.id ? "all" : stage.id)}
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        {/* Stage Indicator */}
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn("w-3 h-3 rounded-full flex-shrink-0 transition-all", 
                            stage.color,
                            hasLeads && "shadow-sm",
                            isActive && "ring-2 ring-offset-2 ring-primary/30"
                          )} />
                          <span className={cn(
                            "font-medium text-xs sm:text-sm transition-colors",
                            isActive && "text-primary",
                            !isActive && "text-foreground"
                          )}>
                            {stage.title}
                          </span>
                        </div>
                        
                        {/* Count Badge */}
                        <Badge 
                          variant={hasLeads ? "default" : "secondary"}
                          className={cn(
                            "text-xs px-2 py-1 min-w-[24px] transition-all",
                            hasLeads && "shadow-sm",
                            isActive && "bg-primary text-primary-foreground",
                            !hasLeads && "bg-muted/50 text-muted-foreground",
                            stage.id === "won" && hasLeads && "bg-green-500 hover:bg-green-600",
                            stage.id === "lost" && hasLeads && "bg-red-500 hover:bg-red-600",
                            stage.id === "qualified" && hasLeads && "bg-purple-500 hover:bg-purple-600",
                            stage.id === "new" && hasLeads && "bg-blue-500 hover:bg-blue-600"
                          )}
                        >
                          {stageCount}
                        </Badge>
                        
                        {/* Progress indicator for active stage */}
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                        )}
                      </div>
                      
                      {/* Drag and drop visual feedback */}
                      {draggedLead && draggedLead.stage !== stage.id && (
                        <div className="absolute inset-0 border-2 border-dashed border-primary/40 rounded bg-primary/5 pointer-events-none flex items-center justify-center">
                          <span className="text-xs font-medium text-primary bg-background px-2 py-1 rounded shadow-sm">
                            Drop here
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Display Area */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-3 sm:p-4 md:p-6">
              <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-24 sm:h-28 md:h-32" />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-2 sm:p-3 md:p-4">
              {selectedStage === "all" ? (
                // Show all stages with their leads
                <div className="space-y-6">
                  {leadStages.map((stage) => {
                    const stageLeads = getLeadsByStage(stage.id);
                    if (stageLeads.length === 0 && !searchTerm) return null;
                    
                    return (
                      <div 
                        key={stage.id}
                        className={cn(
                          "relative p-3 rounded-lg transition-all",
                          draggedLead && draggedLead.stage !== stage.id && "bg-accent/10"
                        )}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                          <h3 className="font-semibold text-lg">{stage.title}</h3>
                          <span className="text-sm text-muted-foreground">({stageLeads.length})</span>
                        </div>
                        
                        {draggedLead && draggedLead.stage !== stage.id && (
                          <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-lg pointer-events-none z-10">
                            <div className="flex items-center justify-center h-full">
                              <div className="bg-background/90 px-4 py-2 rounded-lg border">
                                <p className="text-sm font-medium">Drop here to move to {stage.title}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid gap-2 grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {stageLeads.map((lead) => (
                            <Card
                              key={lead.id}
                              className={cn(
                                "cursor-move hover:shadow-lg transition-all",
                                stage.bgLight,
                                draggedLead?.id === lead.id && "opacity-50"
                              )}
                              draggable
                              onDragStart={(e) => handleDragStart(e, lead)}
                              onDragEnd={handleDragEnd}
                            >
                              <CardHeader className="p-2 sm:p-2.5 md:p-3 pb-1.5 sm:pb-2">
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-xs sm:text-sm truncate">{lead.name}</h4>
                                    <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                                      <Badge className={cn("text-[8px] sm:text-[9px] md:text-[10px] px-1 py-0", priorityConfig[lead.priority || 'medium'].color)}>
                                        {priorityConfig[lead.priority || 'medium'].label}
                                      </Badge>
                                      {lead.source && (
                                        <Badge variant="outline" className="text-[8px] sm:text-[9px] md:text-[10px] px-1 py-0">
                                          {lead.source}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7">
                                        <MoreVertical className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                                        <Edit className="mr-2 h-3 w-3" />
                                        Edit Details
                                      </DropdownMenuItem>
                                      {lead.stage === "qualified" && (
                                        <DropdownMenuItem onClick={() => convertToClient(lead.id)}>
                                          <CheckCircle className="mr-2 h-3 w-3" />
                                          Convert to Client
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem 
                                        onClick={() => setDeleteId(lead.id)}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-3 w-3" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardHeader>
                              <CardContent className="p-2 sm:p-2.5 md:p-3 pt-0 space-y-0.5 sm:space-y-1">
                                {lead.phone && (
                                  <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                                    <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                    <span className="truncate">{lead.phone}</span>
                                  </div>
                                )}
                                {(lead.interest || lead.property_interest) && (
                                  <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                                    <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                    <span className="truncate">{lead.interest || lead.property_interest}</span>
                                  </div>
                                )}
                                {lead.budget && (
                                  <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                                    <IndianRupee className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                    <span className="truncate">{lead.budget}</span>
                                  </div>
                                )}
                                {lead.location && (
                                  <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                    <span className="truncate">{lead.location}</span>
                                  </div>
                                )}
                                <div className="flex gap-0.5 sm:gap-1 pt-1 sm:pt-1.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="flex-1 h-5 sm:h-6 md:h-7 text-[8px] sm:text-[9px] md:text-xs px-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/messages?lead=${lead.id}`);
                                    }}
                                  >
                                    <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                    <span className="hidden sm:inline">Message</span>
                                    <span className="sm:hidden">Msg</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="flex-1 h-5 sm:h-6 md:h-7 text-[8px] sm:text-[9px] md:text-xs px-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/appointments/create?lead=${lead.id}`);
                                    }}
                                  >
                                    <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                    <span className="hidden sm:inline">Schedule</span>
                                    <span className="sm:hidden">Meet</span>
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        
                        {stageLeads.length === 0 && (
                          <div className={cn(
                            "text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg transition-all min-h-[150px] flex flex-col items-center justify-center",
                            draggedLead && draggedLead.stage !== stage.id && "border-primary bg-primary/5"
                          )}>
                            {draggedLead && draggedLead.stage !== stage.id ? (
                              <>
                                <Target className="h-8 w-8 mb-2 text-primary" />
                                <p className="text-sm font-medium text-primary">Drop here to move to {stage.title}</p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm">No leads in {stage.title} stage</p>
                                {searchTerm && <p className="text-xs mt-1">Try adjusting your search</p>}
                                <p className="text-xs mt-2 text-muted-foreground">Drag leads here to update their status</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Show selected stage leads only
                <div>
                  {(() => {
                    const stage = leadStages.find(s => s.id === selectedStage);
                    const stageLeads = getLeadsByStage(selectedStage);
                    
                    return (
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, selectedStage)}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div className={cn("w-4 h-4 rounded-full", stage?.color)} />
                          <h3 className="font-semibold text-xl">{stage?.title}</h3>
                          <span className="text-muted-foreground">({stageLeads.length} leads)</span>
                        </div>
                        
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                          {stageLeads.map((lead) => (
                            <Card
                              key={lead.id}
                              className={cn(
                                "cursor-move hover:shadow-lg transition-all",
                                draggedLead?.id === lead.id && "opacity-50"
                              )}
                              draggable
                              onDragStart={(e) => handleDragStart(e, lead)}
                              onDragEnd={handleDragEnd}
                            >
                              <CardHeader className="p-4 pb-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">{lead.name}</h4>
                                    <div className="flex gap-1 mt-1">
                                      <Badge className={cn("text-xs", priorityConfig[lead.priority || 'medium'].color)}>
                                        {lead.priority || 'medium'}
                                      </Badge>
                                      {lead.source && (
                                        <Badge variant="outline" className="text-xs">
                                          {lead.source}
                                        </Badge>
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
                                      <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Details
                                      </DropdownMenuItem>
                                      {lead.stage === "qualified" && (
                                        <DropdownMenuItem onClick={() => convertToClient(lead.id)}>
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Convert to Client
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem 
                                        onClick={() => setDeleteId(lead.id)}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-0 space-y-2">
                                {lead.email && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{lead.email}</span>
                                  </div>
                                )}
                                {lead.phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{lead.phone}</span>
                                  </div>
                                )}
                                {(lead.interest || lead.property_interest) && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Building className="h-3 w-3" />
                                    <span className="truncate">{lead.interest || lead.property_interest}</span>
                                  </div>
                                )}
                                {lead.budget && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <IndianRupee className="h-3 w-3" />
                                    <span className="truncate">{lead.budget}</span>
                                  </div>
                                )}
                                {lead.location && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{lead.location}</span>
                                  </div>
                                )}
                                <div className="flex gap-2 pt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate(`/messages?lead=${lead.id}`)}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Message
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate(`/appointments/create?lead=${lead.id}`)}
                                  >
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Schedule
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        
                        {stageLeads.length === 0 && (
                          <div className="text-center py-16 text-muted-foreground">
                            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No leads in this stage</p>
                            <p className="text-sm mt-2">Drag leads here or add new ones</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
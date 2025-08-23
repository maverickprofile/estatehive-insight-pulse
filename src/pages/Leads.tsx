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

      {/* Statistics Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card>
          <CardHeader className="p-2 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] font-medium">Total</CardTitle>
              <Activity className="h-3 w-3 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="text-base font-bold">{stats.total}</div>
            <p className="text-[9px] text-muted-foreground">{stats.new} new</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-2 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] font-medium">Qualified</CardTitle>
              <Target className="h-3 w-3 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="text-base font-bold">{stats.qualified}</div>
            <Progress value={stats.qualified / stats.total * 100} className="mt-1 h-1" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-2 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] font-medium">Won</CardTitle>
              <CheckCircle className="h-3 w-3 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="text-base font-bold">{stats.won}</div>
            <p className="text-[9px] text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-2 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] font-medium">Rate</CardTitle>
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="text-base font-bold">{stats.conversion}%</div>
            <Progress value={parseFloat(stats.conversion)} className="mt-1 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="Website">Website</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
              <SelectItem value="Google Ads">Google Ads</SelectItem>
              <SelectItem value="Walk-in">Walk-in</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pipeline Stages - Mobile First */}
      <div className="w-full">
        <Card className="w-full">
          <CardContent className="p-0">
            {/* Stage Headers - Scrollable on Mobile */}
            <div className="border-b bg-muted/30 overflow-x-auto">
              <div className="flex min-w-fit">
              {leadStages.map((stage, index) => (
                <div 
                  key={stage.id}
                  className={cn(
                    "flex-1 min-w-[100px] sm:min-w-0 p-2 sm:p-3 border-r last:border-r-0 transition-all relative cursor-pointer",
                    selectedStage === stage.id && "bg-background",
                    draggedLead && draggedLead.stage !== stage.id && "hover:bg-accent/50"
                  )}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  onClick={() => !draggedLead && setSelectedStage(selectedStage === stage.id ? "all" : stage.id)}
                >
                  <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0", stage.color)} />
                      <span className="font-medium text-[10px] sm:text-xs md:text-sm whitespace-nowrap">{stage.title}</span>
                    </div>
                    <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 h-4 sm:h-5">
                      {getLeadsByStage(stage.id).length}
                    </Badge>
                  </div>
                  {draggedLead && draggedLead.stage !== stage.id && (
                    <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded pointer-events-none" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Leads Display Area */}
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
      </div>

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
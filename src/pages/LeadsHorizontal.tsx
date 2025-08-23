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

export default function LeadsHorizontalPage() {
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
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track and manage your leads through stages</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate("/leads")}
            className="hidden sm:flex"
          >
            <Users className="mr-2 h-4 w-4" />
            Classic View
          </Button>
          <Button 
            onClick={() => navigate("/leads/add")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.new} new this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qualified}</div>
            <Progress value={stats.qualified / stats.total * 100} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.won}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversion}%</div>
            <Progress value={parseFloat(stats.conversion)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search leads by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="w-[140px]">
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
                  <SelectTrigger className="w-[140px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Stages - Horizontal Layout */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Stage Headers */}
          <div className="border-b bg-muted/30">
            <div className="flex">
              {leadStages.map((stage, index) => (
                <div 
                  key={stage.id}
                  className={cn(
                    "flex-1 p-3 border-r last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedStage === stage.id && "bg-background"
                  )}
                  onClick={() => setSelectedStage(selectedStage === stage.id ? "all" : stage.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", stage.color)} />
                      <span className="font-medium text-sm">{stage.title}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getLeadsByStage(stage.id).length}
                    </Badge>
                  </div>
                  {index < leadStages.length - 1 && (
                    <ChevronRight className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Leads Display Area */}
          {loading ? (
            <div className="p-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4">
              {selectedStage === "all" ? (
                // Show all stages with their leads
                <div className="space-y-6">
                  {leadStages.map((stage) => {
                    const stageLeads = getLeadsByStage(stage.id);
                    if (stageLeads.length === 0 && !searchTerm) return null;
                    
                    return (
                      <div 
                        key={stage.id}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                          <h3 className="font-semibold text-lg">{stage.title}</h3>
                          <span className="text-sm text-muted-foreground">({stageLeads.length})</span>
                        </div>
                        
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                          {stageLeads.map((lead) => (
                            <Card
                              key={lead.id}
                              className={cn(
                                "cursor-move hover:shadow-lg transition-all",
                                stage.bgLight
                              )}
                              draggable
                              onDragStart={(e) => handleDragStart(e, lead)}
                            >
                              <CardHeader className="p-3 pb-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{lead.name}</h4>
                                    <div className="flex gap-1 mt-1">
                                      <Badge className={cn("text-[10px]", priorityConfig[lead.priority || 'medium'].color)}>
                                        {priorityConfig[lead.priority || 'medium'].label}
                                      </Badge>
                                      {lead.source && (
                                        <Badge variant="outline" className="text-[10px]">
                                          {lead.source}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreVertical className="h-3 w-3" />
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
                              <CardContent className="p-3 pt-0 space-y-1.5">
                                {lead.email && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{lead.email}</span>
                                  </div>
                                )}
                                {lead.phone && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{lead.phone}</span>
                                  </div>
                                )}
                                {(lead.interest || lead.property_interest) && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Building className="h-3 w-3" />
                                    <span className="truncate">{lead.interest || lead.property_interest}</span>
                                  </div>
                                )}
                                {lead.budget && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <IndianRupee className="h-3 w-3" />
                                    <span className="truncate">{lead.budget}</span>
                                  </div>
                                )}
                                {lead.location && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{lead.location}</span>
                                  </div>
                                )}
                                <div className="flex gap-1 pt-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="flex-1 h-7 text-xs"
                                    onClick={() => navigate(`/messages?lead=${lead.id}`)}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Message
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="flex-1 h-7 text-xs"
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
                          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p className="text-sm">No leads in {stage.title} stage</p>
                            {searchTerm && <p className="text-xs mt-1">Try adjusting your search</p>}
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
                              className="cursor-move hover:shadow-lg transition-all"
                              draggable
                              onDragStart={(e) => handleDragStart(e, lead)}
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
  );
}
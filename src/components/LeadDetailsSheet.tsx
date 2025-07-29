import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  User,
  Building,
  IndianRupee,
  Clock,
  MoreVertical,
  Search,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const leadStages = [
  { id: "new", title: "New Leads", color: "bg-blue-500" },
  { id: "contacted", title: "Contacted", color: "bg-yellow-500" },
  { id: "site-visit", title: "Site Visit", color: "bg-purple-500" },
  { id: "negotiation", title: "Negotiation", color: "bg-orange-500" },
  { id: "closed", title: "Closed", color: "bg-green-500" }
];

const priorityColors: { [key: string]: string } = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-yellow-500 text-white",
  low: "bg-muted text-muted-foreground"
};

const fetchLeads = async () => {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
};

export default function LeadsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: leads = [], isLoading } = useQuery({
      queryKey: ['leads'],
      queryFn: fetchLeads
  });

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.interest && lead.interest.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lead.location && lead.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getLeadsByStage = (stageId: string) => {
    return filteredLeads.filter(lead => lead.stage === stageId);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Leads Management</h1>
          <p className="text-sm text-muted-foreground">Track and manage your sales pipeline</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
          onClick={() => navigate('/leads/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-card p-4 rounded-lg border border-border">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1">Import</Button>
            <Button variant="outline" className="flex-1">Export</Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
            {leadStages.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id);
            return (
                <div key={stage.id}>
                <div className="bg-card rounded-lg border border-border h-full flex flex-col">
                    <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                        <h3 className="font-semibold text-foreground">{stage.title}</h3>
                        <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                        </div>
                    </div>
                    </div>
                    <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    {stageLeads.map((lead) => (
                        <div key={lead.id} className="bg-background p-4 rounded-lg border border-border">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                            <h4 className="font-semibold text-foreground">{lead.name}</h4>
                            <Badge className={cn("mt-1 capitalize", priorityColors[lead.priority as keyof typeof priorityColors])}>
                                {lead.priority}
                            </Badge>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><Phone className="w-4 h-4 flex-shrink-0" /> <span>{lead.phone}</span></div>
                            <div className="flex items-center gap-2"><Mail className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{lead.email}</span></div>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
                </div>
            );
            })}
        </div>
      )}
    </div>
  );
}

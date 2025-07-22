import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  User,
  Building,
  IndianRupee,
  Clock,
  MoreVertical,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

const leadStages = [
  { id: "new", title: "New Leads", color: "bg-blue-500" },
  { id: "contacted", title: "Contacted", color: "bg-yellow-500" },
  { id: "site-visit", title: "Site Visit", color: "bg-purple-500" },
  { id: "negotiation", title: "Negotiation", color: "bg-orange-500" },
  { id: "closed", title: "Closed", color: "bg-green-500" }
];

const leads = [
  {
    id: 1,
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh.kumar@email.com",
    source: "Website",
    interest: "3BHK Apartment",
    location: "Mumbai",
    budget: "₹80L - ₹1.2Cr",
    stage: "new",
    agent: "Rahul Sharma",
    lastContact: "2 hours ago",
    priority: "high"
  },
  {
    id: 2,
    name: "Priya Patel",
    phone: "+91 87654 32109",
    email: "priya.patel@email.com",
    source: "Referral",
    interest: "Villa",
    location: "Bangalore",
    budget: "₹2Cr - ₹3Cr",
    stage: "contacted",
    agent: "Sneha Singh",
    lastContact: "1 day ago",
    priority: "medium"
  },
  {
    id: 3,
    name: "Amit Sharma",
    phone: "+91 76543 21098",
    email: "amit.sharma@email.com",
    source: "Facebook",
    interest: "Commercial Space",
    location: "Delhi",
    budget: "₹50L - ₹80L",
    stage: "site-visit",
    agent: "Raj Gupta",
    lastContact: "3 days ago",
    priority: "high"
  },
  {
    id: 4,
    name: "Sunita Agarwal",
    phone: "+91 65432 10987",
    email: "sunita.agarwal@email.com",
    source: "Google Ads",
    interest: "2BHK Apartment",
    location: "Pune",
    budget: "₹60L - ₹90L",
    stage: "negotiation",
    agent: "Priya Singh",
    lastContact: "1 hour ago",
    priority: "high"
  },
  {
    id: 5,
    name: "Vikram Singh",
    phone: "+91 54321 09876",
    email: "vikram.singh@email.com",
    source: "Walk-in",
    interest: "Independent House",
    location: "Mumbai",
    budget: "₹1.5Cr - ₹2Cr",
    stage: "closed",
    agent: "Rahul Sharma",
    lastContact: "1 week ago",
    priority: "medium"
  }
];

const priorityColors = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-warning text-warning-foreground",
  low: "bg-muted text-muted-foreground"
};

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.interest.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLeadsByStage = (stageId: string) => {
    return filteredLeads.filter(lead => lead.stage === stageId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads Management</h1>
          <p className="text-muted-foreground">Track and manage your sales pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="metric-card">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button variant="outline">Import Leads</Button>
          <Button variant="outline">Export</Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {leadStages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.id);
          return (
            <div key={stage.id} className="min-w-[320px] flex-shrink-0">
              <div className="metric-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                    <h3 className="font-semibold text-foreground">{stage.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {stageLeads.length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {stageLeads.map((lead) => (
                    <div key={lead.id} className="property-card p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{lead.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={priorityColors[lead.priority as keyof typeof priorityColors]} variant="secondary">
                              {lead.priority}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{lead.interest}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{lead.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4" />
                          <span>{lead.budget}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>{lead.agent}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{lead.lastContact}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Mail className="w-3 h-3 mr-1" />
                          Email
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {leadStages.map((stage) => {
          const count = getLeadsByStage(stage.id).length;
          return (
            <div key={stage.id} className="metric-card text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                <span className="text-sm font-medium text-foreground">{stage.title}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const priorityColors: { [key: string]: string } = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-yellow-500 text-white",
  low: "bg-muted text-muted-foreground"
};

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.interest.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.location.toLowerCase().includes(searchTerm.toLowerCase())
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
          onClick={() => setIsAddLeadModalOpen(true)}
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
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                  {stageLeads.map((lead) => (
                    <div key={lead.id} className="bg-background p-4 rounded-lg border border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{lead.name}</h4>
                          <Badge className={cn("mt-1 capitalize", priorityColors[lead.priority])}>
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
                        <div className="flex items-center gap-2"><Building className="w-4 h-4 flex-shrink-0" /> <span>{lead.interest}</span></div>
                        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 flex-shrink-0" /> <span>{lead.location}</span></div>
                        <div className="flex items-center gap-2"><IndianRupee className="w-4 h-4 flex-shrink-0" /> <span>{lead.budget}</span></div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><User className="w-3 h-3" /><span>{lead.agent}</span></div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3 h-3" /><span>{lead.lastContact}</span></div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1"><Phone className="w-3 h-3 mr-1" /> Call</Button>
                        <Button variant="outline" size="sm" className="flex-1"><Mail className="w-3 h-3 mr-1" /> Email</Button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {leadStages.map((stage) => {
          const count = getLeadsByStage(stage.id).length;
          return (
            <div key={stage.id} className="bg-card p-4 rounded-lg border border-border text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                <span className="text-sm font-medium text-foreground">{stage.title}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      <Dialog open={isAddLeadModalOpen} onOpenChange={setIsAddLeadModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Fill in the details for the new lead. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">Name</label>
              <Input id="name" placeholder="e.g., Rajesh Kumar" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="phone" className="text-right">Phone</label>
              <Input id="phone" placeholder="e.g., +91 98765 43210" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">Email</label>
              <Input id="email" type="email" placeholder="e.g., rajesh.k@email.com" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="interest" className="text-right">Interest</label>
              <Input id="interest" placeholder="e.g., 3BHK Apartment" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="budget" className="text-right">Budget</label>
              <Input id="budget" placeholder="e.g., ₹80L - ₹1.2Cr" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="stage" className="text-right">Stage</label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Lead</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="site-visit">Site Visit</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

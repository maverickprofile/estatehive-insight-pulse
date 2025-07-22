import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Star,
  Building
} from "lucide-react";

const clients = [
  {
    id: 1,
    name: "Rajesh Kumar",
    email: "rajesh.kumar@email.com",
    phone: "+91 98765 43210",
    location: "Mumbai",
    status: "active",
    propertiesViewed: 5,
    lastActivity: "2 days ago",
    rating: 4.5,
    budget: "₹80L - ₹1.2Cr",
    source: "Website",
    agent: "Rahul Sharma"
  },
  {
    id: 2,
    name: "Priya Patel",
    email: "priya.patel@email.com",
    phone: "+91 87654 32109",
    location: "Bangalore",
    status: "prospect",
    propertiesViewed: 12,
    lastActivity: "1 week ago",
    rating: 5.0,
    budget: "₹2Cr - ₹3Cr",
    source: "Referral",
    agent: "Sneha Singh"
  },
  {
    id: 3,
    name: "Amit Sharma",
    email: "amit.sharma@email.com",
    phone: "+91 76543 21098",
    location: "Delhi",
    status: "closed",
    propertiesViewed: 3,
    lastActivity: "1 month ago",
    rating: 4.8,
    budget: "₹50L - ₹80L",
    source: "Facebook",
    agent: "Raj Gupta"
  },
  {
    id: 4,
    name: "Sunita Agarwal",
    email: "sunita.agarwal@email.com",
    phone: "+91 65432 10987",
    location: "Pune",
    status: "negotiating",
    propertiesViewed: 8,
    lastActivity: "3 hours ago",
    rating: 4.2,
    budget: "₹60L - ₹90L",
    source: "Google Ads",
    agent: "Priya Singh"
  },
  {
    id: 5,
    name: "Vikram Singh",
    email: "vikram.singh@email.com",
    phone: "+91 54321 09876",
    location: "Mumbai",
    status: "active",
    propertiesViewed: 15,
    lastActivity: "1 day ago",
    rating: 4.7,
    budget: "₹1.5Cr - ₹2Cr",
    source: "Walk-in",
    agent: "Rahul Sharma"
  }
];

const statusColors = {
  active: "bg-success text-success-foreground",
  prospect: "bg-primary text-primary-foreground",
  negotiating: "bg-warning text-warning-foreground",
  closed: "bg-accent text-accent-foreground",
  inactive: "bg-muted text-muted-foreground"
};

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(null);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">Manage your client relationships and interactions</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="metric-card">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline">Import</Button>
              <Button variant="outline">Export</Button>
            </div>

            {/* Clients Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Properties Viewed</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow 
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedClient(client)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">{client.rating}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span>{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[client.status as keyof typeof statusColors]} variant="secondary">
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{client.propertiesViewed}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">{client.budget}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{client.lastActivity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Client Summary */}
        <div className="space-y-4">
          <div className="metric-card text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {clients.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Clients</div>
          </div>
          
          <div className="metric-card text-center">
            <div className="text-2xl font-bold text-success mb-1">
              {clients.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active Clients</div>
          </div>
          
          <div className="metric-card text-center">
            <div className="text-2xl font-bold text-warning mb-1">
              {clients.filter(c => c.status === 'negotiating').length}
            </div>
            <div className="text-sm text-muted-foreground">In Negotiation</div>
          </div>
          
          <div className="metric-card text-center">
            <div className="text-2xl font-bold text-accent mb-1">
              {clients.filter(c => c.status === 'closed').length}
            </div>
            <div className="text-sm text-muted-foreground">Closed Deals</div>
          </div>
        </div>
      </div>

      {/* Client Detail Modal/Panel */}
      {selectedClient && (
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Client Profile</h3>
            <Button variant="ghost" onClick={() => setSelectedClient(null)}>×</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-foreground">{selectedClient.name}</h4>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[selectedClient.status as keyof typeof statusColors]} variant="secondary">
                      {selectedClient.status.charAt(0).toUpperCase() + selectedClient.status.slice(1)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{selectedClient.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedClient.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedClient.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedClient.location}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-background/50 p-4 rounded-lg">
                <h5 className="font-semibold text-foreground mb-2">Preferences</h5>
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Budget:</span> <span className="font-medium">{selectedClient.budget}</span></div>
                  <div><span className="text-muted-foreground">Source:</span> <span className="font-medium">{selectedClient.source}</span></div>
                  <div><span className="text-muted-foreground">Agent:</span> <span className="font-medium">{selectedClient.agent}</span></div>
                  <div><span className="text-muted-foreground">Properties Viewed:</span> <span className="font-medium">{selectedClient.propertiesViewed}</span></div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
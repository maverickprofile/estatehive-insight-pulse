import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
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
  Star, 
  Loader2
} from "lucide-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const statusColors = {
  active: "bg-green-100 text-green-800",
  prospect: "bg-blue-100 text-blue-800",
  negotiating: "bg-yellow-100 text-yellow-800",
  closed: "bg-gray-500 text-white",
};

const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
};

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: clients = [], isLoading } = useQuery({
      queryKey: ['clients'],
      queryFn: fetchClients
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">Manage your client relationships and interactions</p>
        </div>
        <Button onClick={() => navigate('/clients/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="metric-card">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
                placeholder="Search clients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
            />
        </div>
      </div>
      
      <div className="metric-card overflow-x-auto">
        {isLoading ? (
            <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                        <div className="font-medium text-foreground">{client.name}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {client.rating || 'N/A'}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="text-sm">{client.phone}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("capitalize", statusColors[client.status as keyof typeof statusColors])} variant="secondary">
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.budget}</TableCell>
                    <TableCell>{format(new Date(client.last_activity), "PPP")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        )}
      </div>
    </div>
  );
}

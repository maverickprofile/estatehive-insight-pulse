import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agentsService } from "@/services/agents.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2, UserPlus, MapPin, Phone, Mail, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
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

export default function AgentsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [locationFilter, setLocationFilter] = useState("all");
    const [specializationFilter, setSpecializationFilter] = useState("all");
    const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);

    const { data: agents = [], isLoading } = useQuery({
        queryKey: ['agents'],
        queryFn: () => agentsService.getAllAgents()
    });

    const deleteAgentMutation = useMutation({
        mutationFn: agentsService.deleteAgent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            toast({
                title: "Success",
                description: "Agent deleted successfully",
            });
            setDeleteAgentId(null);
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to delete agent",
                variant: "destructive",
            });
        },
    });

    const filteredAgents = useMemo(() => {
        return agents.filter(agent => {
            const matchesSearch = searchTerm === '' || 
                agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (agent.email && agent.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (agent.phone && agent.phone.includes(searchTerm));
            
            const matchesLocation = locationFilter === 'all' || agent.location === locationFilter;
            
            const matchesSpecialization = specializationFilter === 'all' || 
                (agent.specialization && agent.specialization.includes(specializationFilter));
            
            return matchesSearch && matchesLocation && matchesSpecialization;
        });
    }, [agents, searchTerm, locationFilter, specializationFilter]);
    
    const locations = useMemo(() => {
        const uniqueLocations = Array.from(new Set(agents.map(a => a.location).filter(Boolean)));
        return ['all', ...uniqueLocations];
    }, [agents]);
    
    const specializations = useMemo(() => {
        const allSpecs = agents.flatMap(a => a.specialization || []);
        const uniqueSpecs = Array.from(new Set(allSpecs));
        return ['all', ...uniqueSpecs];
    }, [agents]);

    const handleDelete = (e: React.MouseEvent, agentId: string) => {
        e.stopPropagation();
        setDeleteAgentId(agentId);
    };

    const handleEdit = (e: React.MouseEvent, agentId: string) => {
        e.stopPropagation();
        navigate(`/agents/edit/${agentId}`);
    };

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Agents</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">Manage your team of property agents.</p>
                </div>
                <Button onClick={() => navigate('/agents/new')} className="w-full sm:w-auto">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Add Agent
                </Button>
            </div>

            <div className="metric-card space-y-3 sm:space-y-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
                        <Input 
                            placeholder="Search by name, email, or phone..." 
                            className="pl-9 sm:pl-10 text-sm" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Filter by Location" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map(loc => (
                                    <SelectItem key={loc} value={loc}>
                                        {loc === 'all' ? 'All Locations' : loc}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Filter by Specialization" />
                            </SelectTrigger>
                            <SelectContent>
                                {specializations.map(spec => (
                                    <SelectItem key={spec} value={spec}>
                                        {spec === 'all' ? 'All Specializations' : spec}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
                    <span>Showing {filteredAgents.length} of {agents.length} agents</span>
                    <span>{agents.filter(a => a.is_active).length} active agents</span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-32 sm:h-64">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
                </div>
            ) : filteredAgents.length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4">
                    <UserPlus className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No agents found</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">Try adjusting your filters or add a new agent</p>
                    <Button onClick={() => navigate('/agents/new')} className="w-full sm:w-auto">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Add First Agent
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredAgents.map(agent => (
                        <div key={agent.id} className="metric-card hover:shadow-lg transition-shadow p-4 sm:p-6">
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
                                    <AvatarImage src={agent.avatar_url} />
                                    <AvatarFallback className="text-xs sm:text-sm">{agent.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 sm:h-8 sm:w-8"
                                        onClick={(e) => handleEdit(e, agent.id)}
                                    >
                                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 sm:h-8 sm:w-8 text-destructive"
                                        onClick={(e) => handleDelete(e, agent.id)}
                                    >
                                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div>
                                    <h3 className="font-semibold text-base sm:text-lg truncate">{agent.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            agent.is_active ? 'bg-green-500' : 'bg-gray-400'
                                        )} />
                                        <span className="text-xs sm:text-sm text-muted-foreground">
                                            {agent.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                
                                {agent.email && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                        <span className="truncate">{agent.email}</span>
                                    </div>
                                )}
                                
                                {agent.phone && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                        <span className="truncate">{agent.phone}</span>
                                    </div>
                                )}
                                
                                {agent.location && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                        <span className="truncate">{agent.location}</span>
                                    </div>
                                )}
                                
                                {agent.specialization && agent.specialization.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {agent.specialization.slice(0, 2).map((spec, idx) => (
                                            <span
                                                key={idx}
                                                className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary/10 text-primary text-xs rounded-full truncate"
                                            >
                                                {spec}
                                            </span>
                                        ))}
                                        {agent.specialization.length > 2 && (
                                            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted text-muted-foreground text-xs rounded-full">
                                                +{agent.specialization.length - 2}
                                            </span>
                                        )}
                                    </div>
                                )}
                                
                                {agent.experience_years && (
                                    <div className="text-xs sm:text-sm text-muted-foreground mt-2">
                                        {agent.experience_years} years experience
                                    </div>
                                )}
                                
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                                    <div className="text-xs sm:text-sm">
                                        {agent.rating && (
                                            <span className="font-semibold">⭐ {agent.rating.toFixed(1)}</span>
                                        )}
                                    </div>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="w-full sm:w-auto text-xs sm:text-sm"
                                        onClick={() => navigate(`/agents/${agent.id}`)}
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <AlertDialog open={!!deleteAgentId} onOpenChange={() => setDeleteAgentId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this agent? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteAgentId && deleteAgentMutation.mutate(deleteAgentId)}
                            className="bg-destructive text-destructive-foreground"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

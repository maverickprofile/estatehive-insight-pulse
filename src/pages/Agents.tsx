import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2, UserPlus, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const fetchAgents = async () => {
    const { data, error } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
};

export default function AgentsPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [locationFilter, setLocationFilter] = useState("all");

    const { data: agents = [], isLoading } = useQuery({
        queryKey: ['agents'],
        queryFn: fetchAgents
    });

    const filteredAndGroupedAgents = useMemo(() => {
        const filtered = agents.filter(agent =>
            (agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (agent.email && agent.email.toLowerCase().includes(searchTerm.toLowerCase()))) &&
            (locationFilter === 'all' || agent.location === locationFilter)
        );

        return filtered.reduce((acc, agent) => {
            const location = agent.location || 'Unassigned';
            if (!acc[location]) {
                acc[location] = [];
            }
            acc[location].push(agent);
            return acc;
        }, {} as Record<string, typeof agents>);
    }, [agents, searchTerm, locationFilter]);
    
    const locations = useMemo(() => ['all', ...Array.from(new Set(agents.map(a => a.location).filter(Boolean)))], [agents]);

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Agents</h1>
                    <p className="text-sm text-muted-foreground">Manage your team of property agents.</p>
                </div>
                <Button onClick={() => navigate('/agents/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Agent
                </Button>
            </div>

            <div className="metric-card flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Search by name or email..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filter by Location" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        {locations.map(loc => (
                            <SelectItem key={loc} value={loc}>
                                {loc === 'all' ? 'All Locations' : loc}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(filteredAndGroupedAgents).map(([location, agentsInLocation]) => (
                        <div key={location}>
                            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center"><MapPin className="w-5 h-5 mr-2 text-primary" /> {location}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {agentsInLocation.map(agent => (
                                    <div key={agent.id} className="relative w-full aspect-[7/9] rounded-3xl overflow-hidden shadow-lg group cursor-pointer" onClick={() => navigate(`/agents/${agent.id}`)}>
                                        <img 
                                            src={agent.avatar_url || 'https://via.placeholder.com/400x600'} 
                                            alt={agent.name} 
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-4 flex flex-col justify-between">
                                            <div className="text-white text-center backdrop-blur-sm bg-black/20 rounded-xl p-2">
                                                <h3 className="text-lg font-bold tracking-tight">{agent.name}</h3>
                                                {/* <div className="flex items-center justify-center text-xs opacity-80 mt-1">
                                                    <div className={cn("w-2 h-2 mr-1.5 rounded-full", agent.is_active ? 'bg-green-400' : 'bg-red-400')}></div>
                                                    <span>{agent.is_active ? 'Active' : 'Inactive'}</span>
                                                </div> */}
                                            </div>
                                            <div className="flex items-center justify-between backdrop-blur-sm bg-black/20 rounded-xl p-2">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-8 h-8 border-2 border-white/50">
                                                        <AvatarImage src={agent.avatar_url} />
                                                        <AvatarFallback>{agent.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-white font-semibold text-xs">@{agent.name?.toLowerCase().replace(' ', '') || 'agent'}</p>
                                                    </div>
                                                </div>
                                                <Button variant="secondary" size="sm" className="h-8 text-xs">
                                                    <UserPlus className="w-3 h-3 mr-1" />
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

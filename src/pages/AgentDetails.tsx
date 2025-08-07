import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Mail, Phone, Edit, BarChart2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const fetchAgentDetails = async (id: string) => {
    const { data, error } = await supabase.rpc('get_agent_details', { agent_id_param: id }).single();
    if (error) throw new Error(error.message);
    return data;
};

const formatRevenue = (value: number | null) => {
    if (value === null || value === undefined) return '₹0';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString()}`;
};

export default function AgentDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const { data, isLoading } = useQuery({
        queryKey: ['agentDetails', id],
        queryFn: () => fetchAgentDetails(id!),
        enabled: !!id,
    });

    const agent = data?.agent_details;
    const properties = data?.listed_properties || [];

    // Dummy data for the performance chart, to be replaced with real data
    const performanceData = [
        { month: 'Jan', sales: 4 }, { month: 'Feb', sales: 3 },
        { month: 'Mar', sales: 5 }, { month: 'Apr', sales: 4 },
        { month: 'May', sales: 6 }, { month: 'Jun', sales: 5 },
    ];

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="p-4 md:p-6 space-y-6">
            <Button variant="outline" onClick={() => navigate('/agents')}><ArrowLeft className="w-4 h-4 mr-2" />Back to Agents</Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Agent Profile */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="metric-card">
                        <div className="relative h-24 bg-gradient-to-r from-primary to-green-400 rounded-t-lg -m-6 mb-12"></div>
                        <div className="flex flex-col items-center -mt-20">
                            <Avatar className="w-28 h-28 border-4 border-card shadow-lg">
                                <AvatarImage src={agent?.avatar_url} />
                                <AvatarFallback className="text-3xl">{agent?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <h2 className="text-2xl font-bold mt-4">{agent?.name}</h2>
                            <p className="text-muted-foreground">@{agent?.name?.toLowerCase().replace(' ', '') || 'agent'}</p>
                        </div>
                        <div className="mt-6 space-y-3 text-sm">
                            <div className="flex items-center"><Mail className="w-4 h-4 mr-3 text-muted-foreground" /><span>{agent?.email}</span></div>
                            <div className="flex items-center"><Phone className="w-4 h-4 mr-3 text-muted-foreground" /><span>{agent?.phone}</span></div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button className="flex-1"><Mail className="w-4 h-4 mr-2"/>Send Message</Button>
                            <Button variant="outline"><Edit className="w-4 h-4"/></Button>
                        </div>
                    </div>
                    <div className="metric-card">
                        <h3 className="font-semibold mb-2">Bio</h3>
                        <p className="text-sm text-muted-foreground">{agent?.bio || "No biography provided for this agent."}</p>
                    </div>
                </div>

                {/* Right Column: Performance & Listings */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="metric-card">
                            <h3 className="text-muted-foreground font-medium">Total Revenue</h3>
                            <p className="text-3xl font-bold text-success">{formatRevenue(data?.total_revenue)}</p>
                        </div>
                        <div className="metric-card">
                            <h3 className="text-muted-foreground font-medium">Properties Sold</h3>
                            <p className="text-3xl font-bold">{data?.properties_sold || 0}</p>
                        </div>
                    </div>
                    <div className="metric-card">
                         <h3 className="text-lg font-semibold mb-4">Performance (Last 6 Months)</h3>
                         <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={performanceData}>
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <Tooltip />
                                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="metric-card">
                        <h3 className="text-lg font-semibold mb-4">Listed Properties ({properties.length})</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {properties.map((prop: any) => (
                                    <TableRow key={prop.id} onClick={() => navigate(`/properties/${prop.id}`)} className="cursor-pointer">
                                        <TableCell className="font-medium">{prop.title}</TableCell>
                                        <TableCell><Badge variant={prop.status === 'active' ? 'default' : 'secondary'}>{prop.status}</Badge></TableCell>
                                        <TableCell className="font-semibold">{prop.price}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}

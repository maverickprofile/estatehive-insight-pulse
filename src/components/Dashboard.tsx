import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Building2, Users, TrendingUp, IndianRupee, Plus, UserPlus, Loader2, Crown } from "lucide-react";
import MetricCard from "./MetricCard";
import SalesChart from "./SalesChart";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import property1 from "@/assets/property1.jpg"; // Fallback image
import { Skeleton } from "@/components/ui/skeleton";

// --- API Functions for Real-time Data ---

const fetchRecentProperties = async () => {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5); // Fetching 5 for a better carousel experience
    if (error) throw new Error(error.message);
    return data;
};

const fetchDashboardMetrics = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        { count: totalProperties },
        { count: activeListings },
        { count: leadsToday },
        { data: salesThisMonth }
    ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
        supabase.from('sales').select('sale_price').gte('sale_date', monthStart.toISOString())
    ]);

    const revenueThisMonth = salesThisMonth?.reduce((sum, sale) => sum + sale.sale_price, 0) || 0;
    return { totalProperties, activeListings, leadsToday, revenueThisMonth };
};

const fetchTopAgents = async () => {
    const { data, error } = await supabase.rpc('get_top_agents');
    if (error) {
        console.error("Error fetching top agents:", error);
        throw new Error(error.message);
    }
    return data;
};

// --- Helper Function ---
const formatRevenue = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString()}`;
};

// --- Main Dashboard Component ---
export default function Dashboard() {
  const navigate = useNavigate();

  const { data: recentProperties = [], isLoading: isLoadingProperties } = useQuery({ queryKey: ['recentProperties'], queryFn: fetchRecentProperties });
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({ queryKey: ['dashboardMetrics'], queryFn: fetchDashboardMetrics });
  const { data: topAgents = [], isLoading: isLoadingAgents } = useQuery({ queryKey: ['topAgents'], queryFn: fetchTopAgents });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your real-time overview.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/properties/new')}><Plus className="w-4 h-4 mr-2" /> Add Property</Button>
          <Button variant="outline" onClick={() => navigate('/leads/new')}><UserPlus className="w-4 h-4 mr-2" /> Add Lead</Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingMetrics ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
            <>
                <MetricCard title="Total Properties" value={metrics?.totalProperties?.toLocaleString() || '0'} change="+12%" icon={Building2} iconColor="text-primary" />
                <MetricCard title="Leads Today" value={metrics?.leadsToday?.toLocaleString() || '0'} change="+8%" icon={Users} iconColor="text-accent" />
                <MetricCard title="Revenue This Month" value={formatRevenue(metrics?.revenueThisMonth || 0)} change="+15%" icon={IndianRupee} iconColor="text-success" />
                <MetricCard title="Active Listings" value={metrics?.activeListings?.toLocaleString() || '0'} change="-2%" changeType="negative" icon={TrendingUp} iconColor="text-warning" />
            </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Top Performing Agents</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/agents')}>View All</Button>
          </div>
          <div className="space-y-4">
            {isLoadingAgents ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
            ) : (
                topAgents.map((agent, index) => (
                  <div key={agent.name} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                          <AvatarImage src={agent.avatar_url} alt={agent.name} />
                          <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground flex items-center">
                          {agent.name}
                          {index === 0 && <Crown className="w-4 h-4 ml-2 text-yellow-500 fill-yellow-400" />}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-success">
                      {formatRevenue(agent.total_revenue)}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
      
      {/* Recently Added Properties Carousel */}
      <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Recently Added Properties</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/properties')}>View All</Button>
          </div>
          {isLoadingProperties ? (
              <div className="flex justify-center items-center h-[350px]">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
          ) : (
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                  <CarouselContent className="-ml-4">
                      {recentProperties.map((property) => (
                          <CarouselItem key={property.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                              <div className="p-1">
                                  <div className="cursor-pointer group relative flex flex-col bg-card shadow-sm border border-border rounded-lg w-full hover:shadow-lg transition-shadow duration-300">
                                      <div className="relative h-48 m-2 overflow-hidden rounded-md">
                                          <img 
                                              className="transition-transform duration-500 ease-in-out transform group-hover:scale-110 w-full h-full object-cover"
                                              src={property.image_urls?.[0] || property1} 
                                              alt={property.title} 
                                          />
                                      </div>
                                      <div className="p-4">
                                          <h6 className="mb-2 text-foreground text-lg font-semibold truncate">{property.title}</h6>
                                          <p className="text-muted-foreground leading-normal font-light text-sm line-clamp-2 h-10">
                                              {property.description || `A wonderful ${property.category} located in ${property.location}.`}
                                          </p>
                                      </div>
                                      <div className="px-4 pb-4 pt-0 mt-2">
                                          <Button className="w-full" onClick={() => navigate(`/properties/${property.id}`)}>
                                              View Property
                                          </Button>
                                      </div>
                                  </div>
                              </div>
                          </CarouselItem>
                      ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                  <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
              </Carousel>
          )}
      </div>
    </div>
  );
}

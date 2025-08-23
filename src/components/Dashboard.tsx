import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Users,
  TrendingUp,
  IndianRupee,
  PlusSquare,
  UserPlus,
  Crown,
  MessageSquare,
  CalendarCheck,
  FileText,
  Send,
  PlusCircle,
  Bell,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import PropertyCard from "./PropertyCard";
import SalesChart from "./SalesChart";
import property1 from "@/assets/property1.jpg";

type Property = {
  id: string;
  image_url?: string;
  title?: string;
  location?: string;
  price?: number;
  status?: "active" | "sold" | "rented" | null;
  listing_type?: "sale" | "rent" | null;
};

type Agent = {
  name: string;
  avatar_url?: string;
  total_revenue: number;
};

type Notification = {
  id: string;
  title: string;
  description: string;
};

const fetchRecentProperties = async () => {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);
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
    { data: salesThisMonth },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("sales")
      .select("sale_price")
      .gte("sale_date", monthStart.toISOString()),
  ]);

  const revenueThisMonth =
    salesThisMonth?.reduce((sum, sale) => sum + sale.sale_price, 0) || 0;
  return { totalProperties, activeListings, leadsToday, revenueThisMonth };
};

const fetchTopAgents = async () => {
  const { data, error } = await supabase.rpc("get_top_agents");
  if (error) throw new Error(error.message);
  return data;
};

const fetchProfile = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", session.user.id)
    .single();

  if (error) throw error;
  return { id: session.user.id, ...data };
};

const fetchNotifications = async (userId: string) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, description")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data;
};

const formatRevenue = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString()}`;
};

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
}

function KpiCard({ title, value, icon: Icon }: KpiCardProps) {
  return (
    <div className="metric-card p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold truncate">{value}</p>
        </div>
        <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

const CARD_CLASS = "metric-card";

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  const { data: metrics } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: fetchDashboardMetrics,
  });

  const { data: recentProperties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ["recent-properties"],
    queryFn: fetchRecentProperties,
  });

  const { data: topAgents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["top-agents"],
    queryFn: fetchTopAgents,
  });

  const { data: notifications = [], isLoading: loadingNotifications } = useQuery({
    queryKey: ["dashboard-notifications", profile?.id],
    queryFn: () => fetchNotifications(profile!.id),
    enabled: !!profile?.id,
  });

  const maxAgentRevenue = topAgents?.[0]?.total_revenue || 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Estate Hive Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Agent"}! Here's your real-time overview.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button onClick={() => navigate("/properties/new")} className="flex items-center justify-center gap-2 text-sm">
            <PlusSquare className="h-4 w-4" /> 
            <span className="hidden sm:inline">Add Property</span>
            <span className="sm:hidden">Property</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/leads/new")}
            className="flex items-center justify-center gap-2 text-sm"
          >
            <UserPlus className="h-4 w-4" /> 
            <span className="hidden sm:inline">Add Lead</span>
            <span className="sm:hidden">Lead</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Properties"
          value={metrics ? `${metrics.totalProperties}` : "..."}
          icon={Building2}
        />
        <KpiCard
          title="Leads Today"
          value={metrics ? `${metrics.leadsToday}` : "..."}
          icon={Users}
        />
        <KpiCard
          title="Revenue"
          value={metrics ? formatRevenue(metrics.revenueThisMonth) : "..."}
          icon={IndianRupee}
        />
        <KpiCard
          title="Active"
          value={metrics ? `${metrics.activeListings}` : "..."}
          icon={TrendingUp}
        />
      </div>

      {/* Chart and Agents */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <div className={CARD_CLASS}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Monthly Performance</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/analytics")}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">View Full Reports</span>
                <span className="sm:hidden">View All</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <SalesChart />
            </div>
            <div className="mt-4 grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 text-xs sm:text-sm text-muted-foreground">
              <p>Highest Revenue Month: --</p>
              <p>Average Leads per Month: --</p>
            </div>
          </div>

          <div className={CARD_CLASS}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Recent Properties</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/properties")}
                className="text-xs sm:text-sm"
              >
                View All <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Button>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {loadingProperties
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 sm:h-28 rounded-lg" />
                  ))
                : recentProperties.slice(0, 6).map((property: Property) => (
                    <PropertyCard
                      key={property.id}
                      image={property.image_url || property1}
                      title={property.title || "Property"}
                      location={property.location || "N/A"}
                      price={formatRevenue(property.price || 0)}
                      status={property.status}
                      type={property.listing_type}
                    />
                  ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={CARD_CLASS}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Top Agents</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/agents")}
                className="text-xs sm:text-sm"
              >
                View All <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-80 overflow-y-auto">
              {loadingAgents
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 sm:h-20 rounded-lg" />
                  ))
                : topAgents.slice(0, 5).map((agent: Agent, index: number) => (
                    <div key={agent.name} className="flex items-center gap-2 sm:gap-3">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                        <AvatarImage src={agent.avatar_url} alt={agent.name} />
                        <AvatarFallback className="text-xs sm:text-sm">{agent.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold flex items-center gap-1 truncate">
                          {agent.name}
                          {index === 0 && <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-accent flex-shrink-0" />}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Revenue: {formatRevenue(agent.total_revenue)}
                        </p>
                        <Progress
                          value={
                            maxAgentRevenue
                              ? (agent.total_revenue / maxAgentRevenue) * 100
                              : 0
                          }
                          className="h-1.5 sm:h-2 mt-1 sm:mt-2"
                        />
                      </div>
                      <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  ))}
            </div>
          </div>

          <div className={CARD_CLASS}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 sm:gap-2 h-16 sm:h-20 md:h-24 p-2"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs text-center">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 sm:gap-2 h-16 sm:h-20 md:h-24 p-2"
              >
                <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs text-center">Schedule</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 sm:gap-2 h-16 sm:h-20 md:h-24 p-2"
              >
                <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs text-center">Add Task</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 sm:gap-2 h-16 sm:h-20 md:h-24 p-2"
              >
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-xs text-center">Report</span>
              </Button>
            </div>

            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Notifications</h3>
            <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
              {loadingNotifications
                ? Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 sm:h-16 rounded-lg" />
                  ))
                : notifications.length > 0
                ? notifications.slice(0, 5).map((n: Notification) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background/50"
                    >
                      <Bell className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 sm:mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium truncate">{n.title}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                          {n.description}
                        </p>
                      </div>
                    </div>
                  ))
                : (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                      No new notifications
                    </p>
                  )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

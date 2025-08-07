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
    <div className="rounded-3xl p-6 bg-neutral-100 text-gray-800 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] dark:bg-neutral-800 dark:text-gray-100 dark:shadow-[8px_8px_16px_#0a0a0a,-8px_-8px_16px_#262626]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-800 shadow-[inset_2px_2px_5px_#BABECC,inset_-5px_-5px_10px_#FFFFFF] dark:shadow-[inset_2px_2px_5px_#0a0a0a,inset_-5px_-5px_10px_#262626]">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

const NEUMORPH_CARD =
  "rounded-2xl p-6 bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0a0a0a,-8px_-8px_16px_#262626]";

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
{/*         <div className="flex items-center gap-4">
          <img src="/EH_Logo.svg" alt="Estate Hive Logo" className="h-10 w-auto" />
          <div> */}
            <h1 className="text-2xl font-bold">Estate Hive Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {profile?.full_name?.split(" ")[0] || "Agent"}! Here's your real-time overview.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/properties/new")} className="flex items-center gap-2">
            <PlusSquare className="h-4 w-4" /> Add Property
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/leads/new")}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" /> Add Lead
          </Button>
          // <Avatar
          //   className="h-10 w-10 cursor-pointer"
          //   onClick={() => navigate("/profile")}
          // >
          //   <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
          //   <AvatarFallback>
          //     {profile?.full_name
          //       ? profile.full_name
          //           .split(" ")
          //           .map((n) => n[0])
          //           .join("")
          //           .slice(0, 2)
          //       : "AG"}
          //   </AvatarFallback>
          // </Avatar>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          title="Revenue This Month"
          value={metrics ? formatRevenue(metrics.revenueThisMonth) : "..."}
          icon={IndianRupee}
        />
        <KpiCard
          title="Active Listings"
          value={metrics ? `${metrics.activeListings}` : "..."}
          icon={TrendingUp}
        />
      </div>

      {/* Chart and Agents */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className={NEUMORPH_CARD}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Monthly Performance Overview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/analytics")}
              >
                View Full Reports <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <SalesChart />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
              <p>Highest Revenue Month: --</p>
              <p>Average Leads per Month: --</p>
            </div>
          </div>

          <div className={NEUMORPH_CARD}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recently Added Properties</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/properties")}
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loadingProperties
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-lg" />
                  ))
                : recentProperties.map((property: Property) => (
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
          <div className={NEUMORPH_CARD}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Top Performing Agents</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/agents")}
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {loadingAgents
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))
                : topAgents.map((agent: Agent, index: number) => (
                    <div key={agent.name} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={agent.avatar_url} alt={agent.name} />
                        <AvatarFallback>{agent.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold flex items-center gap-1">
                          {agent.name}
                          {index === 0 && <Crown className="h-4 w-4 text-accent" />}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total Revenue: {formatRevenue(agent.total_revenue)}
                        </p>
                        <Progress
                          value={
                            maxAgentRevenue
                              ? (agent.total_revenue / maxAgentRevenue) * 100
                              : 0
                          }
                          className="h-2 mt-2"
                        />
                      </div>
                      <Button size="icon" variant="ghost" className="rounded-full">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
            </div>
          </div>

          <div className={NEUMORPH_CARD}>
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-2 h-24"
              >
                <Send className="h-5 w-5" />
                <span className="text-xs">Send WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-2 h-24"
              >
                <CalendarCheck className="h-5 w-5" />
                <span className="text-xs">Schedule Tour</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-2 h-24"
              >
                <PlusCircle className="h-5 w-5" />
                <span className="text-xs">Add Task</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-2 h-24"
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">Generate Report</span>
              </Button>
            </div>

            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {loadingNotifications
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))
                : notifications.length > 0
                ? notifications.map((n: Notification) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background/50"
                    >
                      <Bell className="h-4 w-4 mt-1" />
                      <div>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {n.description}
                        </p>
                      </div>
                    </div>
                  ))
                : (
                    <p className="text-sm text-muted-foreground">
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

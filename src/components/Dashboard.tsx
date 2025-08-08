import { useEffect, useState } from "react";
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
  MessageSquare,
  CalendarCheck,
  FileText,
  Send,
  PlusCircle,
  Bell,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
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
  deals: number;
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
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    { count: totalProperties },
    { count: propertiesLastMonth },
    { count: activeListings },
    { count: activeListingsLastMonth },
    { count: leadsToday },
    { count: leadsYesterday },
    { data: salesThisMonth },
    { data: salesLastMonth },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .lt("created_at", monthStart.toISOString()),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .lt("created_at", monthStart.toISOString()),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterdayStart.toISOString())
      .lt("created_at", todayStart.toISOString()),
    supabase
      .from("sales")
      .select("sale_price")
      .gte("sale_date", monthStart.toISOString()),
    supabase
      .from("sales")
      .select("sale_price")
      .gte("sale_date", lastMonthStart.toISOString())
      .lte("sale_date", lastMonthEnd.toISOString()),
  ]);

  const revenueThisMonth =
    salesThisMonth?.reduce((sum, sale) => sum + sale.sale_price, 0) || 0;
  const revenueLastMonth =
    salesLastMonth?.reduce((sum, sale) => sum + sale.sale_price, 0) || 0;

  const calcChange = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    totalProperties,
    activeListings,
    leadsToday,
    revenueThisMonth,
    changes: {
      totalProperties: calcChange(totalProperties, propertiesLastMonth),
      activeListings: calcChange(activeListings, activeListingsLastMonth),
      leadsToday: calcChange(leadsToday, leadsYesterday ?? 0),
      revenueThisMonth: calcChange(revenueThisMonth, revenueLastMonth),
    },
  };
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
  value: number;
  change: number;
  icon: LucideIcon;
  formatter?: (v: number) => string;
}

function AnimatedNumber({
  value,
  formatter,
}: {
  value: number;
  formatter?: (v: number) => string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame: number;
    const duration = 1000;
    const start = performance.now();
    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplay(Math.floor(progress * value));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const formatted = formatter ? formatter(display) : display.toLocaleString();
  return <span className="text-3xl font-bold">{formatted}</span>;
}

function KpiCard({ title, value, change, icon: Icon, formatter }: KpiCardProps) {
  const isPositive = change >= 0;
  return (
    <div className="metric-card animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <AnimatedNumber value={value} formatter={formatter} />
            <span
              className={`flex items-center text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {isPositive ? (
                <ArrowUpRight className="mr-0.5 h-3 w-3" />
              ) : (
                <ArrowDownRight className="mr-0.5 h-3 w-3" />
              )}
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="p-3 rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

const CARD_CLASS =
  "metric-card animate-in fade-in slide-in-from-bottom-2";

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
  const [range, setRange] = useState<"7d" | "30d" | "ytd">("30d");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estate Hive Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Agent"}! Here's your real-time overview.
          </p>
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Properties"
          value={metrics?.totalProperties || 0}
          change={metrics?.changes.totalProperties || 0}
          icon={Building2}
        />
        <KpiCard
          title="Leads Today"
          value={metrics?.leadsToday || 0}
          change={metrics?.changes.leadsToday || 0}
          icon={Users}
        />
        <KpiCard
          title="Revenue This Month"
          value={metrics?.revenueThisMonth || 0}
          change={metrics?.changes.revenueThisMonth || 0}
          icon={IndianRupee}
          formatter={formatRevenue}
        />
        <KpiCard
          title="Active Listings"
          value={metrics?.activeListings || 0}
          change={metrics?.changes.activeListings || 0}
          icon={TrendingUp}
        />
      </div>

      {/* Chart and Agents */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className={CARD_CLASS}>
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
            <div className="flex gap-2 mb-4">
              {[
                { label: "Last 7 days", value: "7d" },
                { label: "30 days", value: "30d" },
                { label: "YTD", value: "ytd" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={range === opt.value ? "default" : "outline"}
                  onClick={() => setRange(opt.value as "7d" | "30d" | "ytd")}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <SalesChart range={range} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
              <p>Highest Revenue Month: --</p>
              <p>Average Leads per Month: --</p>
            </div>
          </div>

          <div className={CARD_CLASS}>
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
          <div className={CARD_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Top Performing Agents</h3>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-accent/10"
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
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={agent.avatar_url} alt={agent.name} />
                          <AvatarFallback>{agent.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <span
                            className={`absolute -top-1 -left-1 h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                              index === 0
                                ? "bg-yellow-400"
                                : index === 1
                                ? "bg-gray-300"
                                : "bg-orange-400"
                            }`}
                          >
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {agent.deals} deals · {formatRevenue(agent.total_revenue)}
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

          <div className={CARD_CLASS}>
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-2 h-24 transition hover:-translate-y-1 hover:shadow-lg hover:bg-primary/10"
              >
                <Send className="h-6 w-6" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-2 h-24 transition hover:-translate-y-1 hover:shadow-lg hover:bg-primary/10"
              >
                <CalendarCheck className="h-6 w-6" />
                <span className="text-xs">Tour</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-2 h-24 transition hover:-translate-y-1 hover:shadow-lg hover:bg-primary/10"
              >
                <PlusCircle className="h-6 w-6" />
                <span className="text-xs">Task</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-2 h-24 transition hover:-translate-y-1 hover:shadow-lg hover:bg-primary/10"
              >
                <FileText className="h-6 w-6" />
                <span className="text-xs">Report</span>
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

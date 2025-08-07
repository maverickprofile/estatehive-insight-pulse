import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import SalesChart from "./SalesChart";
import property1 from "@/assets/property1.jpg";

// --- API Functions for Real-time Data ---

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
  if (error) {
    console.error("Error fetching top agents:", error);
    throw new Error(error.message);
  }
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

// --- Helper Function ---
const formatRevenue = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString()}`;
};

// --- Main Dashboard Component ---
export default function Dashboard() {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  const userId = profile?.id;

  const {
    data: recentProperties = [],
    isLoading: isLoadingProperties,
  } = useQuery({ queryKey: ["recentProperties"], queryFn: fetchRecentProperties });

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: fetchDashboardMetrics,
  });

  const { data: topAgents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ["topAgents"],
    queryFn: fetchTopAgents,
  });

  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
  });

  const getInitials = (name?: string) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U";

  const maxAgentRevenue = topAgents.reduce(
    (max: number, agent: any) => Math.max(max, agent.total_revenue),
    0
  );

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <img src="/EH_Logo.svg" alt="Estate Hive" className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-bold">Estate Hive Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.full_name || "User"}! Here's your real-time
              overview.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate("/properties/new")} className="shadow-md">
            <PlusSquare className="w-4 h-4 mr-2" /> Add Property
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/leads/new")}
            className="shadow-md"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Add Lead
          </Button>
          <Avatar
            className="cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            <AvatarImage
              src={profile?.avatar_url || undefined}
              alt={profile?.full_name}
            />
            <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingMetrics ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))
        ) : (
          <>
            <div className="bg-neutral-100 rounded-3xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] hover:shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF] transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">Total Properties</p>
                  <p className="text-4xl font-bold mt-2">
                    {metrics?.totalProperties?.toLocaleString() || "0"}
                  </p>
                  <p className="text-sm text-green-600 mt-1">+12%</p>
                </div>
                <div className="p-4 rounded-full shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF]">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="bg-neutral-100 rounded-3xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] hover:shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF] transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">Leads Today</p>
                  <p className="text-4xl font-bold mt-2">
                    {metrics?.leadsToday?.toLocaleString() || "0"}
                  </p>
                  <p className="text-sm text-green-600 mt-1">+8%</p>
                </div>
                <div className="p-4 rounded-full shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF]">
                  <Users className="w-6 h-6 text-accent" />
                </div>
              </div>
            </div>
            <div className="bg-neutral-100 rounded-3xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] hover:shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF] transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">Revenue This Month</p>
                  <p className="text-4xl font-bold mt-2">
                    {formatRevenue(metrics?.revenueThisMonth || 0)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">+15%</p>
                </div>
                <div className="p-4 rounded-full shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF]">
                  <IndianRupee className="w-6 h-6 text-success" />
                </div>
              </div>
            </div>
            <div className="bg-neutral-100 rounded-3xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff] hover:shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF] transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">Active Listings</p>
                  <p className="text-4xl font-bold mt-2">
                    {metrics?.activeListings?.toLocaleString() || "0"}
                  </p>
                  <p className="text-sm text-red-500 mt-1">-2%</p>
                </div>
                <div className="p-4 rounded-full shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF]">
                  <TrendingUp className="w-6 h-6 text-warning" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Sales Chart */}
          <div className="bg-neutral-100 rounded-3xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
            <SalesChart />
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Highest Revenue Month: Jul '25 - ₹6,800,000
                </p>
                <p className="text-sm font-medium">
                  Average Leads per Month: 175
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/analytics")}>
                View Full Reports
              </Button>
            </div>
          </div>

          {/* Recently Added Properties */}
          <div className="bg-neutral-100 rounded-3xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Recently Added Properties
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/properties")}>
                View All
              </Button>
            </div>
            {isLoadingProperties ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentProperties.map((property: any) => (
                  <div
                    key={property.id}
                    className="rounded-2xl overflow-hidden shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF] bg-neutral-100"
                  >
                    <div className="h-40 overflow-hidden">
                      <img
                        src={property.image_urls?.[0] || property1}
                        alt={property.title}
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold truncate">{property.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {property.location}
                      </p>
                      <p className="text-primary font-bold mt-2">
                        {formatRevenue(property.price || 0)}
                      </p>
                      <Button
                        className="w-full mt-4"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Top Performing Agents */}
          <div className="bg-neutral-100 rounded-3xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Top Performing Agents</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/agents")}
              >
                View All
              </Button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {isLoadingAgents ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))
              ) : (
                topAgents.map((agent: any, index: number) => (
                  <div
                    key={agent.name}
                    className="p-3 rounded-xl bg-neutral-100 shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={agent.avatar_url} alt={agent.name} />
                        <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold flex items-center gap-1">
                          {agent.name}
                          {index === 0 && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
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
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-full"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions & Notifications */}
          <div className="bg-neutral-100 rounded-3xl p-6 shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-24 rounded-2xl shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF]"
              >
                <Send className="w-5 h-5" />
                <span className="text-xs">Send Bulk WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-24 rounded-2xl shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF]"
              >
                <CalendarCheck className="w-5 h-5" />
                <span className="text-xs">Schedule Tour</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-24 rounded-2xl shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF]"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="text-xs">Add New Task</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-24 rounded-2xl shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF]"
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs">Generate Report</span>
              </Button>
            </div>

            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {isLoadingNotifications ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))
              ) : notifications.length > 0 ? (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-neutral-100 flex items-start gap-3 shadow-[inset_2px_2px_5px_#BABECC,_inset_-5px_-5px_10px_#FFFFFF]"
                  >
                    <Bell className="w-4 h-4 mt-1" />
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
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

